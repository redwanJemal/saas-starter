// app/api/customer/shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, shipmentPackages, packages, addresses, warehouses, zones } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and, or } from 'drizzle-orm';
import { RouteContext } from '@/lib/utils/route';

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = (await RouteContext.params).id;

    // Get shipment details with proper address joins
    const shipmentQuery = await db
      .select({
        // Shipment fields
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        serviceType: shipments.serviceType,
        trackingNumber: shipments.trackingNumber,
        carrierCode: shipments.carrierCode,
        carrierReference: shipments.carrierReference,
        totalWeightKg: shipments.totalWeightKg,
        totalDeclaredValue: shipments.totalDeclaredValue,
        declaredValueCurrency: shipments.declaredValueCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        baseShippingRate: shipments.baseShippingRate,
        weightShippingRate: shipments.weightShippingRate,
        rateCalculationDetails: shipments.rateCalculationDetails,
        quoteExpiresAt: shipments.quoteExpiresAt,
        paidAt: shipments.paidAt,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        customsDeclaration: shipments.customsDeclaration,
        commercialInvoiceUrl: shipments.commercialInvoiceUrl,
        customsStatus: shipments.customsStatus,
        requiresSignature: shipments.requiresSignature,
        deliveryInstructions: shipments.deliveryInstructions,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        
        // Warehouse info
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        
        // Zone info
        zoneName: zones.name,
        
        // Shipping address
        shippingAddressId: shipments.shippingAddressId,
        
        // Billing address
        billingAddressId: shipments.billingAddressId,
      })
      .from(shipments)
      .leftJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .leftJoin(zones, eq(shipments.zoneId, zones.id))
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

    const shipment = shipmentQuery[0];

    // Get addresses separately
    const addressIds = [shipment.shippingAddressId, shipment.billingAddressId].filter(Boolean);
    const addressQuery = addressIds.length > 0 ? await db
      .select({
        id: addresses.id,
        addressType: addresses.addressType,
        name: addresses.name,
        companyName: addresses.companyName,
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        city: addresses.city,
        stateProvince: addresses.stateProvince,
        postalCode: addresses.postalCode,
        countryCode: addresses.countryCode,
        phone: addresses.phone,
        email: addresses.email,
        deliveryInstructions: addresses.deliveryInstructions,
        isDefault: addresses.isDefault,
        isVerified: addresses.isVerified,
      })
      .from(addresses)
      .where(
        and(
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
          or(
            eq(addresses.id, shipment.shippingAddressId || ''),
            eq(addresses.id, shipment.billingAddressId || '')
          )
        )
      ) : [];

    // Get shipment packages
    const packagesQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        status: packages.status,
        senderName: packages.senderName,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
        requiresAdultSignature: packages.requiresAdultSignature,
        declaredValue: shipmentPackages.declaredValue,
        declaredDescription: shipmentPackages.declaredDescription,
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // Find shipping and billing addresses
    const shippingAddress = addressQuery.find(addr => addr.id === shipment.shippingAddressId);
    const billingAddress = addressQuery.find(addr => addr.id === shipment.billingAddressId);

    // Parse rate calculation details
    let rateBreakdown = null;
    if (shipment.rateCalculationDetails) {
      try {
        rateBreakdown = JSON.parse(shipment.rateCalculationDetails as string);
      } catch (e) {
        console.warn('Failed to parse rate calculation details');
      }
    }

    // Format the response
    const formattedShipment = {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      serviceType: shipment.serviceType,
      trackingNumber: shipment.trackingNumber || '',
      carrierCode: shipment.carrierCode || '',
      carrierReference: shipment.carrierReference || '',
      totalWeightKg: shipment.totalWeightKg ? parseFloat(shipment.totalWeightKg) : 0,
      totalDeclaredValue: shipment.totalDeclaredValue ? parseFloat(shipment.totalDeclaredValue) : 0,
      declaredValueCurrency: shipment.declaredValueCurrency || 'USD',
      
      // Costs
      shippingCost: shipment.shippingCost ? parseFloat(shipment.shippingCost) : 0,
      insuranceCost: shipment.insuranceCost ? parseFloat(shipment.insuranceCost) : 0,
      handlingFee: shipment.handlingFee ? parseFloat(shipment.handlingFee) : 0,
      storageFee: shipment.storageFee ? parseFloat(shipment.storageFee) : 0,
      totalCost: shipment.totalCost ? parseFloat(shipment.totalCost) : 0,
      costCurrency: shipment.costCurrency || 'USD',
      
      // Rate details
      baseShippingRate: shipment.baseShippingRate ? parseFloat(shipment.baseShippingRate) : 0,
      weightShippingRate: shipment.weightShippingRate ? parseFloat(shipment.weightShippingRate) : 0,
      rateBreakdown,
      
      // Dates
      quoteExpiresAt: shipment.quoteExpiresAt,
      paidAt: shipment.paidAt,
      dispatchedAt: shipment.dispatchedAt,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      deliveredAt: shipment.deliveredAt,
      createdAt: shipment.createdAt.toISOString(),
      updatedAt: shipment.updatedAt.toISOString(),
      
      // Customs
      customsDeclaration: shipment.customsDeclaration,
      commercialInvoiceUrl: shipment.commercialInvoiceUrl || '',
      customsStatus: shipment.customsStatus || 'pending',
      
      // Special handling
      requiresSignature: shipment.requiresSignature || false,
      deliveryInstructions: shipment.deliveryInstructions || '',
      
      // Related info
      warehouseName: shipment.warehouseName || '',
      warehouseCode: shipment.warehouseCode || '',
      zoneName: shipment.zoneName || '',
    };

    const formattedPackages = packagesQuery.map(pkg => ({
      id: pkg.id,
      internalId: pkg.internalId,
      trackingNumberInbound: pkg.trackingNumberInbound || '',
      description: pkg.description || '',
      weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0,
      lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm) : 0,
      widthCm: pkg.widthCm ? parseFloat(pkg.widthCm) : 0,
      heightCm: pkg.heightCm ? parseFloat(pkg.heightCm) : 0,
      estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0,
      estimatedValueCurrency: pkg.estimatedValueCurrency || 'USD',
      status: pkg.status,
      senderName: pkg.senderName || '',
      isFragile: pkg.isFragile || false,
      isHighValue: pkg.isHighValue || false,
      requiresAdultSignature: pkg.requiresAdultSignature || false,
      declaredValue: pkg.declaredValue ? parseFloat(pkg.declaredValue) : 0,
      declaredDescription: pkg.declaredDescription || '',
    }));

    return NextResponse.json({
      shipment: formattedShipment,
      shippingAddress,
      billingAddress,
      packages: formattedPackages,
    });
  } catch (error) {
    console.error('Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}