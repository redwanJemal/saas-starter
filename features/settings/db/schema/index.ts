// features/settings/db/schema/index.ts
// Settings, Countries, Currencies, Couriers, System Configuration, Addresses, and Documents

// Re-export all settings-related schemas
export * from './documents.schema';
export * from './addresses.schema';

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, decimal } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

// =============================================================================
// GLOBAL REFERENCE DATA
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

// =============================================================================
// TENANT-SPECIFIC CONFIGURATIONS
// =============================================================================

export const tenantCurrencies = pgTable('tenant_currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  currencyId: uuid('currency_id').references(() => currencies.id, { onDelete: 'cascade' }).notNull(),
  
  // Configuration
  isDefault: boolean('is_default').default(false),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 6 }).default('1.0'),
  
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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

// =============================================================================
// SYSTEM CONFIGURATION
// =============================================================================

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Setting identification
  key: varchar('key', { length: 255 }).unique().notNull(),
  value: text('value').notNull(),
  
  // Metadata
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  
  // Access control
  isPublic: boolean('is_public').default(false),
  isEncrypted: boolean('is_encrypted').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tenantSettings = pgTable('tenant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Setting identification
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  
  // Metadata
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  
  // Override control
  overridesSystemDefault: boolean('overrides_system_default').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Flag identification
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description'),
  
  // Flag status
  isEnabled: boolean('is_enabled').default(false),
  
  // Targeting rules
  tenantRules: jsonb('tenant_rules').default('[]'),
  userRules: jsonb('user_rules').default('[]'),
  
  // Rollout configuration
  rolloutPercentage: integer('rollout_percentage').default(100),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Reference data types
export type Country = InferSelectModel<typeof countries>;
export type NewCountry = InferInsertModel<typeof countries>;
export type Currency = InferSelectModel<typeof currencies>;
export type NewCurrency = InferInsertModel<typeof currencies>;
export type Courier = InferSelectModel<typeof couriers>;
export type NewCourier = InferInsertModel<typeof couriers>;
export type CourierService = InferSelectModel<typeof courierServices>;
export type NewCourierService = InferInsertModel<typeof courierServices>;

// Tenant configuration types
export type TenantCurrency = InferSelectModel<typeof tenantCurrencies>;
export type NewTenantCurrency = InferInsertModel<typeof tenantCurrencies>;
export type TenantCourier = InferSelectModel<typeof tenantCouriers>;
export type NewTenantCourier = InferInsertModel<typeof tenantCouriers>;

// System configuration types
export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;
export type TenantSetting = InferSelectModel<typeof tenantSettings>;
export type NewTenantSetting = InferInsertModel<typeof tenantSettings>;
export type FeatureFlag = InferSelectModel<typeof featureFlags>;
export type NewFeatureFlag = InferInsertModel<typeof featureFlags>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface CountryFilters {
  isActive?: boolean;
  isShippingEnabled?: boolean;
  region?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CurrencyFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourierFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SystemSettingFilters {
  category?: string;
  isPublic?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TenantSettingFilters {
  category?: string;
  overridesSystemDefault?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeatureFlagFilters {
  isEnabled?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateCountryData {
  code: string;
  name: string;
  region?: string;
  subregion?: string;
  isActive?: boolean;
  isShippingEnabled?: boolean;
  requiresPostalCode?: boolean;
  requiresStateProvince?: boolean;
  euMember?: boolean;
  customsFormType?: string;
  flagEmoji?: string;
  phonePrefix?: string;
}

export interface UpdateCountryData {
  name?: string;
  region?: string;
  subregion?: string;
  isActive?: boolean;
  isShippingEnabled?: boolean;
  requiresPostalCode?: boolean;
  requiresStateProvince?: boolean;
  euMember?: boolean;
  customsFormType?: string;
  flagEmoji?: string;
  phonePrefix?: string;
}

export interface CreateCurrencyData {
  code: string;
  name: string;
  symbol: string;
  isActive?: boolean;
  decimalPlaces?: number;
  symbolPosition?: string;
}

export interface UpdateCurrencyData {
  name?: string;
  symbol?: string;
  isActive?: boolean;
  decimalPlaces?: number;
  symbolPosition?: string;
}

export interface CreateCourierData {
  code: string;
  name: string;
  website?: string;
  trackingUrlTemplate?: string;
  isActive?: boolean;
  apiCredentials?: Record<string, any>;
  integrationSettings?: Record<string, any>;
}

export interface UpdateCourierData {
  name?: string;
  website?: string;
  trackingUrlTemplate?: string;
  isActive?: boolean;
  apiCredentials?: Record<string, any>;
  integrationSettings?: Record<string, any>;
}

export interface CreateSystemSettingData {
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic?: boolean;
  isEncrypted?: boolean;
}

export interface UpdateSystemSettingData {
  value?: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  isEncrypted?: boolean;
}

export interface CreateTenantSettingData {
  key: string;
  value: string;
  description?: string;
  category: string;
  overridesSystemDefault?: boolean;
}

export interface UpdateTenantSettingData {
  value?: string;
  description?: string;
  category?: string;
  overridesSystemDefault?: boolean;
}

export interface CreateFeatureFlagData {
  name: string;
  description?: string;
  isEnabled?: boolean;
  tenantRules?: Record<string, any>[];
  userRules?: Record<string, any>[];
  rolloutPercentage?: number;
}

export interface UpdateFeatureFlagData {
  description?: string;
  isEnabled?: boolean;
  tenantRules?: Record<string, any>[];
  userRules?: Record<string, any>[];
  rolloutPercentage?: number;
}

export interface CreateTenantCurrencyData {
  currencyId: string;
  isDefault?: boolean;
  exchangeRate?: string;
}

export interface UpdateTenantCurrencyData {
  isDefault?: boolean;
  exchangeRate?: string;
}

export interface CreateTenantCourierData {
  courierId: string;
  isActive?: boolean;
  contractDetails?: Record<string, any>;
  apiCredentials?: string;
}

export interface UpdateTenantCourierData {
  isActive?: boolean;
  contractDetails?: Record<string, any>;
  apiCredentials?: string;
}