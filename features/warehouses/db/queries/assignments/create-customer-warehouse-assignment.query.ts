import { db } from '@/lib/db';
import { customerWarehouseAssignments, warehouses } from '@/features/warehouses/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateCustomerWarehouseAssignmentData, CustomerWarehouseAssignment } from '@/features/warehouses/db/schema';
import { customerProfiles } from '@/lib/db/schema';

export async function createCustomerWarehouseAssignment(
  tenantId: string,
  data: CreateCustomerWarehouseAssignmentData,
  assignedBy: string
): Promise<CustomerWarehouseAssignment> {
  // Validate customer exists
  const customerExists = await db
    .select({ id: customerProfiles.id })
    .from(customerProfiles)
    .where(and(eq(customerProfiles.id, data.customerProfileId), eq(customerProfiles.tenantId, tenantId)))
    .limit(1);

  if (customerExists.length === 0) {
    throw new Error('Customer not found');
  }

  // Validate warehouse exists
  const warehouseExists = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(eq(warehouses.id, data.warehouseId), eq(warehouses.tenantId, tenantId)))
    .limit(1);

  if (warehouseExists.length === 0) {
    throw new Error('Warehouse not found');
  }

  // Check for existing active assignment
  const existingAssignment = await db
    .select({ id: customerWarehouseAssignments.id })
    .from(customerWarehouseAssignments)
    .where(
      and(
        eq(customerWarehouseAssignments.customerProfileId, data.customerProfileId),
        eq(customerWarehouseAssignments.warehouseId, data.warehouseId),
        eq(customerWarehouseAssignments.status, 'active')
      )
    )
    .limit(1);

  if (existingAssignment.length > 0) {
    throw new Error('Customer already has an active assignment to this warehouse');
  }

  // Create new assignment with proper date handling
  const newAssignmentData = {
    tenantId,
    customerProfileId: data.customerProfileId,
    warehouseId: data.warehouseId,
    suiteCode: data.suiteCode,
    status: data.status || 'active',
    assignedAt: data.assignedAt ? new Date(data.assignedAt) : new Date(),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    notes: data.notes,
    assignedBy,
  };

  const [newAssignment] = await db
    .insert(customerWarehouseAssignments)
    .values(newAssignmentData)
    .returning();

  return newAssignment;
}