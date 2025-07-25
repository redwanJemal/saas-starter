// app/api/admin/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  customerProfiles, 
  users, 
  addresses, 
  warehouses
} from '@/lib/db/schema';
import { eq, like, desc, sql, and, or, ilike } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('shipments.read');
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    const warehouseId = url.searchParams.get('warehouse_id');
    
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = db
      .select({
        // Shipment data
        id: shipments.id,
        internalId: shipments.shipmentNumber,
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        totalWeight: shipments.totalWeightKg,
        totalValue: shipments.totalDeclaredValue,
        valueCurrency: shipments.declaredValueCurrency,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        shippingMethod: shipments.serviceType,
        carrierName: shipments.carrierCode,
        dispatchedAt: shipments.dispatchedAt,
        deliveredAt: shipments.deliveredAt,
        createdAt: shipments.createdAt,
        
        // Customer data
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Warehouse data
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        
        // Address data
        shippingCity: addresses.city,
        shippingCountry: addresses.countryCode,
      })
      .from(shipments)
      .leftJoin(customerProfiles, eq(shipments.customerProfileId, customerProfiles.id))
      .leftJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .leftJoin(addresses, eq(shipments.shippingAddressId, addresses.id));

    // Apply filters
    let whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(shipments.shipmentNumber, `%${search}%`),
          ilike(shipments.trackingNumber, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    
    if (status) {
      whereConditions.push(eq(shipments.status, status as any));
    }
    
    if (warehouseId) {
      whereConditions.push(eq(shipments.warehouseId, warehouseId));
    }

    // Apply where conditions if any
    if (whereConditions.length > 0) {
      const whereClause = whereConditions.reduce((acc, condition) => and(acc, condition));
      query.where(whereClause);
    }
    
    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(shipments);
    
    // Apply the same where conditions to count query
    if (whereConditions.length > 0) {
      const whereClause = whereConditions.reduce((acc, condition) => and(acc, condition));
      countQuery.where(whereClause);
    }
    
    const countResult = await countQuery.execute();
    const total = countResult[0]?.count || 0;
    
    // Execute query with pagination
    const shipmentsData = await query
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    // Format the response
    const formattedShipments = shipmentsData.map(shipment => ({
      id: shipment.id,
      internalId: shipment.internalId,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      totalWeight: shipment.totalWeight ? parseFloat(shipment.totalWeight.toString()) : 0,
      totalValue: shipment.totalValue ? parseFloat(shipment.totalValue.toString()) : 0,
      valueCurrency: shipment.valueCurrency,
      totalCost: shipment.totalCost ? parseFloat(shipment.totalCost.toString()) : 0,
      costCurrency: shipment.costCurrency,
      shippingMethod: shipment.shippingMethod,
      carrierName: shipment.carrierName,
      dispatchedAt: shipment.dispatchedAt?.toISOString(),
      deliveredAt: shipment.deliveredAt?.toISOString(),
      createdAt: shipment.createdAt.toISOString(),
      customerName: shipment.customerName,
      customerEmail: shipment.customerEmail,
      customerId: shipment.customerId,
      warehouseName: shipment.warehouseName,
      warehouseCode: shipment.warehouseCode,
      shippingCity: shipment.shippingCity,
      shippingCountry: shipment.shippingCountry,
    }));
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    return NextResponse.json({
      shipments: formattedShipments,
      pagination: {
        page,
        limit,
        total,
        pages,
      }
    });

  } catch (error) {
    console.error('Error fetching shipments list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}