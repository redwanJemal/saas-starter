import { pgTable, uuid, varchar, text, timestamp, decimal, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { warehouseStatusEnum, taxTreatmentEnum, assignmentStatusEnum } from './enums';
import { tenants } from './tenancy';
import { users } from './users';
import { customerProfiles } from './customers';

// =============================================================================
// WAREHOUSE MANAGEMENT
// =============================================================================

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Basic info
  code: varchar('code', { length: 20 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Location
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  
  // Operational details
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  
  // Business settings
  taxTreatment: taxTreatmentEnum('tax_treatment').default('standard'),
  storageFreeDays: integer('storage_free_days').default(30),
  storageFeePerDay: decimal('storage_fee_per_day', { precision: 8, scale: 2 }).default('1.00'),
  
  // Capacity and limits
  maxPackageWeightKg: decimal('max_package_weight_kg', { precision: 8, scale: 2 }).default('30.00'),
  maxPackageValue: decimal('max_package_value', { precision: 12, scale: 2 }).default('10000.00'),
  
  // Status
  status: warehouseStatusEnum('status').default('active'),
  acceptsNewPackages: boolean('accepts_new_packages').default(true),
  
  // Operating hours
  operatingHours: jsonb('operating_hours').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customerWarehouseAssignments = pgTable('customer_warehouse_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  suiteCode: varchar('suite_code', { length: 50 }).notNull(),
  status: assignmentStatusEnum('status').default('active'),
  
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: uuid('assigned_by').references(() => users.id),
});

// Type exports
export type Warehouse = InferSelectModel<typeof warehouses>;
export type NewWarehouse = InferInsertModel<typeof warehouses>;

export type CustomerWarehouseAssignment = InferSelectModel<typeof customerWarehouseAssignments>;
export type NewCustomerWarehouseAssignment = InferInsertModel<typeof customerWarehouseAssignments>;
