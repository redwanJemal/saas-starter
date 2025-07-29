// features/packages/db/schema/index.ts
// Enhanced Package Management schemas (Packages, Incoming Shipments)
// Documents moved to settings feature for polymorphic access

import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, date } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { documentTypeEnum as settingsDocumentTypeEnum, DocumentType as SettingsDocumentType, EntityDocument, NewEntityDocument } from '@/features/settings/db/schema';

// =============================================================================
// ENUMS
// =============================================================================

export const packageStatusEnum = [
  'expected',
  'received', 
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'returned',
  'disposed',
  'missing',
  'damaged',
  'held'
] as const;

export const incomingShipmentStatusEnum = [
  'pending',
  'scanning', 
  'scanned',
  'assigned',
  'received',
  'expected'
] as const;

export const itemAssignmentStatusEnum = [
  'unassigned',
  'assigned', 
  'received'
] as const;

export type PackageStatus = typeof packageStatusEnum[number];
export type IncomingShipmentStatus = typeof incomingShipmentStatusEnum[number];
export type ItemAssignmentStatus = typeof itemAssignmentStatusEnum[number];


// =============================================================================
// INCOMING SHIPMENT PROCESSING
// =============================================================================

export const incomingShipments = pgTable('incoming_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Shipment identification
  batchReference: varchar('batch_reference', { length: 100 }).notNull(),
  
  // Courier info
  courierId: uuid('courier_id'), // References couriers.id
  courierName: varchar('courier_name', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  
  // Dates
  arrivalDate: date('arrival_date'),
  expectedArrivalDate: date('expected_arrival_date'),
  actualArrivalDate: date('actual_arrival_date'),
  
  // Status and processing
  status: varchar('status', { length: 20 }).default('pending'),
  receivedBy: uuid('received_by'), // References users.id
  receivedAt: timestamp('received_at'),
  processedBy: uuid('processed_by'), // References users.id
  processedAt: timestamp('processed_at'),
  
  // Metadata
  notes: text('notes'),
  totalItems: integer('total_items').default(0),
  processedItems: integer('processed_items').default(0),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const incomingShipmentItems = pgTable('incoming_shipment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  incomingShipmentId: uuid('incoming_shipment_id').references(() => incomingShipments.id, { onDelete: 'cascade' }).notNull(),
  
  // Tracking and courier info
  trackingNumber: varchar('tracking_number', { length: 255 }),
  courierName: varchar('courier_name', { length: 255 }),
  courierTrackingUrl: varchar('courier_tracking_url', { length: 500 }),
  
  // Scanning info
  scannedBy: uuid('scanned_by'), // References users.id
  scannedAt: timestamp('scanned_at'),
  
  // Assignment info
  assignedCustomerProfileId: uuid('assigned_customer_profile_id'), // References customer_profiles.id
  assignedBy: uuid('assigned_by'), // References users.id
  assignedAt: timestamp('assigned_at'),
  assignmentStatus: varchar('assignment_status', { length: 20 }).default('pending'),
  
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
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// ENHANCED PACKAGE MANAGEMENT
// =============================================================================

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').notNull(), // References customer_profiles.id
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Link to incoming shipment item
  incomingShipmentItemId: uuid('incoming_shipment_item_id').references(() => incomingShipmentItems.id),
  
  // Package identification
  internalId: varchar('internal_id', { length: 50 }).unique().notNull(),
  suiteCodeCaptured: varchar('suite_code_captured', { length: 50 }),
  
  // Inbound tracking
  trackingNumberInbound: varchar('tracking_number_inbound', { length: 255 }),
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
  status: varchar('status', { length: 20 }).default('expected'),
  expectedArrivalDate: date('expected_arrival_date'),
  receivedAt: timestamp('received_at'),
  readyToShipAt: timestamp('ready_to_ship_at'),
  storageExpiresAt: timestamp('storage_expires_at'),
  
  // Notes and instructions
  warehouseNotes: text('warehouse_notes'),
  customerNotes: text('customer_notes'),
  specialInstructions: text('special_instructions'),
  
  // Package characteristics
  isFragile: boolean('is_fragile').default(false),
  isHighValue: boolean('is_high_value').default(false),
  requiresAdultSignature: boolean('requires_adult_signature').default(false),
  isRestricted: boolean('is_restricted').default(false),
  
  // Processing info
  processedBy: uuid('processed_by'), // References users.id
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

export const packageStatusHistory = pgTable('package_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  previousStatus: varchar('previous_status', { length: 20 }),
  notes: text('notes'),
  changedBy: uuid('changed_by'), // References users.id
  changeReason: varchar('change_reason', { length: 255 }),
  
  // Additional context
  locationId: uuid('location_id'), // References bin_locations.id if applicable
  metadata: text('metadata'), // JSON string for additional data
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
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

// Legacy type aliases for backward compatibility
export type PackageDocument = EntityDocument;
export type NewPackageDocument = NewEntityDocument;

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
  senderName?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  isRestricted?: boolean;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateIncomingShipmentData {
  warehouseId: string;
  batchReference: string;
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  arrivalDate?: string;
  expectedArrivalDate?: string;
  notes?: string;
}

export interface UpdateIncomingShipmentData {
  batchReference?: string;
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  arrivalDate?: string;
  expectedArrivalDate?: string;
  actualArrivalDate?: string;
  status?: IncomingShipmentStatus;
  receivedBy?: string;
  receivedAt?: string;
  processedBy?: string;
  processedAt?: string;
  notes?: string;
}

export interface CreateIncomingShipmentItemData {
  incomingShipmentId: string;
  trackingNumber?: string;
  courierName?: string;
  courierTrackingUrl?: string;
  assignedCustomerProfileId?: string;
  weightKg?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  description?: string;
  estimatedValue?: string;
  estimatedValueCurrency?: string;
  notes?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresInspection?: boolean;
}

export interface CreatePackageData {
  customerProfileId: string;
  warehouseId: string;
  internalId: string;
  incomingShipmentItemId?: string;
  suiteCodeCaptured?: string;
  trackingNumberInbound?: string;
  senderName?: string;
  senderCompany?: string;
  senderTrackingUrl?: string;
  description?: string;
  estimatedValue?: string;
  estimatedValueCurrency?: string;
  weightActualKg?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  status?: PackageStatus;
  expectedArrivalDate?: string;
  warehouseNotes?: string;
  customerNotes?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresAdultSignature?: boolean;
  isRestricted?: boolean;
  customsDeclaration?: string;
  customsValue?: string;
  customsValueCurrency?: string;
  countryOfOrigin?: string;
  hsCode?: string;
}

export interface UpdatePackageData {
  suiteCodeCaptured?: string;
  trackingNumberInbound?: string;
  senderName?: string;
  senderCompany?: string;
  senderTrackingUrl?: string;
  description?: string;
  estimatedValue?: string;
  estimatedValueCurrency?: string;
  weightActualKg?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  volumetricWeightKg?: string;
  chargeableWeightKg?: string;
  status?: PackageStatus;
  expectedArrivalDate?: string;
  receivedAt?: string;
  readyToShipAt?: string;
  storageExpiresAt?: string;
  warehouseNotes?: string;
  customerNotes?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresAdultSignature?: boolean;
  isRestricted?: boolean;
  processedBy?: string;
  processedAt?: string;
  customsDeclaration?: string;
  customsValue?: string;
  customsValueCurrency?: string;
  countryOfOrigin?: string;
  hsCode?: string;
}
