// app/api/admin/assigned-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  incomingShipmentItems, 
  incomingShipments, 
  customerProfiles, 
  users, 
  warehouses,
  packages 
} from '@/lib/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.read');
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Build where conditions
    const baseWhereConditions = [
      eq(incomingShipmentItems.tenantId, adminUser.tenantId),
      eq(incomingShipmentItems.assignmentStatus, 'assigned'),
      // CRITICAL: Only show items that don't have packages created yet
      isNull(packages.id)
    ];

    if (warehouseId && warehouseId !== 'none') {
      baseWhereConditions.push(eq(incomingShipmentItems.warehouseId, warehouseId));
    }

    // Get assigned items that don't have packages created yet
    const assignedItemsQuery = db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierName: incomingShipmentItems.courierName,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedAt: incomingShipmentItems.scannedAt,
        assignedAt: incomingShipmentItems.assignedAt,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        description: incomingShipmentItems.description,
        estimatedValue: incomingShipmentItems.estimatedValue,
        estimatedValueCurrency: incomingShipmentItems.estimatedValueCurrency,
        weightKg: incomingShipmentItems.weightKg,
        lengthCm: incomingShipmentItems.lengthCm,
        widthCm: incomingShipmentItems.widthCm,
        heightCm: incomingShipmentItems.heightCm,
        isFragile: incomingShipmentItems.isFragile,
        isHighValue: incomingShipmentItems.isHighValue,
        requiresAdultSignature: incomingShipmentItems.requiresAdultSignature,
        specialInstructions: incomingShipmentItems.specialInstructions,
        
        // Customer info
        customerProfileId: incomingShipmentItems.assignedCustomerProfileId,
        customerName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Shipment info
        batchReference: incomingShipments.batchReference,
        arrivalDate: incomingShipments.arrivalDate,
        
        // Warehouse info
        warehouseId: incomingShipmentItems.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
      })
      .from(incomingShipmentItems)
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
      .leftJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(warehouses, eq(incomingShipmentItems.warehouseId, warehouses.id))
      // LEFT JOIN to check if package exists (we want items with NO packages)
      .leftJoin(packages, eq(packages.incomingShipmentItemId, incomingShipmentItems.id));

    // Prepare all where conditions including search if provided
    let whereConditions = [...baseWhereConditions];
    
    if (search) {
      whereConditions.push(
        sql`(
          lower(${incomingShipmentItems.trackingNumber}) like lower(${`%${search}%`}) OR
          lower(concat(${users.firstName}, ' ', ${users.lastName})) like lower(${`%${search}%`}) OR
          lower(${customerProfiles.customerId}) like lower(${`%${search}%`}) OR
          lower(${incomingShipmentItems.description}) like lower(${`%${search}%`})
        )`
      );
    }
    
    // Apply all conditions in a single where call
    const assignedItemsWithConditions = assignedItemsQuery.where(and(...whereConditions));

    // Get total count for pagination using the same conditions
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
      .leftJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(packages, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .where(and(...whereConditions));

    const [items, totalResult] = await Promise.all([
      assignedItemsWithConditions
        .orderBy(desc(incomingShipmentItems.assignedAt))
        .limit(limit)
        .offset(offset),
      totalQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / limit);

    // Format the response
    const formattedItems = items.map(item => ({
      id: item.id,
      trackingNumber: item.trackingNumber || '',
      courierName: item.courierName || '',
      courierTrackingUrl: item.courierTrackingUrl || null,
      scannedAt: item.scannedAt?.toISOString() || '',
      assignedAt: item.assignedAt?.toISOString() || '',
      assignmentStatus: item.assignmentStatus || 'assigned',
      description: item.description || '',
      estimatedValue: item.estimatedValue ? parseFloat(item.estimatedValue.toString()) : 0,
      estimatedValueCurrency: item.estimatedValueCurrency || 'USD',
      weightKg: item.weightKg ? parseFloat(item.weightKg.toString()) : null,
      lengthCm: item.lengthCm ? parseFloat(item.lengthCm.toString()) : null,
      widthCm: item.widthCm ? parseFloat(item.widthCm.toString()) : null,
      heightCm: item.heightCm ? parseFloat(item.heightCm.toString()) : null,
      isFragile: item.isFragile || false,
      isHighValue: item.isHighValue || false,
      requiresAdultSignature: item.requiresAdultSignature || false,
      specialInstructions: item.specialInstructions || '',
      
      // Customer info
      customerProfileId: item.customerProfileId || '',
      customerName: item.customerName || '',
      customerEmail: item.customerEmail || '',
      customerId: item.customerId || '',
      
      // Shipment info
      batchReference: item.batchReference || '',
      arrivalDate: item.arrivalDate || '',
      
      // Warehouse info
      warehouseId: item.warehouseId || '',
      warehouseName: item.warehouseName || '',
      warehouseCode: item.warehouseCode || '',
    }));

    return NextResponse.json({
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });

  } catch (error) {
    console.error('Error fetching assigned items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned items' },
      { status: 500 }
    );
  }
}