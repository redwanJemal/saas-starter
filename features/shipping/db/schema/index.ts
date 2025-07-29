// features/shipping/db/schema/index.ts
// Shipping Zones, Rates, Shipments, and Carrier Integration schemas

import { AddressType, addressTypeEnum, EntityAddress, NewEntityAddress } from '@/features/settings/db/schema';
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, date, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';
import { warehouses } from '@/features/warehouses/db/schema';

// =============================================================================
// ENUMS
// =============================================================================

export const serviceTypeEnum = ['standard', 'express', 'economy'] as const;
export const shipmentStatusEnum = [
  'quote_requested',
  'quoted',
  'paid',
  'processing',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
  'refunded'
] as const;

export type ServiceType = typeof serviceTypeEnum[number];
export type ShipmentStatus = typeof shipmentStatusEnum[number];

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
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shippingRates = pgTable('shipping_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'cascade' }).notNull(),
  serviceType: varchar('service_type', { length: 20 }).notNull(),
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

// =============================================================================
// SHIPMENT MANAGEMENT
// =============================================================================

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').notNull(), // References customer_profiles.id
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Shipment identification
  shipmentNumber: varchar('shipment_number', { length: 50 }).unique().notNull(),
  
  // Destination - using polymorphic address associations
  // Note: Addresses are now referenced via entityAddresses table in settings feature
  shippingAddressId: uuid('shipping_address_id'), // Will be linked through entityAddresses
  billingAddressId: uuid('billing_address_id'), // Will be linked through entityAddresses
  companyId: uuid('company_id'), // References companies.id
  
  // Zone information for rate calculation
  zoneId: uuid('zone_id').references(() => zones.id),
  
  // Carrier information
  carrierCode: varchar('carrier_code', { length: 50 }),
  serviceType: varchar('service_type', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrierReference: varchar('carrier_reference', { length: 255 }),
  
  // Shipment details
  totalWeightKg: decimal('total_weight_kg', { precision: 8, scale: 3 }),
  totalDeclaredValue: decimal('total_declared_value', { precision: 12, scale: 2 }),
  declaredValueCurrency: varchar('declared_value_currency', { length: 3 }).default('USD'),
  
  // Shipping costs
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  insuranceCost: decimal('insurance_cost', { precision: 10, scale: 2 }).default('0.00'),
  handlingFee: decimal('handling_fee', { precision: 10, scale: 2 }).default('0.00'),
  storageFee: decimal('storage_fee', { precision: 10, scale: 2 }).default('0.00'),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  costCurrency: varchar('cost_currency', { length: 3 }),
  
  // Rate calculation details
  baseShippingRate: decimal('base_shipping_rate', { precision: 10, scale: 2 }),
  weightShippingRate: decimal('weight_shipping_rate', { precision: 10, scale: 2 }),
  rateCalculationDetails: jsonb('rate_calculation_details'),
  
  // Status tracking
  status: varchar('status', { length: 30 }).default('quote_requested'),
  
  // Important dates
  quoteExpiresAt: timestamp('quote_expires_at'),
  paidAt: timestamp('paid_at'),
  dispatchedAt: timestamp('dispatched_at'),
  estimatedDeliveryDate: date('estimated_delivery_date'),
  deliveredAt: timestamp('delivered_at'),
  
  // Customs and compliance
  customsDeclaration: jsonb('customs_declaration').default('{}'),
  commercialInvoiceUrl: varchar('commercial_invoice_url', { length: 500 }),
  customsStatus: varchar('customs_status', { length: 30 }).default('pending'),
  
  // Special handling
  requiresSignature: boolean('requires_signature').default(false),
  deliveryInstructions: text('delivery_instructions'),
  
  // Processing
  createdBy: uuid('created_by'), // References users.id
  processedBy: uuid('processed_by'), // References users.id
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shipmentPackages = pgTable('shipment_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  packageId: uuid('package_id').notNull(), // References packages.id
  declaredValue: decimal('declared_value', { precision: 12, scale: 2 }),
  declaredDescription: text('declared_description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shipmentTrackingEvents = pgTable('shipment_tracking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  eventCode: varchar('event_code', { length: 50 }).notNull(),
  eventDescription: text('event_description').notNull(),
  location: varchar('location', { length: 255 }),
  eventTimestamp: timestamp('event_timestamp').notNull(),
  source: varchar('source', { length: 50 }).default('manual'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shipmentStatusHistory = pgTable('shipment_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  previousStatus: varchar('previous_status', { length: 30 }),
  notes: text('notes'),
  changedBy: uuid('changed_by'), // References users.id
  changedAt: timestamp('changed_at').notNull().defaultNow(),
  
  // Additional context
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrierName: varchar('carrier_name', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Zone types
export type Zone = InferSelectModel<typeof zones>;
export type NewZone = InferInsertModel<typeof zones>;
export type ZoneCountry = InferSelectModel<typeof zoneCountries>;
export type NewZoneCountry = InferInsertModel<typeof zoneCountries>;

// Rate types
export type ShippingRate = InferSelectModel<typeof shippingRates>;
export type NewShippingRate = InferInsertModel<typeof shippingRates>;

// Shipment types
export type Shipment = InferSelectModel<typeof shipments>;
export type NewShipment = InferInsertModel<typeof shipments>;
export type ShipmentPackage = InferSelectModel<typeof shipmentPackages>;
export type NewShipmentPackage = InferInsertModel<typeof shipmentPackages>;
export type ShipmentTrackingEvent = InferSelectModel<typeof shipmentTrackingEvents>;
export type NewShipmentTrackingEvent = InferInsertModel<typeof shipmentTrackingEvents>;
export type ShipmentStatusHistory = InferSelectModel<typeof shipmentStatusHistory>;
export type NewShipmentStatusHistory = InferInsertModel<typeof shipmentStatusHistory>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface ZoneFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ShippingRateFilters {
  warehouseId?: string;
  zoneId?: string;
  serviceType?: ServiceType;
  isActive?: boolean;
  effectiveDate?: string;
  page?: number;
  limit?: number;
}

export interface ShipmentFilters {
  status?: ShipmentStatus | ShipmentStatus[];
  customerProfileId?: string;
  warehouseId?: string;
  zoneId?: string;
  carrierCode?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateZoneData {
  name: string;
  description?: string;
  isActive?: boolean;
  countryIds?: string[];
}

export interface UpdateZoneData {
  name?: string;
  description?: string;
  isActive?: boolean;
  countryIds?: string[];
}

export interface CreateShippingRateData {
  warehouseId: string;
  zoneId: string;
  serviceType: ServiceType;
  baseRate: string;
  perKgRate: string;
  minCharge: string;
  maxWeightKg?: string;
  currencyCode?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
}

export interface UpdateShippingRateData {
  serviceType?: ServiceType;
  baseRate?: string;
  perKgRate?: string;
  minCharge?: string;
  maxWeightKg?: string;
  currencyCode?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export interface CreateShipmentData {
  customerProfileId: string;
  warehouseId: string;
  shipmentNumber: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  companyId?: string;
  zoneId?: string;
  carrierCode?: string;
  serviceType?: string;
  totalWeightKg?: string;
  totalDeclaredValue?: string;
  declaredValueCurrency?: string;
  requiresSignature?: boolean;
  deliveryInstructions?: string;
  packageIds: string[];
}

export interface UpdateShipmentData {
  shippingAddressId?: string;
  billingAddressId?: string;
  companyId?: string;
  zoneId?: string;
  carrierCode?: string;
  serviceType?: string;
  trackingNumber?: string;
  carrierReference?: string;
  totalWeightKg?: string;
  totalDeclaredValue?: string;
  declaredValueCurrency?: string;
  shippingCost?: string;
  insuranceCost?: string;
  handlingFee?: string;
  storageFee?: string;
  totalCost?: string;
  costCurrency?: string;
  status?: ShipmentStatus;
  quoteExpiresAt?: string;
  estimatedDeliveryDate?: string;
  customsDeclaration?: Record<string, any>;
  commercialInvoiceUrl?: string;
  customsStatus?: string;
  requiresSignature?: boolean;
  deliveryInstructions?: string;
}

export interface CreateShipmentTrackingEventData {
  shipmentId: string;
  eventCode: string;
  eventDescription: string;
  location?: string;
  eventTimestamp: string;
  source?: string;
  rawData?: Record<string, any>;
}