// features/packages/db/queries/incoming-shipments/get-incoming-shipments.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipments, 
  incomingShipmentItems, 
  packages,
  IncomingShipmentFilters 
} from '@/features/packages/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { couriers } from '@/features/settings/db/schema';
import { customerProfiles } from '@/features/customers/db/schema';
import { users } from '@/features/auth/db/schema';
import { eq, desc, and, or, ilike, count, sql } from 'drizzle-orm';
import type { IncomingShipmentWithItems } from '@/features/packages/types/package.types';

export async function getIncomingShipments(
  tenantId: string,
  filters: IncomingShipmentFilters = {}
): Promise<{
  success: boolean;
  data: IncomingShipmentWithItems[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const {
    status,
    warehouseId,
    courierId,
    courierName,
    batchReference,
    fromDate,
    toDate,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(incomingShipments.tenantId, tenantId)];

  if (status) {
    if (Array.isArray(status)) {
      whereConditions.push(or(...status.map(s => eq(incomingShipments.status, s))));
    } else {
      whereConditions.push(eq(incomingShipments.status, status));
    }
  }

  if (warehouseId) {
    whereConditions.push(eq(incomingShipments.warehouseId, warehouseId));
  }

  if (courierId) {
    whereConditions.push(eq(incomingShipments.courierId, courierId));
  }

  if (courierName) {
    whereConditions.push(ilike(incomingShipments.courierName, `%${courierName}%`));
  }

  if (batchReference) {
    whereConditions.push(ilike(incomingShipments.batchReference, `%${batchReference}%`));
  }

  if (fromDate) {
    whereConditions.push(sql`${incomingShipments.expectedArrivalDate} >= ${fromDate}`);
  }

  if (toDate) {
    whereConditions.push(sql`${incomingShipments.expectedArrivalDate} <= ${toDate}`);
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(incomingShipments.batchReference, `%${search}%`),
        ilike(incomingShipments.trackingNumber, `%${search}%`),
        ilike(incomingShipments.courierName, `%${search}%`),
        ilike(incomingShipments.notes, `%${search}%`)
      )
    );
  }

  const whereClause = whereConditions.length > 0 
    ? whereConditions.reduce((acc, condition) => and(acc, condition)) 
    : undefined;

  // Get shipments with basic info
  const shipments = await db
    .select({
      // Incoming shipment fields
      id: incomingShipments.id,
      tenantId: incomingShipments.tenantId,
      warehouseId: incomingShipments.warehouseId,
      batchReference: incomingShipments.batchReference,
      courierId: incomingShipments.courierId,
      courierName: incomingShipments.courierName,
      trackingNumber: incomingShipments.trackingNumber,
      arrivalDate: incomingShipments.arrivalDate,
      expectedArrivalDate: incomingShipments.expectedArrivalDate,
      actualArrivalDate: incomingShipments.actualArrivalDate,
      status: incomingShipments.status,
      receivedBy: incomingShipments.receivedBy,
      receivedAt: incomingShipments.receivedAt,
      processedBy: incomingShipments.processedBy,
      processedAt: incomingShipments.processedAt,
      notes: incomingShipments.notes,
      createdAt: incomingShipments.createdAt,
      updatedAt: incomingShipments.updatedAt,
      
      // Warehouse info
      warehouseName: warehouses.name,
      warehouseCode: warehouses.code,
      
      // Courier info
      courierServiceName: couriers.name,
      courierCode: couriers.code,
      
      // Processed by user info
      processedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      processedByEmail: users.email,
    })
    .from(incomingShipments)
    .leftJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
    .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
    .leftJoin(users, eq(incomingShipments.processedBy, users.id))
    .where(whereClause)
    .orderBy(desc(incomingShipments.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(incomingShipments)
    .where(whereClause);

  // Get all items for these shipments
  const shipmentIds = shipments.map(s => s.id);
  
  let items: Array<any> = [];
  if (shipmentIds.length > 0) {
    items = await db
      .select({
        // Shipment item fields
        id: incomingShipmentItems.id,
        incomingShipmentId: incomingShipmentItems.incomingShipmentId,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierName: incomingShipmentItems.courierName,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedBy: incomingShipmentItems.scannedBy,
        scannedAt: incomingShipmentItems.scannedAt,
        assignedCustomerProfileId: incomingShipmentItems.assignedCustomerProfileId,
        assignedBy: incomingShipmentItems.assignedBy,
        assignedAt: incomingShipmentItems.assignedAt,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        weightKg: incomingShipmentItems.weightKg,
        lengthCm: incomingShipmentItems.lengthCm,
        widthCm: incomingShipmentItems.widthCm,
        heightCm: incomingShipmentItems.heightCm,
        description: incomingShipmentItems.description,
        estimatedValue: incomingShipmentItems.estimatedValue,
        estimatedValueCurrency: incomingShipmentItems.estimatedValueCurrency,
        notes: incomingShipmentItems.notes,
        specialInstructions: incomingShipmentItems.specialInstructions,
        isFragile: incomingShipmentItems.isFragile,
        isHighValue: incomingShipmentItems.isHighValue,
        requiresInspection: incomingShipmentItems.requiresInspection,
        createdAt: incomingShipmentItems.createdAt,
        updatedAt: incomingShipmentItems.updatedAt,
        
        // Package info (if converted)
        packageId: packages.id,
        packageStatus: packages.status,
        packageInternalId: packages.internalId,
        
        // Customer info (if assigned)
        customerId: customerProfiles.id,
        customerName: sql<string>`${customerProfiles.firstName} || ' ' || ${customerProfiles.lastName}`,
        customerEmail: customerProfiles.email,
      })
      .from(incomingShipmentItems)
      .leftJoin(packages, eq(incomingShipmentItems.id, packages.incomingShipmentItemId))
      .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
      .where(or(...shipmentIds.map(id => eq(incomingShipmentItems.incomingShipmentId, id))));
  }

  // Group items by shipment
  const itemsByShipment = new Map();
  items.forEach(item => {
    if (!itemsByShipment.has(item.incomingShipmentId)) {
      itemsByShipment.set(item.incomingShipmentId, []);
    }
    itemsByShipment.get(item.incomingShipmentId).push(item);
  });

  // Format the response
  const formattedShipments: IncomingShipmentWithItems[] = shipments.map(shipment => ({
    ...shipment,
    
    // Warehouse info
    warehouseName: shipment.warehouseName || undefined,
    warehouseCode: shipment.warehouseCode || undefined,
    
    // Courier info
    courier: shipment.courierId ? {
      id: shipment.courierId,
      name: shipment.courierServiceName || shipment.courierName || '',
      code: shipment.courierCode || '',
    } : undefined,
    
    // Items
    items: (itemsByShipment.get(shipment.id) || []).map((item: any) => ({
      ...item,
      weightKg: item.weightKg ? parseFloat(item.weightKg.toString()) : null,
      lengthCm: item.lengthCm ? parseFloat(item.lengthCm.toString()) : null,
      widthCm: item.widthCm ? parseFloat(item.widthCm.toString()) : null,
      heightCm: item.heightCm ? parseFloat(item.heightCm.toString()) : null,
      estimatedValue: item.estimatedValue ? parseFloat(item.estimatedValue.toString()) : null,
      
      package: item.packageId ? {
        id: item.packageId,
        status: item.packageStatus,
        internalId: item.packageInternalId,
      } : undefined,
      
      assignedToCustomer: item.customerId ? {
        customerId: item.customerId,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
      } : undefined,
    })),
  }));

  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: formattedShipments,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: totalPages,
    },
  };
}