import { db } from '@/lib/db';
import { customerWarehouseAssignments, warehouses } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { CustomerWarehouseAssignment } from '@/features/warehouses/db/schema';
import { CustomerProfile, customerProfiles, users } from '@/lib/db/schema';
import { User } from '@/lib/db/schema';

export async function getCustomerWarehouseAssignmentById(id: string) {
  const assignmentResult = await db
    .select({
      id: customerWarehouseAssignments.id,
      customerProfileId: customerWarehouseAssignments.customerProfileId,
      warehouseId: customerWarehouseAssignments.warehouseId,
      status: customerWarehouseAssignments.status,
      assignedAt: customerWarehouseAssignments.assignedAt,
      expiresAt: customerWarehouseAssignments.expiresAt,
      notes: customerWarehouseAssignments.notes,
      assignedBy: customerWarehouseAssignments.assignedBy,
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
    .innerJoin(warehouses, eq(customerWarehouseAssignments.warehouseId, warehouses.id))
    .where(eq(customerWarehouseAssignments.id, id))
    .limit(1);

  if (assignmentResult.length === 0) {
    return null;
  }

  return assignmentResult[0];
}
