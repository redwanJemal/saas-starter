// features/packages/db/schema/index.ts
// Enhanced Package Management schemas (Packages, Incoming Shipments, Package Documents)
import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, date, json } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';
import { users } from '@/features/auth/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { customerProfiles } from '@/features/customers/db/schema';
import { couriers } from '@/features/settings/db/schema';
import { documents } from '@/features/settings/db/schema/documents.schema';

// ============================================================================= 
// ENUMS
// =============================================================================
export const packageStatusEnum = [
  'expected', 'received', 'processing', 'ready_to_ship', 'shipped', 
  'delivered', 'returned', 'disposed', 'missing', 'damaged', 'held'
] as const;

export const incomingShipmentStatusEnum = [
  'pending', 'scanning', 'scanned', 'assigned', 'received', 'expected'
] as const;

export const itemAssignmentStatusEnum = [
  'pending', 'unassigned', 'assigned', 'received'
] as const;

export type PackageStatus = typeof packageStatusEnum[number];
export type IncomingShipmentStatus = typeof incomingShipmentStatusEnum[number];
export type ItemAssignmentStatus = typeof itemAssignmentStatusEnum[number];

// =============================================================================
// INCOMING SHIPMENTS SCHEMA
// =============================================================================
export const incomingShipments = pgTable('incoming_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),

  // Shipment identification
  batchReference: varchar('batch_reference', { length: 100 }).notNull(),

  // Courier info
  courierId: uuid('courier_id').references(() => couriers.id),
  courierName: varchar('courier_name', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),

  // Dates
  arrivalDate: date('arrival_date'),
  expectedArrivalDate: date('expected_arrival_date'),
  actualArrivalDate: date('actual_arrival_date'),

  // Status and processing
  status: varchar('status', { length: 50 }).default('pending'),
  receivedBy: uuid('received_by').references(() => users.id),
  receivedAt: timestamp('received_at'),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const incomingShipmentItems = pgTable('incoming_shipment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Reference to parent shipment
  incomingShipmentId: uuid('incoming_shipment_id').references(() => incomingShipments.id, { onDelete: 'cascade' }).notNull(),

  // Tracking and courier info
  trackingNumber: varchar('tracking_number', { length: 255 }),
  courierName: varchar('courier_name', { length: 255 }),
  courierTrackingUrl: varchar('courier_tracking_url', { length: 500 }),

  // Scanning info
  scannedBy: uuid('scanned_by').references(() => users.id),
  scannedAt: timestamp('scanned_at'),

  // Assignment info
  assignedCustomerProfileId: uuid('assigned_customer_profile_id').references(() => customerProfiles.id),
  assignedBy: uuid('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at'),
  assignmentStatus: varchar('assignment_status', { length: 50 }).default('pending'),

  // Physical properties
  weightKg: decimal('weight_kg', { precision: 8, scale: 3 }),
  lengthCm: decimal('length_cm', { precision: 8, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 8, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 8, scale: 2 }),

  // Package info
  description: text('description'),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  estimatedValueCurrency: varchar('estimated_value_currency', { length: 3 }).default('USD'),

  // Processing notes
  notes: text('notes'),
  specialInstructions: text('special_instructions'),

  // Status flags
  isFragile: boolean('is_fragile').default(false),
  isHighValue: boolean('is_high_value').default(false),
  requiresInspection: boolean('requires_inspection').default(false),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// PACKAGES SCHEMA
// =============================================================================
export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Customer and warehouse
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Pre-receiving relationship (optional - for packages created from incoming shipments)
  incomingShipmentItemId: uuid('incoming_shipment_item_id').references(() => incomingShipmentItems.id),
  
  // Package identification
  internalId: varchar('internal_id', { length: 50 }).unique().notNull(),
  trackingNumberInbound: varchar('tracking_number_inbound', { length: 255 }),
  trackingNumberOutbound: varchar('tracking_number_outbound', { length: 255 }),
  
  // Physical properties
  weightKg: decimal('weight_kg', { precision: 8, scale: 3 }),
  lengthCm: decimal('length_cm', { precision: 8, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 8, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 8, scale: 2 }),
  volumetricWeightKg: decimal('volumetric_weight_kg', { precision: 8, scale: 3 }),
  chargeableWeightKg: decimal('chargeable_weight_kg', { precision: 8, scale: 3 }),
  
  // Status and dates
  status: varchar('status', { length: 20 }).notNull().default('expected'),
  statusNotes: text('status_notes'),
  expectedArrivalDate: date('expected_arrival_date'),
  receivedAt: timestamp('received_at'),
  readyToShipAt: timestamp('ready_to_ship_at'),
  storageExpiresAt: timestamp('storage_expires_at'),
  
  // Content and handling
  description: text('description'),
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
  
  // Customs information
  customsDeclaration: text('customs_declaration'),
  customsValue: decimal('customs_value', { precision: 12, scale: 2 }),
  customsValueCurrency: varchar('customs_value_currency', { length: 3 }),
  countryOfOrigin: varchar('country_of_origin', { length: 2 }),
  hsCode: varchar('hs_code', { length: 20 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// PACKAGE STATUS HISTORY SCHEMA  
// =============================================================================
export const packageStatusHistory = pgTable('package_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  fromStatus: varchar('from_status', { length: 20 }).notNull(),
  toStatus: varchar('to_status', { length: 20 }).notNull(),
  notes: text('notes'),
  changedBy: uuid('changed_by').references(() => users.id),
  changeReason: varchar('change_reason', { length: 255 }),
  
  // Additional context
  locationId: uuid('location_id'), // References bin_locations.id if applicable
  metadata: text('metadata'), // JSON string for additional data
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// PACKAGE DOCUMENTS SCHEMA (Missing table added)
// =============================================================================
export const packageDocuments = pgTable('package_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  // Document metadata
  documentType: varchar('document_type', { length: 50 }).notNull(),
  isPrimary: boolean('is_primary').default(false),
  displayOrder: integer('display_order').default(0),
  
  // Attachment info
  attachedBy: uuid('attached_by').references(() => users.id),
  attachedAt: timestamp('attached_at').notNull().defaultNow(),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Incoming shipment types
export type IncomingShipment = InferSelectModel<typeof incomingShipments>;
export type NewIncomingShipment = InferInsertModel<typeof incomingShipments>;
export type IncomingShipmentItem = InferSelectModel<typeof incomingShipmentItems>;
export type NewIncomingShipmentItem = InferInsertModel<typeof incomingShipmentItems>;

// Package types
export type Package = InferSelectModel<typeof packages>;
export type NewPackage = InferInsertModel<typeof packages>;
export type PackageStatusHistory = InferSelectModel<typeof packageStatusHistory>;
export type NewPackageStatusHistory = InferInsertModel<typeof packageStatusHistory>;

// Package document types
export type PackageDocument = InferSelectModel<typeof packageDocuments>;
export type NewPackageDocument = InferInsertModel<typeof packageDocuments>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================
export interface IncomingShipmentFilters {
  status?: IncomingShipmentStatus | IncomingShipmentStatus[];
  warehouseId?: string;
  courierId?: string;
  courierName?: string;
  batchReference?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IncomingShipmentItemFilters {
  incomingShipmentId?: string;
  assignmentStatus?: ItemAssignmentStatus | ItemAssignmentStatus[];
  assignedCustomerProfileId?: string;
  scannedBy?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresInspection?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PackageFilters {
  status?: PackageStatus | PackageStatus[];
  customerProfileId?: string;
  warehouseId?: string;
  incomingShipmentItemId?: string;
  search?: string;
  trackingNumberInbound?: string;
  internalId?: string;
  fromDate?: string;
  toDate?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  isRestricted?: boolean;
  page?: number;
  limit?: number;
}