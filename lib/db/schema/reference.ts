import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, date, decimal } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { incomingShipmentStatusEnum, itemAssignmentStatusEnum } from './enums';
import { tenants } from './tenancy';
import { warehouses } from './warehouses';
import { customerProfiles } from './customers';
import { users } from './users';

// =============================================================================
// GLOBAL REFERENCE TABLES
// =============================================================================

export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  code: varchar('code', { length: 2 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  
  // Region information
  region: varchar('region', { length: 100 }),
  subregion: varchar('subregion', { length: 100 }),
  
  // Status flags
  isActive: boolean('is_active').default(true),
  isShippingEnabled: boolean('is_shipping_enabled').default(true),
  
  // Shipping requirements
  requiresPostalCode: boolean('requires_postal_code').default(true),
  requiresStateProvince: boolean('requires_state_province').default(false),
  
  // Customs information
  euMember: boolean('eu_member').default(false),
  customsFormType: varchar('customs_form_type', { length: 50 }),
  
  // Metadata
  flagEmoji: varchar('flag_emoji', { length: 10 }),
  phonePrefix: varchar('phone_prefix', { length: 10 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  code: varchar('code', { length: 3 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  
  // Status flags
  isActive: boolean('is_active').default(true),
  
  // Display formatting
  decimalPlaces: integer('decimal_places').default(2),
  symbolPosition: varchar('symbol_position', { length: 10 }).default('before'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const couriers = pgTable('couriers', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  code: varchar('code', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  
  // Contact and tracking
  website: varchar('website', { length: 255 }),
  trackingUrlTemplate: varchar('tracking_url_template', { length: 500 }),
  
  // Status flags
  isActive: boolean('is_active').default(true),
  
  // Integration details
  apiCredentials: jsonb('api_credentials'),
  integrationSettings: jsonb('integration_settings').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tenant-specific currency configurations (many-to-many)
export const tenantCurrencies = pgTable('tenant_currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  currencyId: uuid('currency_id').references(() => currencies.id, { onDelete: 'cascade' }).notNull(),
  
  // Configuration
  isDefault: boolean('is_default').default(false),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 6 }).default('1.0'),
  
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tenant-specific courier configurations (many-to-many)
export const tenantCouriers = pgTable('tenant_couriers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  courierId: uuid('courier_id').references(() => couriers.id, { onDelete: 'cascade' }).notNull(),
  
  // Status and settings
  isActive: boolean('is_active').default(true),
  contractDetails: jsonb('contract_details'),
  apiCredentials: text('api_credentials'), // Encrypted
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const courierServices = pgTable('courier_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  courierId: uuid('courier_id').references(() => couriers.id, { onDelete: 'cascade' }).notNull(),
  
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Service characteristics
  isExpress: boolean('is_express').default(false),
  isInternational: boolean('is_international').default(false),
  estimatedDeliveryDays: integer('estimated_delivery_days'),
  
  // Status flags
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


// Incoming shipments (pre-receiving phase)
export const incomingShipments = pgTable('incoming_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Shipment identification
  batchReference: varchar('batch_reference', { length: 100 }).notNull(),
  
  // Courier info
  courierId: uuid('courier_id').references(() => couriers.id), // Added missing field
  courierName: varchar('courier_name', { length: 255 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  
  // Dates
  arrivalDate: date('arrival_date'), // Added missing field
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
  
  // Fixed: Add missing incomingShipmentId field
  incomingShipmentId: uuid('incoming_shipment_id').references(() => incomingShipments.id, { onDelete: 'cascade' }).notNull(),
  
  // Tracking and courier info
  trackingNumber: varchar('tracking_number', { length: 255 }),
  courierName: varchar('courier_name', { length: 255 }),
  courierTrackingUrl: varchar('courier_tracking_url', { length: 500 }),
  
  // Scanning info - Fixed: Add missing scannedBy field
  scannedBy: uuid('scanned_by').references(() => users.id),
  scannedAt: timestamp('scanned_at'),
  
  // Assignment info - Fixed: Add missing assignedBy field
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

// Type exports
export type TenantCurrency = InferSelectModel<typeof tenantCurrencies>;
export type NewTenantCurrency = InferInsertModel<typeof tenantCurrencies>;

export type TenantCourier = InferSelectModel<typeof tenantCouriers>;
export type NewTenantCourier = InferInsertModel<typeof tenantCouriers>;

// Type exports
export type Country = InferSelectModel<typeof countries>;
export type NewCountry = InferInsertModel<typeof countries>;

export type Currency = InferSelectModel<typeof currencies>;
export type NewCurrency = InferInsertModel<typeof currencies>;

export type Courier = InferSelectModel<typeof couriers>;
export type NewCourier = InferInsertModel<typeof couriers>;

export type CourierService = InferSelectModel<typeof courierServices>;
export type NewCourierService = InferInsertModel<typeof courierServices>;

export type IncomingShipment = InferSelectModel<typeof incomingShipments>;
export type NewIncomingShipment = InferInsertModel<typeof incomingShipments>;

export type IncomingShipmentItem = InferSelectModel<typeof incomingShipmentItems>;
export type NewIncomingShipmentItem = InferInsertModel<typeof incomingShipmentItems>;
