// app/api/customer/packages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, warehouses, incomingShipmentItems, incomingShipments, couriers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user and customer profile
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json(
        { error: 'Unauthorized - Customer profile required' },
        { status: 401 }
      );
    }

    const customerId = userWithProfile.customerProfile.id;
    const packageId = params.id;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Get package detail with related data
    const packageQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        status: packages.status,
        senderName: packages.senderName,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
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
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        // Warehouse info
        warehouseName: warehouses.name,
        // Courier tracking URL from incoming shipment item
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        // Batch reference from incoming shipment
        batchReference: incomingShipments.batchReference,
        courierName: couriers.name,
      })
      .from(packages)
      .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(
        and(
          eq(packages.id, packageId),
          eq(packages.customerProfileId, customerId)
        )
      )
      .limit(1);

    if (packageQuery.length === 0) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const pkg = packageQuery[0];

    // Format the response data
    const formattedPackage = {
      id: pkg.id,
      internalId: pkg.internalId,
      trackingNumberInbound: pkg.trackingNumberInbound || '',
      status: pkg.status,
      senderName: pkg.senderName || '',
      description: pkg.description || '',
      weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0,
      lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm) : 0,
      widthCm: pkg.widthCm ? parseFloat(pkg.widthCm) : 0,
      heightCm: pkg.heightCm ? parseFloat(pkg.heightCm) : 0,
      volumetricWeightKg: pkg.volumetricWeightKg ? parseFloat(pkg.volumetricWeightKg) : 0,
      estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0,
      estimatedValueCurrency: pkg.estimatedValueCurrency || 'USD',
      expectedArrivalDate: pkg.expectedArrivalDate || null,
      receivedAt: pkg.receivedAt || null,
      readyToShipAt: pkg.readyToShipAt || null,
      storageExpiresAt: pkg.storageExpiresAt || null,
      warehouseNotes: pkg.warehouseNotes || '',
      customerNotes: pkg.customerNotes || '',
      specialInstructions: pkg.specialInstructions || '',
      isFragile: pkg.isFragile || false,
      isHighValue: pkg.isHighValue || false,
      requiresAdultSignature: pkg.requiresAdultSignature || false,
      isRestricted: pkg.isRestricted || false,
      warehouseName: pkg.warehouseName || '',
      courierTrackingUrl: pkg.courierTrackingUrl || '',
      batchReference: pkg.batchReference || '',
      courierName: pkg.courierName || '',
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };

    return NextResponse.json({
      package: formattedPackage,
    });

  } catch (error) {
    console.error('Error fetching customer package detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package details' },
      { status: 500 }
    );
  }
}