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
  shipmentPackages,
  zones 
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('shipments.read');

    const shipmentId = await params.id;

    // Get shipment with all related data including addresses
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
        carrierCode: shipments.carrierCode,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        quoteExpiresAt: shipments.quoteExpiresAt,
        paidAt: shipments.paidAt,
        customsStatus: shipments.customsStatus,
        commercialInvoiceUrl: shipments.commercialInvoiceUrl,
        
        // Customer data
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Warehouse data
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        warehouseCity: warehouses.city,
        warehouseCountryCode: warehouses.countryCode,
        
        // Zone information
        zoneName: zones.name,
        
        // Address IDs for separate queries
        shippingAddressId: shipments.shippingAddressId,
        billingAddressId: shipments.billingAddressId,
      })
      .from(shipments)
      .innerJoin(customerProfiles, eq(shipments.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .leftJoin(zones, eq(shipments.zoneId, zones.id))
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipmentData = shipmentQuery[0];

    // Get addresses separately
    let shippingAddress = null;
    let billingAddress = null;

    // Query shipping address if exists
    if (shipmentData.shippingAddressId) {
      const shippingAddressQuery = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shipmentData.shippingAddressId))
        .limit(1);
      
      if (shippingAddressQuery.length > 0) {
        shippingAddress = shippingAddressQuery[0];
      }
    }

    // Query billing address if exists
    if (shipmentData.billingAddressId) {
      const billingAddressQuery = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shipmentData.billingAddressId))
        .limit(1);
      
      if (billingAddressQuery.length > 0) {
        billingAddress = billingAddressQuery[0];
      }
    }

    // Get packages in shipment
    const packagesQuery = await db
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
    const response = {
      shipment: {
        ...shipmentData,
        // Format address data
        shippingAddress: shippingAddress ? {
          name: shippingAddress.name,
          company: shippingAddress.companyName,
          street1: shippingAddress.addressLine1,
          street2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          stateProvince: shippingAddress.stateProvince,
          postalCode: shippingAddress.postalCode,
          countryCode: shippingAddress.countryCode,
          phone: shippingAddress.phone,
        } : null,
        
        billingAddress: billingAddress ? {
          name: billingAddress.name,
          company: billingAddress.companyName,
          street1: billingAddress.addressLine1,
          street2: billingAddress.addressLine2,
          city: billingAddress.city,
          stateProvince: billingAddress.stateProvince,
          postalCode: billingAddress.postalCode,
          countryCode: billingAddress.countryCode,
          phone: billingAddress.phone,
        } : null,
        
        // Warehouse information
        warehouse: {
          name: shipmentData.warehouseName,
          code: shipmentData.warehouseCode,
          city: shipmentData.warehouseCity,
          countryCode: shipmentData.warehouseCountryCode,
        },
        
        // Packages
        packages: packagesQuery.map(pkg => ({
          id: pkg.id,
          internalId: pkg.internalId,
          trackingNumberInbound: pkg.trackingNumberInbound,
          description: pkg.description,
          weightActualKg: parseFloat(pkg.weightActualKg?.toString() || '0'),
          chargeableWeightKg: parseFloat(pkg.chargeableWeightKg?.toString() || '0'),
          lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm.toString()) : null,
          widthCm: pkg.widthCm ? parseFloat(pkg.widthCm.toString()) : null,
          heightCm: pkg.heightCm ? parseFloat(pkg.heightCm.toString()) : null,
          status: pkg.status,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shipment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requirePermission('shipments.manage');
    const shipmentId = await params.id;
    const body = await request.json();

    const {
      status,
      trackingNumber,
      carrierCode,
      serviceType,
      estimatedDeliveryDate,
      notes,
    } = body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (carrierCode) updateData.carrierCode = carrierCode;
    if (serviceType) updateData.serviceType = serviceType;
    if (estimatedDeliveryDate) updateData.estimatedDeliveryDate = estimatedDeliveryDate;

    // Update shipment
    const [updatedShipment] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, shipmentId))
      .returning();

    if (!updatedShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment,
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}