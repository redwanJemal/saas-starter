// app/api/admin/packages/receiving/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  packages, 
  incomingShipmentItems, 
  customerProfiles,
  users 
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { notifyPackageReceived } from '@/lib/utils/notifications';

interface PackageReceivingData {
  assignedItemId: string;
  description: string;
  weightActualKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  estimatedValue?: number;
  estimatedValueCurrency?: string;
  senderName?: string;
  senderCompany?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresAdultSignature?: boolean;
  isRestricted?: boolean;
  warehouseNotes?: string;
  specialInstructions?: string;
}

async function generateInternalId(tenantId: string): Promise<string> {
  // Generate a unique internal ID for the package
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Get the count of packages created today for this tenant
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(packages)
    .where(
      and(
        eq(packages.tenantId, tenantId),
        sql`${packages.createdAt} >= ${todayStart.toISOString()}`,
        sql`${packages.createdAt} < ${todayEnd.toISOString()}`
      )
    );
  
  const sequence = ((countResult?.count || 0) + 1).toString().padStart(4, '0');
  return `PKG${year}${month}${day}${sequence}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create');
    const body = await request.json();
    const packageData: PackageReceivingData = body;

    // Validate required fields
    if (!packageData.assignedItemId || !packageData.description || !packageData.weightActualKg) {
      return NextResponse.json(
        { error: 'Assigned item ID, description, and weight are required' },
        { status: 400 }
      );
    }

    // Verify the assigned item exists and hasn't been processed yet
    const [assignedItem] = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierName: incomingShipmentItems.courierName,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        assignedCustomerProfileId: incomingShipmentItems.assignedCustomerProfileId,
        warehouseId: incomingShipmentItems.warehouseId,
        tenantId: incomingShipmentItems.tenantId,
        // Check if package already exists
        existingPackageId: packages.id,
      })
      .from(incomingShipmentItems)
      .leftJoin(packages, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .where(
        and(
          eq(incomingShipmentItems.id, packageData.assignedItemId),
          eq(incomingShipmentItems.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (!assignedItem) {
      return NextResponse.json(
        { error: 'Assigned item not found' },
        { status: 404 }
      );
    }

    if (assignedItem.assignmentStatus !== 'assigned') {
      return NextResponse.json(
        { error: 'Item must be assigned to a customer before receiving' },
        { status: 400 }
      );
    }

    if (assignedItem.existingPackageId) {
      return NextResponse.json(
        { error: 'Package has already been created for this item' },
        { status: 409 }
      );
    }

    if (!assignedItem.assignedCustomerProfileId) {
      return NextResponse.json(
        { error: 'Item must be assigned to a customer profile' },
        { status: 400 }
      );
    }

    // Generate internal package ID
    const internalId = await generateInternalId(adminUser.tenantId);

    // Calculate volumetric weight if dimensions provided
    let volumetricWeightKg = null;
    let chargeableWeightKg = packageData.weightActualKg;

    if (packageData.lengthCm && packageData.widthCm && packageData.heightCm) {
      // Standard volumetric weight calculation (L x W x H cm / 5000)
      volumetricWeightKg = (packageData.lengthCm * packageData.widthCm * packageData.heightCm) / 5000;
      chargeableWeightKg = Math.max(packageData.weightActualKg, volumetricWeightKg);
    }

    // Create the package
    const [newPackage] = await db
      .insert(packages)
      .values({
        tenantId: adminUser.tenantId,
        customerProfileId: assignedItem.assignedCustomerProfileId,
        warehouseId: assignedItem.warehouseId,
        incomingShipmentItemId: assignedItem.id,
        internalId,
        trackingNumberInbound: assignedItem.trackingNumber,
        courierName: assignedItem.courierName,
        senderTrackingUrl: assignedItem.courierTrackingUrl,
        description: packageData.description,
        weightActualKg: packageData.weightActualKg.toString(),
        lengthCm: packageData.lengthCm?.toString(),
        widthCm: packageData.widthCm?.toString(),
        heightCm: packageData.heightCm?.toString(),
        volumetricWeightKg: volumetricWeightKg?.toString(),
        chargeableWeightKg: chargeableWeightKg.toString(),
        estimatedValue: packageData.estimatedValue?.toString() || '0',
        estimatedValueCurrency: packageData.estimatedValueCurrency || 'USD',
        senderName: packageData.senderName,
        senderCompany: packageData.senderCompany,
        isFragile: packageData.isFragile || false,
        isHighValue: packageData.isHighValue || false,
        requiresAdultSignature: packageData.requiresAdultSignature || false,
        isRestricted: packageData.isRestricted || false,
        warehouseNotes: packageData.warehouseNotes,
        specialInstructions: packageData.specialInstructions,
        status: 'received',
        receivedAt: new Date(),
        processedBy: adminUser.id,
        processedAt: new Date(),
      })
      .returning();

    // Update the incoming shipment item status
    await db
      .update(incomingShipmentItems)
      .set({
        assignmentStatus: 'received',
        updatedAt: new Date(),
      })
      .where(eq(incomingShipmentItems.id, packageData.assignedItemId));

    // Get customer info for notification
    const [customerInfo] = await db
      .select({
        customerId: customerProfiles.customerId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(customerProfiles)
      .leftJoin(users, eq(customerProfiles.userId, users.id))
      .where(eq(customerProfiles.id, assignedItem.assignedCustomerProfileId))
      .limit(1);

    // Send notification to customer
    try {
      await notifyPackageReceived(
        adminUser.tenantId,
        assignedItem.assignedCustomerProfileId,
        newPackage.id,
        internalId
      );
    } catch (notificationError) {
      console.error('Failed to send package received notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      package: {
        id: newPackage.id,
        internalId: newPackage.internalId,
        trackingNumber: assignedItem.trackingNumber,
        status: newPackage.status,
        customerProfileId: assignedItem.assignedCustomerProfileId,
        customerId: customerInfo?.customerId,
        customerName: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim(),
      },
    });

  } catch (error) {
    console.error('Error creating package:', error);
    
    // Handle unique constraint violation for internal ID
    if (error instanceof Error && error.message.includes('packages_internal_id_unique')) {
      return NextResponse.json(
        { error: 'Internal ID conflict. Please try again.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}