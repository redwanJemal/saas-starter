// features/packages/db/queries/incoming-shipments/create-incoming-shipment.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipments, 
  incomingShipmentItems, 
  type IncomingShipment, 
  type IncomingShipmentItem, 
  type IncomingShipmentStatus, 
  type ItemAssignmentStatus 
} from '@/features/packages/db/schema';

export interface CreateIncomingShipmentData {
  tenantId: string;
  warehouseId: string;
  batchReference: string;
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  arrivalDate?: Date | string;
  expectedArrivalDate?: Date | string;
  actualArrivalDate?: Date | string;
  status?: IncomingShipmentStatus;
  receivedBy?: string;
  receivedAt?: Date;
  processedBy?: string;
  processedAt?: Date;
  notes?: string;
}

export interface CreateIncomingShipmentItemData {
  tenantId: string;
  warehouseId: string;
  incomingShipmentId: string;
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

export async function createIncomingShipment(
  data: CreateIncomingShipmentData
): Promise<IncomingShipment> {
  // Validate required fields
  if (!data.tenantId || !data.warehouseId || !data.batchReference) {
    throw new Error('tenantId, warehouseId, and batchReference are required');
  }

  const [newShipment] = await db
    .insert(incomingShipments)
    .values({
      ...data,
      status: data.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newShipment;
}

/**
 * Create incoming shipment with items in a single transaction
 */
export async function createIncomingShipmentWithItems(
  shipmentData: CreateIncomingShipmentData,
  itemsData: Omit<CreateIncomingShipmentItemData, 'incomingShipmentId'>[]
): Promise<{
  shipment: IncomingShipment;
  items: IncomingShipmentItem[];
}> {
  console.log('🔄 Starting transaction for shipment creation...');
  console.log('📦 Shipment data:', JSON.stringify(shipmentData, null, 2));
  console.log('📋 Items data count:', itemsData.length);
  
  return await db.transaction(async (tx) => {
    try {
      console.log('🔄 Creating shipment...');
      
      // Create the shipment
      const [newShipment] = await tx
        .insert(incomingShipments)
        .values({
          ...shipmentData,
          status: shipmentData.status || 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ Shipment created:', newShipment.id);

      // Create the items
      const newItems: IncomingShipmentItem[] = [];
      
      if (itemsData.length > 0) {
        console.log('🔄 Creating items...');
        
        const itemsToInsert = itemsData.map(item => ({
          ...item,
          incomingShipmentId: newShipment.id,
          assignmentStatus: item.assignmentStatus || 'unassigned',
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        console.log('📦 Items to insert:', JSON.stringify(itemsToInsert, null, 2));

        const createdItems = await tx
          .insert(incomingShipmentItems)
          .values(itemsToInsert)
          .returning();

        console.log('✅ Items created:', createdItems.length);
        
        newItems.push(...createdItems);
      } else {
        console.log('⚠️ No items to create');
      }

      return {
        shipment: newShipment,
        items: newItems,
      };
    } catch (error) {
      console.error('❌ Transaction error:', error);
      throw error;
    }
  });
}

/**
 * Add item to existing incoming shipment
 */
export async function addItemToIncomingShipment(
  shipmentId: string,
  itemData: Omit<CreateIncomingShipmentItemData, 'incomingShipmentId'>
): Promise<IncomingShipmentItem> {
  const [newItem] = await db
    .insert(incomingShipmentItems)
    .values({
      ...itemData,
      incomingShipmentId: shipmentId,
      assignmentStatus: itemData.assignmentStatus || 'unassigned',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newItem;
}

/**
 * Bulk create incoming shipment items
 */
export async function bulkCreateIncomingShipmentItems(
  shipmentId: string,
  itemsData: Omit<CreateIncomingShipmentItemData, 'incomingShipmentId'>[]
): Promise<IncomingShipmentItem[]> {
  if (itemsData.length === 0) {
    return [];
  }

  const itemsToInsert = itemsData.map(item => ({
    ...item,
    incomingShipmentId: shipmentId,
    assignmentStatus: item.assignmentStatus || 'unassigned',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const createdItems = await db
    .insert(incomingShipmentItems)
    .values(itemsToInsert)
    .returning();

  return createdItems;
}