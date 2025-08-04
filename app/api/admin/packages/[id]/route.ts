// app/api/admin/packages/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  packages, 
  customerProfiles, 
  users, 
  warehouses, 
  packageStatusHistory, 
  packageDocuments,
  documents,
  incomingShipmentItems,
  incomingShipments,
  couriers 
} from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { RouteContext } from '@/lib/utils/route';

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    await requirePermission('packages.read');
    
    // Properly await params before using
    const packageId = (await RouteContext.params).id;

    // Get package details with enhanced relationships - optimized query
    const [packageDetails] = await db
      .select({
        // Package fields
        id: packages.id,
        tenantId: packages.tenantId,
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
        chargeableWeightKg: packages.chargeableWeightKg,
        status: packages.status,
        expectedArrivalDate: packages.expectedArrivalDate,
        receivedAt: packages.receivedAt,
        readyToShipAt: packages.readyToShipAt,
        // Additional package characteristics  
        warehouseNotes: packages.warehouseNotes,
        customerNotes: packages.customerNotes,
        specialInstructions: packages.specialInstructions,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
        requiresAdultSignature: packages.requiresAdultSignature,
        isRestricted: packages.isRestricted,
        storageExpiresAt: packages.storageExpiresAt,
        processedBy: packages.processedBy,
        processedAt: packages.processedAt,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        
        // Customer profile fields
        customerProfileId: customerProfiles.id,
        customerId: customerProfiles.customerId,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerEmail: users.email,
        customerPhone: users.phone,
        
        // Warehouse fields
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        warehouseCity: warehouses.city,
        warehouseCountryCode: warehouses.countryCode,
        
        // Processed by user
        processedByName: sql<string>`
          CASE 
            WHEN ${packages.processedBy} IS NOT NULL 
            THEN (
              SELECT ${users.firstName} || ' ' || ${users.lastName} 
              FROM ${users} 
              WHERE ${users.id} = ${packages.processedBy}
            )
            ELSE NULL 
          END
        `,
        
        // Incoming shipment item details (if exists)
        incomingShipmentItemId: packages.incomingShipmentItemId,
        shipmentTrackingNumber: incomingShipmentItems.trackingNumber,
        shipmentCourierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        shipmentScannedAt: incomingShipmentItems.scannedAt,
        shipmentAssignedAt: incomingShipmentItems.assignedAt,
        
        // Incoming shipment details (if exists)
        shipmentBatchReference: incomingShipments.batchReference,
        shipmentArrivalDate: incomingShipments.arrivalDate,
        courierName: couriers.name,
        courierCode: couriers.code,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!packageDetails) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get status history with user details
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

    // Get documents with uploader details (updated schema)
    const packageDocs = await db
      .select({
        id: packageDocuments.id,
        documentType: packageDocuments.documentType,
        isPrimary: packageDocuments.isPrimary,
        displayOrder: packageDocuments.displayOrder,
        attachedAt: packageDocuments.attachedAt,
        // Document details from documents table
        documentId: documents.id,
        fileName: documents.fileName,
        originalFileName: documents.originalFileName,
        fileUrl: documents.fileUrl,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        isPublic: documents.isPublic,
        uploadedAt: documents.uploadedAt,
        uploadedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        uploadedByEmail: users.email,
      })
      .from(packageDocuments)
      .innerJoin(documents, eq(packageDocuments.documentId, documents.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(eq(packageDocuments.packageId, packageId))
      .orderBy(desc(packageDocuments.attachedAt));

    // Structure the response
    const response = {
      package: {
        ...packageDetails,
        // Calculate dimensional weight for display if dimensions exist
        calculatedVolumetricWeight: packageDetails?.lengthCm && 
                                   packageDetails?.widthCm && 
                                   packageDetails?.heightCm
          ? (Number(packageDetails.lengthCm) * Number(packageDetails.widthCm) * Number(packageDetails.heightCm)) / 5000
          : null,
        
        // Add pre-receiving workflow context
        preReceivingInfo: packageDetails?.incomingShipmentItemId ? {
          shipmentBatchReference: packageDetails.shipmentBatchReference,
          shipmentArrivalDate: packageDetails.shipmentArrivalDate,
          courierName: packageDetails.courierName,
          courierCode: packageDetails.courierCode,
          trackingNumber: packageDetails.shipmentTrackingNumber,
          courierTrackingUrl: packageDetails.shipmentCourierTrackingUrl,
          scannedAt: packageDetails.shipmentScannedAt,
          assignedAt: packageDetails.shipmentAssignedAt,
        } : null,
      },
      statusHistory,
      documents: packageDocs,
      
      // Add metadata for the admin interface
      metadata: {
        canEdit: true,
        canChangeStatus: true,
        canUploadDocuments: true,
        canCreateShipment: packageDetails?.status === 'ready_to_ship',
        availableStatuses: [
          'expected',
          'received', 
          'processing',
          'ready_to_ship',
          'shipped',
          'delivered',
          'returned',
          'disposed',
          'missing',
          'damaged',
          'held'
        ],
      },
    };

    return NextResponse.json(response);

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
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');
    
    // Properly await params before using
    const packageId = (await RouteContext.params).id;
    const body = await request.json();

    // Check if package exists
    const [existingPackage] = await db
      .select({ 
        id: packages.id, 
        status: packages.status,
        tenantId: packages.tenantId 
      })
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: sql`now()`,
    };

    // Handle special status transitions
    if (body.status) {
      switch (body.status) {
        case 'received':
          if (!updateData.receivedAt) {
            updateData.receivedAt = new Date();
          }
          if (!updateData.processedBy) {
            updateData.processedBy = adminUser.id;
            updateData.processedAt = new Date();
          }
          break;
          
        case 'ready_to_ship':
          if (!updateData.readyToShipAt) {
            updateData.readyToShipAt = new Date();
          }
          break;
      }
    }

    // Update package
    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
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

    // Return updated package summary
    return NextResponse.json({
      package: updatedPackage,
      message: `Package updated successfully`,
    });

  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}