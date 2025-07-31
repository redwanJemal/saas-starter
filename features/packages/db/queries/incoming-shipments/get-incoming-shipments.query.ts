// features/packages/db/queries/incoming-shipments/get-incoming-shipments.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipments, 
  incomingShipmentItems
} from '@/features/packages/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, desc, and, or, ilike, count, sql, inArray } from 'drizzle-orm';
import type { 
  IncomingShipmentWithItems,
  IncomingShipmentFilters 
} from '@/features/packages/types/package.types';

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
    courierName,
    batchReference,
    fromDate,
    toDate,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions for shipments
  const whereConditions = [eq(incomingShipments.tenantId, tenantId)];

  if (status) {
    if (Array.isArray(status)) {
      whereConditions.push(inArray(incomingShipments.status, status));
    } else {
      whereConditions.push(eq(incomingShipments.status, status));
    }
  }

  if (warehouseId) {
    whereConditions.push(eq(incomingShipments.warehouseId, warehouseId));
  }

  if (courierName) {
    whereConditions.push(ilike(incomingShipments.courierName, `%${courierName}%`));
  }

  if (batchReference) {
    whereConditions.push(ilike(incomingShipments.batchReference, `%${batchReference}%`));
  }

  if (fromDate) {
    whereConditions.push(sql`${incomingShipments.arrivalDate} >= ${fromDate}::date`);
  }

  if (toDate) {
    whereConditions.push(sql`${incomingShipments.arrivalDate} <= ${toDate}::date`);
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(incomingShipments.batchReference, `%${search}%`),
        ilike(incomingShipments.courierName, `%${search}%`),
        ilike(incomingShipments.notes, `%${search}%`)
      )
    );
  }

  const whereClause = whereConditions.length > 1 
    ? and(...whereConditions) 
    : whereConditions[0];

  try {
    // Get shipments with ONLY essential data for the history tab
    const shipments = await db
      .select({
        // Essential shipment fields only
        id: incomingShipments.id,
        tenantId: incomingShipments.tenantId,
        warehouseId: incomingShipments.warehouseId,
        batchReference: incomingShipments.batchReference,
        courierName: incomingShipments.courierName,
        status: incomingShipments.status,
        arrivalDate: incomingShipments.arrivalDate,
        notes: incomingShipments.notes,
        createdAt: incomingShipments.createdAt,
        
        // Only warehouse name for display
        warehouseName: warehouses.name,
      })
      .from(incomingShipments)
      .leftJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
      .where(whereClause)
      .orderBy(desc(incomingShipments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(incomingShipments)
      .where(whereClause);

    // Get MINIMAL item counts only (not full item details)
    const shipmentIds = shipments.map(s => s.id);
    let itemCounts: Record<string, { total: number; assigned: number; unassigned: number }> = {};

    if (shipmentIds.length > 0) {
      const itemCountResults = await db
        .select({
          incomingShipmentId: incomingShipmentItems.incomingShipmentId,
          total: count(),
          assigned: sql<number>`COUNT(CASE WHEN ${incomingShipmentItems.assignmentStatus} = 'assigned' THEN 1 END)`,
          unassigned: sql<number>`COUNT(CASE WHEN ${incomingShipmentItems.assignmentStatus} = 'unassigned' THEN 1 END)`,
        })
        .from(incomingShipmentItems)
        .where(inArray(incomingShipmentItems.incomingShipmentId, shipmentIds))
        .groupBy(incomingShipmentItems.incomingShipmentId);

      // Create lookup map for item counts
      itemCounts = itemCountResults.reduce((acc, item) => {
        acc[item.incomingShipmentId] = {
          total: Number(item.total),
          assigned: Number(item.assigned),
          unassigned: Number(item.unassigned),
        };
        return acc;
      }, {} as Record<string, { total: number; assigned: number; unassigned: number }>);
    }

    // Transform to the expected format with minimal data
    const transformedShipments: IncomingShipmentWithItems[] = shipments.map(shipment => {
      const counts = itemCounts[shipment.id] || { total: 0, assigned: 0, unassigned: 0 };
      
      return {
        id: shipment.id,
        tenantId: shipment.tenantId,
        warehouseId: shipment.warehouseId,
        batchReference: shipment.batchReference,
        courierName: shipment.courierName || null,
        status: shipment.status,
        arrivalDate: shipment.arrivalDate,
        notes: shipment.notes,
        createdAt: shipment.createdAt,
        updatedAt: shipment.createdAt, // Use createdAt as fallback
        
        // Warehouse info (minimal)
        warehouse: {
          id: shipment.warehouseId,
          name: shipment.warehouseName || 'Unknown',
          code: '', // Not needed for display
        },
        
        // Item summary (counts only, no detailed items)
        items: [], // Empty array since we only need counts for history tab
        itemCounts: counts,
        
        // Optional fields with defaults
        courierId: null,
        trackingNumber: null,
        expectedArrivalDate: null,
        actualArrivalDate: null,
        receivedBy: null,
        receivedAt: null,
        processedBy: null,
        processedAt: null,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: transformedShipments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching incoming shipments:', error);
    return {
      success: false,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }
}