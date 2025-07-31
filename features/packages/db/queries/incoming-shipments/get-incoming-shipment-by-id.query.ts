// features/packages/db/queries/incoming-shipments/get-incoming-shipment-by-id.query.ts
import { db } from '@/lib/db';
import { 
  incomingShipments, 
  incomingShipmentItems, 
  packages,
  type IncomingShipmentStatus,
  type ItemAssignmentStatus,
  type PackageStatus
} from '@/features/packages/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { couriers } from '@/features/settings/db/schema';
import { customerProfiles } from '@/features/customers/db/schema';
import { users } from '@/features/auth/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { IncomingShipmentWithItems } from '@/features/packages/types/package.types';

export async function getIncomingShipmentById(id: string): Promise<IncomingShipmentWithItems | null> {
  // Get incoming shipment details
  const [shipmentDetails] = await db
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
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
      
      // Courier info
      courierServiceName: couriers.name,
      courierCode: couriers.code,
      
      // Received by user info
      receivedByName: sql<string>`received_user.first_name || ' ' || received_user.last_name`,
      receivedByEmail: sql<string>`received_user.email`,
      
      // Processed by user info
      processedByName: sql<string>`processed_user.first_name || ' ' || processed_user.last_name`,
      processedByEmail: sql<string>`processed_user.email`,
    })
    .from(incomingShipments)
    .leftJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
    .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
    .leftJoin(
      sql`${users} as received_user`, 
      sql`${incomingShipments.receivedBy} = received_user.id`
    )
    .leftJoin(
      sql`${users} as processed_user`, 
      sql`${incomingShipments.processedBy} = processed_user.id`
    )
    .where(eq(incomingShipments.id, id))
    .limit(1);

  if (!shipmentDetails) {
    return null;
  }

  // Get items for this shipment
  const items = await db
    .select({
      // Shipment item fields
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
      
      // Package info (if converted)
      packageId: packages.id,
      packageStatus: packages.status,
      packageInternalId: packages.internalId,
      
      // Customer assignment info
      customerId: customerProfiles.id,
      customerName: sql<string>`${customerProfiles.firstName} || ' ' || ${customerProfiles.lastName}`,
      customerEmail: customerProfiles.email,
      
      // Scanned by user info
      scannedByName: sql<string>`scanned_user.first_name || ' ' || scanned_user.last_name`,
      scannedByEmail: sql<string>`scanned_user.email`,
      
      // Assigned by user info
      assignedByName: sql<string>`assigned_user.first_name || ' ' || assigned_user.last_name`,
      assignedByEmail: sql<string>`assigned_user.email`,
    })
    .from(incomingShipmentItems)
    .leftJoin(packages, eq(incomingShipmentItems.id, packages.incomingShipmentItemId))
    .leftJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
    .leftJoin(
      sql`${users} as scanned_user`, 
      sql`${incomingShipmentItems.scannedBy} = scanned_user.id`
    )
    .leftJoin(
      sql`${users} as assigned_user`, 
      sql`${incomingShipmentItems.assignedBy} = assigned_user.id`
    )
    .where(eq(incomingShipmentItems.incomingShipmentId, id));

  // Format the response
  const result: IncomingShipmentWithItems = {
    ...shipmentDetails,
    
    // Warehouse info
    warehouseName: shipmentDetails.warehouseName || undefined,
    warehouseCode: shipmentDetails.warehouseCode || undefined,
    
    // Courier info
    courier: shipmentDetails.courierId ? {
      id: shipmentDetails.courierId,
      name: shipmentDetails.courierServiceName || shipmentDetails.courierName || '',
      code: shipmentDetails.courierCode || '',
    } : undefined,
    
    // Items with extended info
    items: items.map(item => ({
      ...item,
      // Convert decimal fields to numbers
      weightKg: item.weightKg ? parseFloat(item.weightKg.toString()) : null,
      lengthCm: item.lengthCm ? parseFloat(item.lengthCm.toString()) : null,
      widthCm: item.widthCm ? parseFloat(item.widthCm.toString()) : null,
      heightCm: item.heightCm ? parseFloat(item.heightCm.toString()) : null,
      estimatedValue: item.estimatedValue ? parseFloat(item.estimatedValue.toString()) : null,
      
      // Package info (if converted to package)
      package: item.packageId ? {
        id: item.packageId,
        status: item.packageStatus,
        internalId: item.packageInternalId,
      } : undefined,
      
      // Customer assignment info
      assignedToCustomer: item.customerId ? {
        customerId: item.customerId,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
      } : undefined,
      
      // Additional user info
      scannedByUser: item.scannedByName ? {
        name: item.scannedByName,
        email: item.scannedByEmail || '',
      } : undefined,
      
      assignedByUser: item.assignedByName ? {
        name: item.assignedByName,
        email: item.assignedByEmail || '',
      } : undefined,
    })),
  };

  return result;
}