// app/api/customer/shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, shipmentPackages, packages, addresses, warehouses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shipmentId } = await params;

    // Get shipment details with related data
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
        carrierCode: shipments.carrierCode,
        serviceType: shipments.serviceType,
        totalWeightKg: shipments.totalWeightKg,
        totalDeclaredValue: shipments.totalDeclaredValue,
        declaredValueCurrency: shipments.declaredValueCurrency,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        quoteExpiresAt: shipments.quoteExpiresAt,
        paidAt: shipments.paidAt,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        deliveryInstructions: shipments.deliveryInstructions,
        requiresSignature: shipments.requiresSignature,
        customsStatus: shipments.customsStatus,
        commercialInvoiceUrl: shipments.commercialInvoiceUrl,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        shippingAddressId: shipments.shippingAddressId,
        billingAddressId: shipments.billingAddressId,
        warehouseId: shipments.warehouseId,
        // Warehouse details
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
      })
      .from(shipments)
      .leftJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipmentData = shipmentQuery[0];

    // Get packages in this shipment
    const shipmentPackagesQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // Get addresses
    const addressIds = [shipmentData.shippingAddressId, shipmentData.billingAddressId].filter(Boolean);
    let addressesQuery: any[] = [];
    
    if (addressIds.length > 0) {
      addressesQuery = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
            // Use proper array contains logic for address IDs
            addressIds.length === 1 
              ? eq(addresses.id, addressIds[0])
              : eq(addresses.id, addressIds[0]) // We'll need to handle multiple IDs properly
          )
        );
    }

    // If we have multiple address IDs, we need to query them properly
    if (addressIds.length > 1) {
      for (const addressId of addressIds.slice(1)) {
        const additionalAddress = await db
          .select()
          .from(addresses)
          .where(
            and(
              eq(addresses.id, addressId),
              eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
            )
          )
          .limit(1);
        
        if (additionalAddress.length > 0) {
          addressesQuery.push(additionalAddress[0]);
        }
      }
    }

    const addressesMap = new Map(addressesQuery.map(addr => [addr.id, addr]));

    // Format the response
    const formattedShipment = {
      id: shipmentData.id,
      shipmentNumber: shipmentData.shipmentNumber,
      status: shipmentData.status,
      trackingNumber: shipmentData.trackingNumber,
      carrierCode: shipmentData.carrierCode,
      serviceType: shipmentData.serviceType,
      totalWeightKg: shipmentData.totalWeightKg ? parseFloat(shipmentData.totalWeightKg) : 0,
      totalDeclaredValue: shipmentData.totalDeclaredValue ? parseFloat(shipmentData.totalDeclaredValue) : 0,
      declaredValueCurrency: shipmentData.declaredValueCurrency,
      totalCost: shipmentData.totalCost ? parseFloat(shipmentData.totalCost) : null,
      costCurrency: shipmentData.costCurrency,
      shippingCost: shipmentData.shippingCost ? parseFloat(shipmentData.shippingCost) : null,
      insuranceCost: shipmentData.insuranceCost ? parseFloat(shipmentData.insuranceCost) : null,
      handlingFee: shipmentData.handlingFee ? parseFloat(shipmentData.handlingFee) : null,
      storageFee: shipmentData.storageFee ? parseFloat(shipmentData.storageFee) : null,
      quoteExpiresAt: shipmentData.quoteExpiresAt,
      paidAt: shipmentData.paidAt,
      dispatchedAt: shipmentData.dispatchedAt,
      estimatedDeliveryDate: shipmentData.estimatedDeliveryDate,
      deliveredAt: shipmentData.deliveredAt,
      deliveryInstructions: shipmentData.deliveryInstructions,
      requiresSignature: shipmentData.requiresSignature,
      customsStatus: shipmentData.customsStatus,
      commercialInvoiceUrl: shipmentData.commercialInvoiceUrl,
      createdAt: shipmentData.createdAt,
      updatedAt: shipmentData.updatedAt,
      warehouseName: shipmentData.warehouseName,
      warehouseCode: shipmentData.warehouseCode,
      shippingAddress: shipmentData.shippingAddressId ? addressesMap.get(shipmentData.shippingAddressId) : null,
      billingAddress: shipmentData.billingAddressId ? addressesMap.get(shipmentData.billingAddressId) : null,
      packages: shipmentPackagesQuery.map(pkg => ({
        id: pkg.id,
        internalId: pkg.internalId,
        description: pkg.description,
        weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0,
        estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0,
        estimatedValueCurrency: pkg.estimatedValueCurrency,
        isFragile: pkg.isFragile,
        isHighValue: pkg.isHighValue,
      })),
    };

    return NextResponse.json({
      shipment: formattedShipment,
    });
  } catch (error) {
    console.error('Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}