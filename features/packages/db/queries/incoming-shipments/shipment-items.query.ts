// features/packages/db/queries/incoming-shipments/shipment-items.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipmentItems, 
  packages,
  type IncomingShipmentItem,
  type ItemAssignmentStatus,
  type PackageStatus
} from '@/features/packages/db/schema';
import { customerProfiles } from '@/features/customers/db/schema';
import { users } from '@/features/auth/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface UpdateIncomingShipmentItemData {
  trackingNumber?: string;
  courierName?: string;
  courierTrackingUrl?: string;
  scannedBy?: string;
  scannedAt?: Date;
  assignedCustomerProfileId?: string;
  assignedBy?: string;
  assignedAt?: Date;
  assignmentStatus?: ItemAssignmentStatus;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  description?: string;
  estimatedValue?: number;
  estimatedValueCurrency?: string;
  notes?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresInspection?: boolean;
}

/**
 * Update incoming shipment item
 */
export async function updateIncomingShipmentItem(
  id: string,
  data: UpdateIncomingShipmentItemData,
  updatedBy?: string
): Promise<IncomingShipmentItem> {
  const updateData: Partial<IncomingShipmentItem> = {
    ...data,
    updatedAt: new Date(),
  };

  // Handle assignment logic
  if (data.assignedCustomerProfileId && !data.assignedAt) {
    updateData.assignedAt = new Date();
    updateData.assignedBy = updatedBy;
    updateData.assignmentStatus = 'assigned';
  }

  // Handle scanning logic
  if (data.scannedBy && !data.scannedAt) {
    updateData.scannedAt = new Date();
  }

  const [updatedItem] = await db
    .update(incomingShipmentItems)
    .set(updateData)
    .where(eq(incomingShipmentItems.id, id))
    .returning();

  if (!updatedItem) {
    throw new Error('Incoming shipment item not found');
  }

  return updatedItem;
}

/**
 * Assign incoming shipment item to customer
 */
export async function assignIncomingShipmentItemToCustomer(
  itemId: string,
  customerProfileId: string,
  assignedBy: string,
  notes?: string
): Promise<IncomingShipmentItem> {
  const updateData: UpdateIncomingShipmentItemData = {
    assignedCustomerProfileId: customerProfileId,
    assignedBy,
    assignedAt: new Date(),
    assignmentStatus: 'assigned',
    notes,
  };

  return await updateIncomingShipmentItem(itemId, updateData, assignedBy);
}

/**
 * Mark incoming shipment item as scanned
 */
export async function markIncomingShipmentItemAsScanned(
  itemId: string,
  scannedBy: string,
  scanData?: {
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    description?: string;
    notes?: string;
  }
): Promise<IncomingShipmentItem> {
  const updateData: UpdateIncomingShipmentItemData = {
    scannedBy,
    scannedAt: new Date(),
    ...scanData,
  };

  return await updateIncomingShipmentItem(itemId, updateData, scannedBy);
}

/**
 * Get incoming shipment item with related data
 */
export async function getIncomingShipmentItemById(itemId: string): Promise<{
  item: IncomingShipmentItem;
  assignedCustomer?: {
    id: string;
    name: string;
    email: string;
  };
  scannedByUser?: {
    name: string;
    email: string;
  };
  assignedByUser?: {
    name: string;
    email: string;
  };
  convertedPackage?: {
    id: string;
    internalId: string;
    status: PackageStatus;
  };
} | null> {
  const [result] = await db
    .select({
      // Item fields
      id: incomingShipmentItems.id,
      tenantId: incomingShipmentItems.tenantId,
      warehouseId: incomingShipmentItems.warehouseId,
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
      
      // Customer info
      customerId: customerProfiles.id,
      customerName: sql<string>`${customerProfiles.firstName} || ' ' || ${customerProfiles.lastName}`,
      customerEmail: customerProfiles.email,
      
      // Scanned by user info
      scannedByName: sql<string>`scanned_user.first_name || ' ' || scanned_user.last_name`,
      scannedByEmail: sql<string>`scanned_user.email`,
      
      // Assigned by user info
      assignedByName: sql<string>`assigned_user.first_name || ' ' || assigned_user.last_name`,
      assignedByEmail: sql<string>`assigned_user.email`,
      
      // Package info (if converted)
      packageId: packages.id,
      packageInternalId: packages.internalId,
      packageStatus: packages.status,
    })
    .from(incomingShipmentItems)
    .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
    .leftJoin(
      sql`${users} as scanned_user`, 
      sql`${incomingShipmentItems.scannedBy} = scanned_user.id`
    )
    .leftJoin(
      sql`${users} as assigned_user`, 
      sql`${incomingShipmentItems.assignedBy} = assigned_user.id`
    )
    .leftJoin(packages, eq(incomingShipmentItems.id, packages.incomingShipmentItemId))
    .where(eq(incomingShipmentItems.id, itemId))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    item: {
      id: result.id,
      tenantId: result.tenantId,
      warehouseId: result.warehouseId,
      incomingShipmentId: result.incomingShipmentId,
      trackingNumber: result.trackingNumber,
      courierName: result.courierName,
      courierTrackingUrl: result.courierTrackingUrl,
      scannedBy: result.scannedBy,
      scannedAt: result.scannedAt,
      assignedCustomerProfileId: result.assignedCustomerProfileId,
      assignedBy: result.assignedBy,
      assignedAt: result.assignedAt,
      assignmentStatus: result.assignmentStatus,
      weightKg: result.weightKg,
      lengthCm: result.lengthCm,
      widthCm: result.widthCm,
      heightCm: result.heightCm,
      description: result.description,
      estimatedValue: result.estimatedValue,
      estimatedValueCurrency: result.estimatedValueCurrency,
      notes: result.notes,
      specialInstructions: result.specialInstructions,
      isFragile: result.isFragile,
      isHighValue: result.isHighValue,
      requiresInspection: result.requiresInspection,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    },
    assignedCustomer: result.customerId ? {
      id: result.customerId,
      name: result.customerName || '',
      email: result.customerEmail || '',
    } : undefined,
    scannedByUser: result.scannedByName ? {
      name: result.scannedByName,
      email: result.scannedByEmail || '',
    } : undefined,
    assignedByUser: result.assignedByName ? {
      name: result.assignedByName,
      email: result.assignedByEmail || '',
    } : undefined,
    convertedPackage: result.packageId ? {
      id: result.packageId,
      internalId: result.packageInternalId || '',
      status: result.packageStatus as PackageStatus || '',
    } : undefined,
  };
}

/**
 * Bulk update multiple incoming shipment items
 */
export async function bulkUpdateIncomingShipmentItems(
  itemIds: string[],
  data: UpdateIncomingShipmentItemData,
  updatedBy?: string
): Promise<IncomingShipmentItem[]> {
  if (itemIds.length === 0) {
    return [];
  }

  const updateData: Partial<IncomingShipmentItem> = {
    ...data,
    updatedAt: new Date(),
  };

  // Handle bulk assignment logic
  if (data.assignedCustomerProfileId && updatedBy) {
    updateData.assignedAt = new Date();
    updateData.assignedBy = updatedBy;
    updateData.assignmentStatus = 'assigned';
  }

  // Update each item individually (can be optimized with 'in' operator later)
  const results: IncomingShipmentItem[] = [];
  for (const itemId of itemIds) {
    const [updated] = await db
      .update(incomingShipmentItems)
      .set(updateData)
      .where(eq(incomingShipmentItems.id, itemId))
      .returning();
    
    if (updated) {
      results.push(updated);
    }
  }

  return results;
}

/**
 * Delete incoming shipment item
 */
export async function deleteIncomingShipmentItem(itemId: string): Promise<boolean> {
  try {
    // Check if item is already converted to package
    const [existingPackage] = await db
      .select()
      .from(packages)
      .where(eq(packages.incomingShipmentItemId, itemId))
      .limit(1);

    if (existingPackage) {
      throw new Error('Cannot delete incoming shipment item that has been converted to a package');
    }

    // Delete the item
    const result = await db
      .delete(incomingShipmentItems)
      .where(eq(incomingShipmentItems.id, itemId))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Error deleting incoming shipment item:', error);
    throw error;
  }
}