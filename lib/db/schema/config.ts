import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from './tenancy';

// =============================================================================
// SYSTEM CONFIGURATION
// =============================================================================

export const systemConfigs = pgTable('system_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  configKey: varchar('config_key', { length: 255 }).notNull(),
  configValue: text('config_value'),
  configType: varchar('config_type', { length: 50 }).default('string'),
  
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  isEncrypted: boolean('is_encrypted').default(false),
  
  validationRules: jsonb('validation_rules'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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

// Type exports
export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;

export type TenantSetting = InferSelectModel<typeof tenantSettings>;
export type NewTenantSetting = InferInsertModel<typeof tenantSettings>;

export type FeatureFlag = InferSelectModel<typeof featureFlags>;
export type NewFeatureFlag = InferInsertModel<typeof featureFlags>;

export type SystemConfig = InferSelectModel<typeof systemConfigs>;
export type NewSystemConfig = InferInsertModel<typeof systemConfigs>;
