import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, customerProfiles, users, warehouses, packageStatusHistory, packageDocuments } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const packageId = params.id;

    // Get package details with related data
    const [packageDetails] = await db
      .select({
        // Package fields
        id: packages.id,
        internalId: packages.internalId,
        suiteCodeCaptured: packages.suiteCodeCaptured,
        trackingNumberInbound: packages.trackingNumberInbound,
        senderName: packages.senderName,
        senderCompany: packages.senderCompany,
        senderTrackingUrl: packages.senderTrackingUrl,
        description: packages.description,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        status: packages.status,
        expectedArrivalDate: packages.expectedArrivalDate,
        receivedAt: packages.receivedAt,
        readyToShipAt: packages.readyToShipAt,
        storageExpiresAt: packages.storageExpiresAt,
        warehouseNotes: packages.warehouseNotes,
        customerNotes: packages.customerNotes,
        specialInstructions: packages.specialInstructions,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
        requiresAdultSignature: packages.requiresAdultSignature,
        isRestricted: packages.isRestricted,
        processedAt: packages.processedAt,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        // Customer fields
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        // Warehouse fields
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        warehouseCity: warehouses.city,
        warehouseCountry: warehouses.countryCode,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!packageDetails) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get status history
    const statusHistory = await db
      .select({
        id: packageStatusHistory.id,
        status: packageStatusHistory.status,
        notes: packageStatusHistory.notes,
        changeReason: packageStatusHistory.changeReason,
        createdAt: packageStatusHistory.createdAt,
        changedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        changedByEmail: users.email,
      })
      .from(packageStatusHistory)
      .leftJoin(users, eq(packageStatusHistory.changedBy, users.id))
      .where(eq(packageStatusHistory.packageId, packageId))
      .orderBy(desc(packageStatusHistory.createdAt));

    // Get documents
    const documents = await db
      .select({
        id: packageDocuments.id,
        documentType: packageDocuments.documentType,
        fileName: packageDocuments.fileName,
        fileUrl: packageDocuments.fileUrl,
        fileSizeBytes: packageDocuments.fileSizeBytes,
        mimeType: packageDocuments.mimeType,
        isPublic: packageDocuments.isPublic,
        uploadNotes: packageDocuments.uploadNotes,
        createdAt: packageDocuments.createdAt,
        uploadedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      })
      .from(packageDocuments)
      .leftJoin(users, eq(packageDocuments.uploadedBy, users.id))
      .where(eq(packageDocuments.packageId, packageId))
      .orderBy(desc(packageDocuments.createdAt));

    return NextResponse.json({
      package: packageDetails,
      statusHistory,
      documents,
    });
  } catch (error) {
    console.error('Error fetching package details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const packageId = params.id;
    const body = await request.json();

    // Check if package exists
    const [existingPackage] = await db
      .select({ id: packages.id, status: packages.status })
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Update package
    const [updatedPackage] = await db
      .update(packages)
      .set({
        ...body,
        updatedAt: sql`now()`,
      })
      .where(eq(packages.id, packageId))
      .returning();

    // If status changed, add to history
    if (body.status && body.status !== existingPackage.status) {
      await db.insert(packageStatusHistory).values({
        packageId: packageId,
        status: body.status,
        notes: body.statusNotes || `Status changed to ${body.status}`,
        changedBy: adminUser.id,
        changeReason: body.changeReason || 'manual_update',
      });
    }

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}