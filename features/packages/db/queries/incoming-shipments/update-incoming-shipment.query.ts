// features/packages/db/queries/incoming-shipments/update-incoming-shipment.query.ts
import { db } from '@/lib/db';
import { incomingShipments, type IncomingShipment } from '@/features/packages/db/schema';
import { eq } from 'drizzle-orm';

export interface UpdateIncomingShipmentData {
  warehouseId?: string;
  batchReference?: string;
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  arrivalDate?: string | null;
  expectedArrivalDate?: string | null;
  actualArrivalDate?: string | null;
  status?: string;
  receivedBy?: string | null;
  receivedAt?: Date | null;
  processedBy?: string | null;
  processedAt?: Date | null;
  notes?: string | null;
}

export async function updateIncomingShipment(
  id: string,
  data: UpdateIncomingShipmentData,
  updatedBy?: string
): Promise<IncomingShipment> {
  // Prepare update data
  const updateData: Partial<IncomingShipment> = {
    ...data,
    updatedAt: new Date(),
  };

  // Handle date conversions
  if (data.arrivalDate !== undefined) {
    updateData.arrivalDate = data.arrivalDate;
  }
  
  if (data.expectedArrivalDate !== undefined) {
    updateData.expectedArrivalDate = data.expectedArrivalDate;
  }
  
  if (data.actualArrivalDate !== undefined) {
    updateData.actualArrivalDate = data.actualArrivalDate;
  }

  // Handle status-specific logic
  if (data.status) {
    switch (data.status) {
      case 'received':
        if (!updateData.receivedAt && !data.receivedAt) {
          updateData.receivedAt = new Date();
        }
        if (updatedBy && !updateData.receivedBy && !data.receivedBy) {
          updateData.receivedBy = updatedBy;
        }
        break;
      
      case 'scanning':
      case 'scanned':
        if (!updateData.processedAt && !data.processedAt) {
          updateData.processedAt = new Date();
        }
        if (updatedBy && !updateData.processedBy && !data.processedBy) {
          updateData.processedBy = updatedBy;
        }
        break;
    }
  }

  // Validate required fields for certain statuses
  if (data.status === 'received' && !updateData.receivedBy && !data.receivedBy) {
    throw new Error('receivedBy is required when status is set to received');
  }

  // Update the incoming shipment
  const [updatedShipment] = await db
    .update(incomingShipments)
    .set(updateData)
    .where(eq(incomingShipments.id, id))
    .returning();

  if (!updatedShipment) {
    throw new Error('Incoming shipment not found');
  }

  return updatedShipment;
}

/**
 * Update incoming shipment status with automatic timestamp handling
 */
export async function updateIncomingShipmentStatus(
  id: string,
  status: string,
  updatedBy?: string,
  notes?: string
): Promise<IncomingShipment> {
  const updateData: UpdateIncomingShipmentData = {
    status,
    notes,
  };

  return await updateIncomingShipment(id, updateData, updatedBy);
}

/**
 * Mark incoming shipment as received
 */
export async function markIncomingShipmentAsReceived(
  id: string,
  receivedBy: string,
  actualArrivalDate?: string,
  notes?: string
): Promise<IncomingShipment> {
  const updateData: UpdateIncomingShipmentData = {
    status: 'received',
    receivedBy,
    receivedAt: new Date(),
    actualArrivalDate: actualArrivalDate || new Date().toISOString().split('T')[0],
    notes,
  };

  return await updateIncomingShipment(id, updateData, receivedBy);
}

/**
 * Mark incoming shipment as processed
 */
export async function markIncomingShipmentAsProcessed(
  id: string,
  processedBy: string,
  notes?: string
): Promise<IncomingShipment> {
  const updateData: UpdateIncomingShipmentData = {
    status: 'scanned',
    processedBy,
    processedAt: new Date(),
    notes,
  };

  return await updateIncomingShipment(id, updateData, processedBy);
}

/**
 * Bulk update multiple incoming shipments
 */
export async function bulkUpdateIncomingShipments(
  ids: string[],
  data: UpdateIncomingShipmentData,
  updatedBy?: string
): Promise<IncomingShipment[]> {
  if (ids.length === 0) {
    return [];
  }

  const updateData: Partial<IncomingShipment> = {
    ...data,
    updatedAt: new Date(),
  };

  // Handle status-specific logic for bulk updates
  if (data.status && updatedBy) {
    switch (data.status) {
      case 'received':
        if (!updateData.receivedAt) {
          updateData.receivedAt = new Date();
        }
        if (!updateData.receivedBy) {
          updateData.receivedBy = updatedBy;
        }
        break;
      
      case 'scanning':
      case 'scanned':
        if (!updateData.processedAt) {
          updateData.processedAt = new Date();
        }
        if (!updateData.processedBy) {
          updateData.processedBy = updatedBy;
        }
        break;
    }
  }

  const updatedShipments = await db
    .update(incomingShipments)
    .set(updateData)
    .where(eq(incomingShipments.id, ids[0])) // This will be updated to use 'in' operator for multiple IDs
    .returning();

  // For now, update each shipment individually to handle multiple IDs
  // TODO: Use 'in' operator when available
  const results: IncomingShipment[] = [];
  for (const id of ids) {
    const [updated] = await db
      .update(incomingShipments)
      .set(updateData)
      .where(eq(incomingShipments.id, id))
      .returning();
    
    if (updated) {
      results.push(updated);
    }
  }

  return results;
}