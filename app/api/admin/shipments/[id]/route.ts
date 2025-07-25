// app/api/admin/shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  customerProfiles, 
  users, 
  addresses, 
  warehouses,
  packages,
  shipmentPackages
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('shipments.read');
    
    // Await params to get the id
    const { id: shipmentId } = params;

    // Get shipment with related data
    const shipmentQuery = await db
      .select({
        // Shipment data
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        serviceType: shipments.serviceType,
        totalWeightKg: shipments.totalWeightKg,
        totalDeclaredValue: shipments.totalDeclaredValue,
        declaredValueCurrency: shipments.declaredValueCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        requiresSignature: shipments.requiresSignature,
        deliveryInstructions: shipments.deliveryInstructions,
        trackingNumber: shipments.trackingNumber,
        carrierName: shipments.carrierCode,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        
        // Customer data
        customerName: users.firstName,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Warehouse data
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        warehouseCity: warehouses.city,
        warehouseCountryCode: warehouses.countryCode,
        
        // Address IDs
        shippingAddressId: shipments.shippingAddressId,
        billingAddressId: shipments.billingAddressId,
      })
      .from(shipments)
      .innerJoin(customerProfiles, eq(shipments.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipmentData = shipmentQuery[0];

    // Get shipping address
    const shippingAddressData = shipmentData.shippingAddressId
      ? await db
          .select({
            name: addresses.name,
            companyName: addresses.companyName,
            addressLine1: addresses.addressLine1,
            addressLine2: addresses.addressLine2,
            city: addresses.city,
            stateProvince: addresses.stateProvince,
            postalCode: addresses.postalCode,
            countryCode: addresses.countryCode,
            phone: addresses.phone,
          })
          .from(addresses)
          .where(eq(addresses.id, shipmentData.shippingAddressId))
          .limit(1)
      : [];

    // Get billing address
    const billingAddressData = shipmentData.billingAddressId
      ? await db
          .select({
            name: addresses.name,
            companyName: addresses.companyName,
            addressLine1: addresses.addressLine1,
            addressLine2: addresses.addressLine2,
            city: addresses.city,
            stateProvince: addresses.stateProvince,
            postalCode: addresses.postalCode,
            countryCode: addresses.countryCode,
            phone: addresses.phone,
          })
          .from(addresses)
          .where(eq(addresses.id, shipmentData.billingAddressId))
          .limit(1)
      : [];

    // Get packages in this shipment
    const packagesData = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        chargeableWeightKg: packages.chargeableWeightKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        status: packages.status,
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // Format the response
    const formattedShipment = {
      id: shipmentData.id,
      shipmentNumber: shipmentData.shipmentNumber,
      status: shipmentData.status,
      serviceType: shipmentData.serviceType,
      totalWeightKg: shipmentData.totalWeightKg ? parseFloat(shipmentData.totalWeightKg) : 0,
      totalDeclaredValue: shipmentData.totalDeclaredValue ? parseFloat(shipmentData.totalDeclaredValue) : 0,
      declaredValueCurrency: shipmentData.declaredValueCurrency,
      shippingCost: shipmentData.shippingCost ? parseFloat(shipmentData.shippingCost) : 0,
      insuranceCost: shipmentData.insuranceCost ? parseFloat(shipmentData.insuranceCost) : 0,
      handlingFee: shipmentData.handlingFee ? parseFloat(shipmentData.handlingFee) : 0,
      storageFee: shipmentData.storageFee ? parseFloat(shipmentData.storageFee) : 0,
      totalCost: shipmentData.totalCost ? parseFloat(shipmentData.totalCost) : 0,
      costCurrency: shipmentData.costCurrency,
      requiresSignature: shipmentData.requiresSignature,
      deliveryInstructions: shipmentData.deliveryInstructions,
      trackingNumber: shipmentData.trackingNumber,
      carrierName: shipmentData.carrierName,
      dispatchedAt: shipmentData.dispatchedAt?.toISOString(),
      estimatedDeliveryDate: shipmentData.estimatedDeliveryDate?.toString(),
      deliveredAt: shipmentData.deliveredAt?.toISOString(),
      createdAt: shipmentData.createdAt.toISOString(),
      updatedAt: shipmentData.updatedAt.toISOString(),
      
      // Customer info
      customerName: shipmentData.customerName,
      customerEmail: shipmentData.customerEmail,
      customerId: shipmentData.customerId,
      
      // Warehouse info
      warehouseName: shipmentData.warehouseName,
      warehouseCode: shipmentData.warehouseCode,
      warehouseLocation: `${shipmentData.warehouseCity}, ${shipmentData.warehouseCountryCode}`,
      
      // Address info
      shippingAddress: shippingAddressData,
      billingAddress: billingAddressData,
      
      // Packages
      packages: packagesData.map(pkg => ({
        ...pkg,
        weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0,
        chargeableWeightKg: pkg.chargeableWeightKg ? parseFloat(pkg.chargeableWeightKg) : 0,
        lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm) : 0,
        widthCm: pkg.widthCm ? parseFloat(pkg.widthCm) : 0,
        heightCm: pkg.heightCm ? parseFloat(pkg.heightCm) : 0,
      })),
    };

    return NextResponse.json({ shipment: formattedShipment });

  } catch (error) {
    console.error('Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}
