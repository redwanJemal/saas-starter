import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, date, index, unique } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { packageStatusEnum } from './enums';
import { tenants } from './tenancy';
import { customerProfiles } from './customers';
import { warehouses } from './warehouses';
import { users } from './users';

// Forward reference for circular dependency
import { incomingShipmentItems } from './reference';

// =============================================================================
// PACKAGE MANAGEMENT
// =============================================================================

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Link to incoming shipment item
  incomingShipmentItemId: uuid('incoming_shipment_item_id').references(() => incomingShipmentItems.id),
  
  // Package identification
  internalId: varchar('internal_id', { length: 50 }).unique().notNull(),
  suiteCodeCaptured: varchar('suite_code_captured', { length: 50 }),
  
  // Inbound tracking
  trackingNumberInbound: varchar('tracking_number_inbound', { length: 255 }),
  courierName: varchar('courier_name', { length: 255 }), // Store courier name for reference
  senderName: varchar('sender_name', { length: 255 }),
  senderCompany: varchar('sender_company', { length: 255 }),
  senderTrackingUrl: varchar('sender_tracking_url', { length: 500 }),
  
  // Package details
  description: text('description'),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }).default('0'),
  estimatedValueCurrency: varchar('estimated_value_currency', { length: 3 }).default('USD'),
  
  // Physical properties
  weightActualKg: decimal('weight_actual_kg', { precision: 8, scale: 3 }),
  lengthCm: decimal('length_cm', { precision: 8, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 8, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 8, scale: 2 }),
  volumetricWeightKg: decimal('volumetric_weight_kg', { precision: 8, scale: 3 }),
  chargeableWeightKg: decimal('chargeable_weight_kg', { precision: 8, scale: 3 }),
  
  // Status and dates
  status: packageStatusEnum('status').default('expected'),
  expectedArrivalDate: date('expected_arrival_date'),
  receivedAt: timestamp('received_at'),
  readyToShipAt: timestamp('ready_to_ship_at'),
  storageExpiresAt: timestamp('storage_expires_at'),
  
  // Notes and instructions
  warehouseNotes: text('warehouse_notes'),
  customerNotes: text('customer_notes'),
  specialInstructions: text('special_instructions'),
  
  // Flags
  isFragile: boolean('is_fragile').default(false),
  isHighValue: boolean('is_high_value').default(false),
  requiresAdultSignature: boolean('requires_adult_signature').default(false),
  isRestricted: boolean('is_restricted').default(false),
  
  // Processing info
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    // Unique constraint to prevent duplicate tracking numbers with same courier for same tenant
    uniqueTrackingCourier: unique('unique_tracking_courier_per_tenant').on(
      table.trackingNumberInbound, 
      table.courierName, 
      table.tenantId
    ),
    // Index for performance
    trackingNumberIdx: index('packages_tracking_number_idx').on(table.trackingNumberInbound),
    statusIdx: index('packages_status_idx').on(table.status),
    customerIdx: index('packages_customer_idx').on(table.customerProfileId),
  };
});

export const packageStatusHistory = pgTable('package_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  status: packageStatusEnum('status').notNull(),
  notes: text('notes'),
  changedBy: uuid('changed_by').references(() => users.id),
  changeReason: varchar('change_reason', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports
export type Package = InferSelectModel<typeof packages>;
export type NewPackage = InferInsertModel<typeof packages>;

export type PackageStatusHistory = InferSelectModel<typeof packageStatusHistory>;
export type NewPackageStatusHistory = InferInsertModel<typeof packageStatusHistory>;
