// lib/db/schema/shipments.ts
import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, date, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { shipmentStatusEnum } from './enums';
import { tenants } from './tenancy';
import { customerProfiles } from './customers';
import { warehouses } from './warehouses';
import { addresses } from './addresses';
import { companies } from './customers';
import { users } from './users';
import { packages } from './packages';
import { zones } from './shipping';

// =============================================================================
// SHIPMENT MANAGEMENT
// =============================================================================

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Shipment identification
  shipmentNumber: varchar('shipment_number', { length: 50 }).unique().notNull(),
  
  // Destination
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id),
  companyId: uuid('company_id').references(() => companies.id),
  
  // NEW: Zone information for rate calculation
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
  
  // NEW: Rate calculation details
  baseShippingRate: decimal('base_shipping_rate', { precision: 10, scale: 2 }),
  weightShippingRate: decimal('weight_shipping_rate', { precision: 10, scale: 2 }),
  rateCalculationDetails: jsonb('rate_calculation_details'),
  
  // Status tracking
  status: shipmentStatusEnum('status').default('quote_requested'),
  
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
  createdBy: uuid('created_by').references(() => users.id),
  processedBy: uuid('processed_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shipmentPackages = pgTable('shipment_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
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

// Type exports
export type Shipment = InferSelectModel<typeof shipments>;
export type NewShipment = InferInsertModel<typeof shipments>;
export type ShipmentPackage = InferSelectModel<typeof shipmentPackages>;
export type NewShipmentPackage = InferInsertModel<typeof shipmentPackages>;
export type ShipmentTrackingEvent = InferSelectModel<typeof shipmentTrackingEvents>;
export type NewShipmentTrackingEvent = InferInsertModel<typeof shipmentTrackingEvents>;