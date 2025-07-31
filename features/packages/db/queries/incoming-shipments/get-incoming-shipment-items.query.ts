// features/packages/db/queries/incoming-shipments/get-incoming-shipment-items.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipmentItems, 
  incomingShipments,
  packages, 
  type IncomingShipmentItemFilters,
  type ItemAssignmentStatus 
} from '@/features/packages/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { customerProfiles } from '@/features/customers/db/schema';
import { users } from '@/features/auth/db/schema';
import { eq, desc, and, or, ilike, count, sql } from 'drizzle-orm';
import type { PaginatedResponse } from '@/shared/types/api.types';

// Only the fields actually needed for the assignment UI
export interface IncomingShipmentItemForAssignment {
  id: string;
  incomingShipmentId: string;
  trackingNumber: string | null;
  courierName: string | null;
  assignmentStatus: ItemAssignmentStatus;
  assignedCustomerProfileId: string | null;
  assignedAt: Date | null;
  scannedAt: Date | null;
  
  // Status indicators
  isFragile: boolean | null;
  isHighValue: boolean | null;
  
  // Context info
  batchReference: string | null;
  warehouseName: string | null;
  
  // Customer info (if assigned) - from users table
  customerName?: string;
  customerEmail?: string;
  
  // Package status (if converted to package)
  packageId?: string;
  packageStatus?: string;
}

export async function getIncomingShipmentItems(
  tenantId: string,
  filters: IncomingShipmentItemFilters = {}
): Promise<PaginatedResponse<IncomingShipmentItemForAssignment>> {
  const {
    incomingShipmentId,
    assignmentStatus,
    assignedCustomerProfileId,
    scannedBy,
    isFragile,
    isHighValue,
    requiresInspection,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [eq(incomingShipmentItems.tenantId, tenantId)];

  if (incomingShipmentId) {
    whereConditions.push(eq(incomingShipmentItems.incomingShipmentId, incomingShipmentId));
  }

  if (assignmentStatus) {
    if (Array.isArray(assignmentStatus)) {
      whereConditions.push(or(...assignmentStatus.map(status => 
        eq(incomingShipmentItems.assignmentStatus, status)
      )));
    } else {
      whereConditions.push(eq(incomingShipmentItems.assignmentStatus, assignmentStatus));
    }
  }

  if (assignedCustomerProfileId) {
    whereConditions.push(eq(incomingShipmentItems.assignedCustomerProfileId, assignedCustomerProfileId));
  }

  if (scannedBy) {
    whereConditions.push(eq(incomingShipmentItems.scannedBy, scannedBy));
  }

  if (typeof isFragile === 'boolean') {
    whereConditions.push(eq(incomingShipmentItems.isFragile, isFragile));
  }

  if (typeof isHighValue === 'boolean') {
    whereConditions.push(eq(incomingShipmentItems.isHighValue, isHighValue));
  }

  if (typeof requiresInspection === 'boolean') {
    whereConditions.push(eq(incomingShipmentItems.requiresInspection, requiresInspection));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(incomingShipmentItems.trackingNumber, `%${search}%`),
        ilike(incomingShipmentItems.courierName, `%${search}%`),
        ilike(incomingShipmentItems.description, `%${search}%`)
      )
    );
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Get only the essential data for assignment UI
  const itemsQuery = db
    .select({
      // Core item fields
      id: incomingShipmentItems.id,
      incomingShipmentId: incomingShipmentItems.incomingShipmentId,
      trackingNumber: incomingShipmentItems.trackingNumber,
      courierName: incomingShipmentItems.courierName,
      assignmentStatus: incomingShipmentItems.assignmentStatus,
      assignedCustomerProfileId: incomingShipmentItems.assignedCustomerProfileId,
      assignedAt: incomingShipmentItems.assignedAt,
      scannedAt: incomingShipmentItems.scannedAt,
      
      // Status flags
      isFragile: incomingShipmentItems.isFragile,
      isHighValue: incomingShipmentItems.isHighValue,
      
      // Context from shipment
      batchReference: incomingShipments.batchReference,
      warehouseName: warehouses.name,
      
      // Customer info (via users table)
      customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      customerEmail: users.email,
      
      // Package info (if converted)
      packageId: packages.id,
      packageStatus: packages.status,
    })
    .from(incomingShipmentItems)
    .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
    .leftJoin(warehouses, eq(incomingShipmentItems.warehouseId, warehouses.id))
    .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
    .leftJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(packages, eq(incomingShipmentItems.id, packages.incomingShipmentItemId));

  // Apply filters and pagination
  const filteredQuery = whereClause ? itemsQuery.where(whereClause) : itemsQuery;
  
  const itemsResult = await filteredQuery
    .orderBy(desc(incomingShipmentItems.scannedAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination - simplified count query
  const totalCountQuery = db
    .select({ count: count() })
    .from(incomingShipmentItems);

  const totalCountResult = whereClause 
    ? await totalCountQuery.where(whereClause)
    : await totalCountQuery;

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Format the response with only assignment-relevant data
  const formattedItems: IncomingShipmentItemForAssignment[] = itemsResult.map(item => ({
    id: item.id,
    incomingShipmentId: item.incomingShipmentId,
    trackingNumber: item.trackingNumber,
    courierName: item.courierName,
    assignmentStatus: item.assignmentStatus as ItemAssignmentStatus,
    assignedCustomerProfileId: item.assignedCustomerProfileId,
    assignedAt: item.assignedAt,
    scannedAt: item.scannedAt,
    isFragile: item.isFragile,
    isHighValue: item.isHighValue,
    batchReference: item.batchReference,
    warehouseName: item.warehouseName,
    
    // Optional customer info (only if assigned)
    customerName: item.customerName || undefined,
    customerEmail: item.customerEmail || undefined,
    
    // Optional package info (only if converted)
    packageId: item.packageId || undefined,
    packageStatus: item.packageStatus || undefined,
  }));

  return {
    data: formattedItems,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: totalPages,
    },
  };
}