// lib/db/schema/shipping.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, date, integer } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { serviceTypeEnum } from './enums';
import { tenants } from './tenancy';
import { warehouses } from './warehouses';

// =============================================================================
// SHIPPING ZONES & RATES
// =============================================================================

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const zoneCountries = pgTable('zone_countries', {
  id: uuid('id').primaryKey().defaultRandom(),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'cascade' }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO country codes
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'cascade' }).notNull(),
  serviceType: serviceTypeEnum('service_type').notNull(),
  baseRate: decimal('base_rate', { precision: 10, scale: 2 }).notNull(),
  perKgRate: decimal('per_kg_rate', { precision: 10, scale: 2 }).notNull(),
  minCharge: decimal('min_charge', { precision: 10, scale: 2 }).notNull(),
  maxWeightKg: decimal('max_weight_kg', { precision: 8, scale: 3 }),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().default('USD'),
  isActive: boolean('is_active').default(true),
  effectiveFrom: date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type Zone = InferSelectModel<typeof zones>;
export type NewZone = InferInsertModel<typeof zones>;
export type ZoneCountry = InferSelectModel<typeof zoneCountries>;
export type NewZoneCountry = InferInsertModel<typeof zoneCountries>;
export type ShippingRate = InferSelectModel<typeof shippingRates>;
export type NewShippingRate = InferInsertModel<typeof shippingRates>;