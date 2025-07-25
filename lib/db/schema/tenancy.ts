import { pgTable, uuid, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenantStatusEnum } from './enums';

// =============================================================================
// TENANCY SYSTEM
// =============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  domain: varchar('domain', { length: 255 }),
  
  // Business details
  companyName: varchar('company_name', { length: 255 }),
  companyRegistration: varchar('company_registration', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  
  // Tenant settings
  settings: jsonb('settings').default('{}'),
  branding: jsonb('branding').default('{}'),
  
  // Subscription/billing
  planType: varchar('plan_type', { length: 50 }).default('standard'),
  billingEmail: varchar('billing_email', { length: 255 }),
  
  // Status and limits
  status: tenantStatusEnum('status').default('active'),
  maxUsers: integer('max_users').default(1000),
  maxPackagesMonthly: integer('max_packages_monthly').default(10000),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Type exports
export type Tenant = InferSelectModel<typeof tenants>;
export type NewTenant = InferInsertModel<typeof tenants>;
