// features/warehouse/db/schema/index.ts
// Warehouse, Storage Management, and Bin Location schemas

import { pgTable, uuid, varchar, text, timestamp, decimal, integer, jsonb, boolean, date } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

// =============================================================================
// ENUMS
// =============================================================================

export const warehouseStatusEnum = ['active', 'inactive', 'maintenance'] as const;
export const assignmentStatusEnum = ['active', 'suspended', 'expired'] as const;
export const taxTreatmentEnum = ['standard', 'tax_free', 'bonded'] as const;

export type WarehouseStatus = typeof warehouseStatusEnum[number];
export type AssignmentStatus = typeof assignmentStatusEnum[number];
export type TaxTreatment = typeof taxTreatmentEnum[number];

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
  taxTreatment: varchar('tax_treatment', { length: 20 }).default('standard'),
  storageFreeDays: integer('storage_free_days').default(30),
  storageFeePerDay: decimal('storage_fee_per_day', { precision: 8, scale: 2 }).default('1.00'),
  
  // Capacity and limits
  maxPackageWeightKg: decimal('max_package_weight_kg', { precision: 8, scale: 2 }).default('30.00'),
  maxPackageValue: decimal('max_package_value', { precision: 12, scale: 2 }).default('10000.00'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  acceptsNewPackages: boolean('accepts_new_packages').default(true),
  
  // Operating hours
  operatingHours: jsonb('operating_hours').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customerWarehouseAssignments = pgTable('customer_warehouse_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').notNull(), // References customer profile
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  suiteCode: varchar('suite_code', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  assignedBy: uuid('assigned_by'), // References users.id
});

// =============================================================================
// STORAGE MANAGEMENT
// =============================================================================

export const storagePricing = pgTable('storage_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }),
  
  // Pricing details
  freeDays: integer('free_days').default(7).notNull(),
  dailyRateAfterFree: decimal('daily_rate_after_free', { precision: 8, scale: 2 }).default('2.00').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  
  // Effective period
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  
  // Metadata
  notes: text('notes'),
  createdBy: uuid('created_by'), // References users.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const binLocations = pgTable('bin_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Location details
  binCode: varchar('bin_code', { length: 20 }).notNull(),
  zoneName: varchar('zone_name', { length: 50 }).notNull(),
  description: text('description'),
  
  // Capacity and constraints
  maxCapacity: integer('max_capacity').default(10),
  currentOccupancy: integer('current_occupancy').default(0),
  maxWeightKg: decimal('max_weight_kg', { precision: 8, scale: 3 }),
  
  // Pricing (premium locations may have daily surcharge)
  dailyPremium: decimal('daily_premium', { precision: 6, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Location properties
  isClimateControlled: boolean('is_climate_controlled').default(false),
  isSecured: boolean('is_secured').default(false),
  isAccessible: boolean('is_accessible').default(true),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const packageBinAssignments = pgTable('package_bin_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull(), // References packages.id
  binId: uuid('bin_id').references(() => binLocations.id, { onDelete: 'cascade' }).notNull(),
  
  // Assignment details
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by'), // References users.id
  removedAt: timestamp('removed_at'),
  removedBy: uuid('removed_by'), // References users.id
  
  // Reason for assignment/removal
  assignmentReason: varchar('assignment_reason', { length: 100 }),
  removalReason: varchar('removal_reason', { length: 100 }),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storageCharges = pgTable('storage_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull(), // References packages.id
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
  invoiceId: uuid('invoice_id'), // References financial_invoices.id
  
  // Calculation details
  dailyRate: decimal('daily_rate', { precision: 6, scale: 2 }).notNull(),
  freeDaysApplied: integer('free_days_applied').default(0),
  
  // Metadata
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  calculatedBy: uuid('calculated_by'), // References users.id
  notes: text('notes'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Warehouse types
export type Warehouse = InferSelectModel<typeof warehouses>;
export type NewWarehouse = InferInsertModel<typeof warehouses>;
export type CustomerWarehouseAssignment = InferSelectModel<typeof customerWarehouseAssignments>;
export type NewCustomerWarehouseAssignment = InferInsertModel<typeof customerWarehouseAssignments>;

// Storage types
export type StoragePricing = InferSelectModel<typeof storagePricing>;
export type NewStoragePricing = InferInsertModel<typeof storagePricing>;
export type BinLocation = InferSelectModel<typeof binLocations>;
export type NewBinLocation = InferInsertModel<typeof binLocations>;
export type PackageBinAssignment = InferSelectModel<typeof packageBinAssignments>;
export type NewPackageBinAssignment = InferInsertModel<typeof packageBinAssignments>;
export type StorageCharge = InferSelectModel<typeof storageCharges>;
export type NewStorageCharge = InferInsertModel<typeof storageCharges>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface WarehouseFilters {
  status?: WarehouseStatus;
  countryCode?: string;
  acceptsNewPackages?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StoragePricingFilters {
  warehouseId?: string;
  isActive?: boolean;
  effectiveDate?: string;
  page?: number;
  limit?: number;
}

export interface BinLocationFilters {
  warehouseId?: string;
  zoneName?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StorageChargeFilters {
  packageId?: string;
  chargeFromDate?: string;
  chargeToDate?: string;
  isInvoiced?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateWarehouseData {
  code: string;
  name: string;
  description?: string;
  countryCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currencyCode: string;
  taxTreatment?: TaxTreatment;
  storageFreeDays?: number;
  storageFeePerDay?: string;
  maxPackageWeightKg?: string;
  maxPackageValue?: string;
  operatingHours?: Record<string, any>;
}

export interface UpdateWarehouseData {
  name?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  status?: WarehouseStatus;
  acceptsNewPackages?: boolean;
  taxTreatment?: TaxTreatment;
  storageFreeDays?: number;
  storageFeePerDay?: string;
  maxPackageWeightKg?: string;
  maxPackageValue?: string;
  operatingHours?: Record<string, any>;
}

export interface CreateStoragePricingData {
  warehouseId?: string;
  freeDays: number;
  dailyRateAfterFree: string;
  currency?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  notes?: string;
}

export interface UpdateStoragePricingData {
  freeDays?: number;
  dailyRateAfterFree?: string;
  currency?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
  notes?: string;
}

export interface CreateBinLocationData {
  warehouseId: string;
  binCode: string;
  zoneName: string;
  description?: string;
  maxCapacity?: number;
  maxWeightKg?: string;
  dailyPremium?: string;
  currency?: string;
  isClimateControlled?: boolean;
  isSecured?: boolean;
  isAccessible?: boolean;
}

export interface UpdateBinLocationData {
  binCode?: string;
  zoneName?: string;
  description?: string;
  maxCapacity?: number;
  maxWeightKg?: string;
  dailyPremium?: string;
  currency?: string;
  isClimateControlled?: boolean;
  isSecured?: boolean;
  isAccessible?: boolean;
  isActive?: boolean;
}

export interface CreatePackageBinAssignmentData {
  packageId: string;
  binId: string;
  assignmentReason?: string;
  notes?: string;
}

export interface CreateStorageChargeData {
  packageId: string;
  chargeFromDate: string;
  chargeToDate: string;
  daysCharged: number;
  baseStorageFee: string;
  binLocationFee?: string;
  totalStorageFee: string;
  currency?: string;
  binLocationId?: string;
  dailyRate: string;
  freeDaysApplied?: number;
  notes?: string;
}


export interface CustomerWarehouseAssignmentFilters {
  page?: number;
  limit?: number;
  warehouseId?: string;
  customerId?: string;
  status?: AssignmentStatus;
  search?: string;
}

// ============================================================================= 
// CREATE/UPDATE INTERFACES (Additional)
// =============================================================================

export interface CreateCustomerWarehouseAssignmentData {
  customerProfileId: string;
  warehouseId: string;
  suiteCode: string;
  status?: AssignmentStatus;
  assignedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface UpdateCustomerWarehouseAssignmentData {
  status?: AssignmentStatus;
  assignedAt?: string;
  expiresAt?: string;
  notes?: string;
}

// ============================================================================= 
// API RESPONSE INTERFACES
// =============================================================================

export interface WarehouseResponse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  countryCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  phone?: string;
  email?: string;
  timezone: string;
  currencyCode: string;
  taxTreatment: TaxTreatment;
  storageFreeDays: number;
  storageFeePerDay: string;
  maxPackageWeightKg: string;
  maxPackageValue: string;
  status: WarehouseStatus;
  acceptsNewPackages: boolean;
  operatingHours: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Optional stats for list view
  stats?: {
    totalPackages: number;
    pendingPackages: number;
    readyPackages: number;
    totalShipments: number;
    activeShipments: number;
  };
}

export interface CustomerWarehouseAssignmentResponse {
  id: string;
  customerProfileId: string;
  warehouseId: string;
  status: AssignmentStatus;
  assignedAt: Date;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseCity: string;
  warehouseCountryCode: string;
}

export interface StoragePricingResponse {
  id: string;
  tenantId: string;
  warehouseId: string;
  freeDays: number;
  dailyRateAfterFree: string;
  currency: string;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  warehouseCode: string;
  warehouseName: string;
  warehouseCity: string;
  warehouseCountryCode: string;
}

export interface BinLocationResponse {
  id: string;
  tenantId: string;
  warehouseId: string;
  binCode: string;
  zoneName: string;
  description?: string;
  maxCapacity?: number;
  currentPackageCount: number;
  maxWeightKg?: string;
  dailyPremium: string;
  currency: string;
  isClimateControlled: boolean;
  isSecured: boolean;
  isAccessible: boolean;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Related data
  warehouseCode: string;
  warehouseName: string;
  warehouseCity: string;
  // Calculated fields
  capacityUsagePercent: number;
  isAtCapacity: boolean;
  availableCapacity?: number;
}

export interface PackageBinAssignmentResponse {
  id: string;
  packageId: string;
  binId: string;
  assignedAt: Date;
  removedAt?: Date;
  assignmentReason: string;
  removalReason?: string;
  notes?: string;
  assignedBy: string;
  removedBy?: string;
  // Package info
  packageInternalId: string;
  packageTrackingNumber: string;
  packageDescription?: string;
  packageStatus: string;
  // Customer info
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  // Bin info
  binCode: string;
  zoneName: string;
  warehouseId: string;
}

export interface StorageChargeResponse {
  id: string;
  packageId: string;
  tenantId: string;
  chargeFromDate: Date;
  chargeToDate: Date;
  daysCharged: number;
  baseStorageFee: string;
  binLocationFee?: string;
  totalStorageFee: string;
  currency: string;
  binLocationId?: string;
  isInvoiced: boolean;
  invoiceId?: string;
  dailyRate: string;
  freeDaysApplied: number;
  calculatedAt: Date;
  calculatedBy: string;
  notes?: string;
  // Package info
  packageInternalId: string;
  packageTrackingNumber: string;
  packageDescription?: string;
  packageStatus: string;
  // Customer info
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  // Bin info (optional)
  binCode?: string;
  zoneName?: string;
}