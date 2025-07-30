import { db } from '@/lib/db';
import { customerWarehouseAssignments, warehouses } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { customerProfiles, users } from '@/lib/db/schema';
import type { CustomerWarehouseAssignmentFilters } from '@/features/warehouses/db/schema';

export async function getCustomerWarehouseAssignments(filters: CustomerWarehouseAssignmentFilters = {}) {
  const { page = 1, limit = 10, warehouseId, customerId, status, search } = filters;

  // Build where conditions
  const conditions = [];
  
  if (warehouseId) {
    conditions.push(eq(customerWarehouseAssignments.warehouseId, warehouseId));
  }
  
  if (customerId) {
    conditions.push(eq(customerWarehouseAssignments.customerProfileId, customerId));
  }
  
  if (status) {
    conditions.push(eq(customerWarehouseAssignments.status, status));
  }
  
  if (search) {
    conditions.push(
      sql`(${users.firstName} ILIKE ${`%${search}%`} OR ${users.lastName} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${customerProfiles.customerId} ILIKE ${`%${search}%`})`
    );
  }

  // Create base query
  const baseQuery = db
    .select({
      id: customerWarehouseAssignments.id,
      customerProfileId: customerWarehouseAssignments.customerProfileId,
      warehouseId: customerWarehouseAssignments.warehouseId,
      status: customerWarehouseAssignments.status,
      assignedAt: customerWarehouseAssignments.assignedAt,
      expiresAt: customerWarehouseAssignments.expiresAt,
      notes: customerWarehouseAssignments.notes,
      createdAt: customerWarehouseAssignments.createdAt,
      updatedAt: customerWarehouseAssignments.updatedAt,
      // Customer info
      customerId: customerProfiles.customerId,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
      // Warehouse info
      warehouseCode: warehouses.code,
      warehouseName: warehouses.name,
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
    })
    .from(customerWarehouseAssignments)
    .innerJoin(customerProfiles, eq(customerWarehouseAssignments.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .innerJoin(warehouses, eq(customerWarehouseAssignments.warehouseId, warehouses.id));

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions)) 
    : baseQuery;

  // Execute query with ordering
  const allAssignments = await finalQuery.orderBy(desc(customerWarehouseAssignments.createdAt));

  // Calculate pagination
  const total = allAssignments.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAssignments = allAssignments.slice(startIndex, endIndex);

  return {
    data: paginatedAssignments,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}
