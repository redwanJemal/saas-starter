// lib/db/schema/storage.ts

import { pgTable, uuid, varchar, decimal, integer, boolean, timestamp, text, date } from 'drizzle-orm/pg-core';
import { tenants } from './tenancy';
import { warehouses } from './warehouses';
import { packages } from './packages';

// Storage pricing configuration
export const storagePricing = pgTable('storage_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Pricing details
  freeDays: integer('free_days').default(7).notNull(), // Number of free storage days
  dailyRateAfterFree: decimal('daily_rate_after_free', { precision: 8, scale: 2 }).default('2.00').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  
  // Effective period
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'), // null means indefinite
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  
  // Metadata
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bin locations for warehouse storage organization
export const binLocations = pgTable('bin_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Location details
  binCode: varchar('bin_code', { length: 20 }).notNull(), // e.g., "A1", "B3", "C12"
  zoneName: varchar('zone_name', { length: 50 }).notNull(), // e.g., "Zone A", "Premium", "Standard"
  description: text('description'),
  
  // Capacity and constraints
  maxCapacity: integer('max_capacity').default(10), // Maximum number of packages
  currentOccupancy: integer('current_occupancy').default(0),
  maxWeightKg: decimal('max_weight_kg', { precision: 8, scale: 3 }),
  
  // Pricing (premium locations may have daily surcharge)
  dailyPremium: decimal('daily_premium', { precision: 6, scale: 2 }).default('0.00'), // Additional daily cost
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Location properties
  isClimateControlled: boolean('is_climate_controlled').default(false),
  isSecured: boolean('is_secured').default(false),
  isAccessible: boolean('is_accessible').default(true), // For easy access
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Package assignments to bin locations
export const packageBinAssignments = pgTable('package_bin_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  binId: uuid('bin_id').references(() => binLocations.id, { onDelete: 'cascade' }).notNull(),
  
  // Assignment details
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by'), // Staff member who made the assignment
  removedAt: timestamp('removed_at'), // null means currently assigned
  removedBy: uuid('removed_by'),
  
  // Reason for assignment/removal
  assignmentReason: varchar('assignment_reason', { length: 100 }), // e.g., "initial_placement", "upgrade", "consolidation"
  removalReason: varchar('removal_reason', { length: 100 }), // e.g., "shipped", "moved", "damaged"
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Storage fee calculations and history
export const storageCharges = pgTable('storage_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Charge period
  chargeFromDate: date('charge_from_date').notNull(),
  chargeToDate: date('charge_to_date').notNull(),
  daysCharged: integer('days_charged').notNull(),
  
  // Fee breakdown
  baseStorageFee: decimal('base_storage_fee', { precision: 8, scale: 2 }).notNull(),
  binLocationFee: decimal('bin_location_fee', { precision: 8, scale: 2 }).default('0.00'),
  totalStorageFee: decimal('total_storage_fee', { precision: 8, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  
  // Reference to bin location during this period
  binLocationId: uuid('bin_location_id').references(() => binLocations.id),
  
  // Billing status
  isInvoiced: boolean('is_invoiced').default(false),
  invoiceId: uuid('invoice_id'), // Reference to financial invoice when created
  
  // Calculation details
  dailyRate: decimal('daily_rate', { precision: 6, scale: 2 }).notNull(),
  freeDaysApplied: integer('free_days_applied').default(0),
  
  // Metadata
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  calculatedBy: uuid('calculated_by'),
  notes: text('notes'),
});

export type StoragePricing = typeof storagePricing.$inferSelect;
export type NewStoragePricing = typeof storagePricing.$inferInsert;

export type BinLocation = typeof binLocations.$inferSelect;
export type NewBinLocation = typeof binLocations.$inferInsert;

export type PackageBinAssignment = typeof packageBinAssignments.$inferSelect;
export type NewPackageBinAssignment = typeof packageBinAssignments.$inferInsert;

export type StorageCharge = typeof storageCharges.$inferSelect;
export type NewStorageCharge = typeof storageCharges.$inferInsert;