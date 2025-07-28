// lib/db/schema/personal-shopping.ts

import { pgTable, uuid, text, varchar, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenancy';
import { customerProfiles } from './customers';
import { users } from './users';

// Personal Shopping Request Status Enum
export const personalShoppperRequestStatus = pgEnum('personal_shopper_request_status', [
  'draft',           // User is still adding items
  'submitted',       // Request submitted, awaiting review
  'quoted',          // Admin has provided quote
  'approved',        // Customer approved the quote
  'purchasing',      // Admin is buying the items
  'purchased',       // Items have been purchased
  'received',        // Items received at warehouse
  'cancelled',       // Request cancelled
  'completed'        // Process completed
]);

// Personal Shopping Request Action Enum
export const personalShopperAction = pgEnum('personal_shopper_action', [
  'submit_request',
  'save_for_later'
]);

// Shipping Preference Enum  
export const shippingPreference = pgEnum('shipping_preference', [
  'send_together',           // Send everything together
  'send_as_available',       // Send items as soon as they are available
  'send_by_category',        // Send similar items together
  'fastest_delivery'         // Prioritize speed over cost
]);

// Personal Shopper Requests Table
export const personalShopperRequests = pgTable('personal_shopper_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerProfileId: uuid('customer_profile_id').notNull().references(() => customerProfiles.id, { onDelete: 'cascade' }),
  
  // Request metadata
  requestNumber: varchar('request_number', { length: 50 }).notNull().unique(), // PS-001234
  status: personalShoppperRequestStatus('status').notNull().default('draft'),
  
  // Shipping preferences
  shippingOption: varchar('shipping_option', { length: 100 }), // e.g. 'First Class', 'FREE Super Saver'
  shippingPreference: shippingPreference('shipping_preference').default('send_together'),
  
  // Retailer preferences
  allowAlternateRetailers: boolean('allow_alternate_retailers').default(true),
  
  // Financial info
  estimatedCost: numeric('estimated_cost', { precision: 12, scale: 2 }).default('0.00'),
  actualCost: numeric('actual_cost', { precision: 12, scale: 2 }).default('0.00'),
  serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00'),
  currencyCode: varchar('currency_code', { length: 3 }).default('USD'),
  
  // Processing info
  quotedAt: timestamp('quoted_at'),
  quotedBy: uuid('quoted_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  purchasedAt: timestamp('purchased_at'),
  purchasedBy: uuid('purchased_by').references(() => users.id),
  
  // Notes and instructions
  specialInstructions: text('special_instructions'),
  internalNotes: text('internal_notes'), // Admin only notes
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Personal Shopper Request Items Table
export const personalShopperRequestItems = pgTable('personal_shopper_request_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalShopperRequestId: uuid('personal_shopper_request_id').notNull()
    .references(() => personalShopperRequests.id, { onDelete: 'cascade' }),
  
  // Item details
  name: text('name').notNull(),
  url: text('url'),
  description: text('description'),
  
  // Variants
  size: varchar('size', { length: 50 }),
  color: varchar('color', { length: 50 }),
  variant: varchar('variant', { length: 100 }), // Any other variant info
  
  // Quantity and pricing
  quantity: numeric('quantity', { precision: 10, scale: 0 }).notNull().default('1'),
  maxBudgetPerItem: numeric('max_budget_per_item', { precision: 12, scale: 2 }),
  actualPrice: numeric('actual_price', { precision: 12, scale: 2 }),
  totalItemCost: numeric('total_item_cost', { precision: 12, scale: 2 }),
  
  // Instructions
  additionalInstructions: text('additional_instructions'),
  
  // Purchase details
  retailerName: varchar('retailer_name', { length: 255 }),
  retailerOrderNumber: varchar('retailer_order_number', { length: 100 }),
  purchasedAt: timestamp('purchased_at'),
  
  // Tracking
  retailerTrackingNumber: varchar('retailer_tracking_number', { length: 100 }),
  packageId: uuid('package_id'), // Links to packages table when received
  
  // Status
  status: varchar('status', { length: 50 }).default('pending'), // pending, purchased, received, cancelled
  
  // Sort order for display
  sortOrder: numeric('sort_order', { precision: 3, scale: 0 }).default('0'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Personal Shopper Request Status History
export const personalShopperRequestStatusHistory = pgTable('personal_shopper_request_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalShopperRequestId: uuid('personal_shopper_request_id').notNull()
    .references(() => personalShopperRequests.id, { onDelete: 'cascade' }),
  
  status: personalShoppperRequestStatus('status').notNull(),
  notes: text('notes'),
  changedBy: uuid('changed_by').references(() => users.id),
  changeReason: varchar('change_reason', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const personalShopperRequestsRelations = relations(personalShopperRequests, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [personalShopperRequests.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [personalShopperRequests.customerProfileId],
    references: [customerProfiles.id],
  }),
  quotedBy: one(users, {
    fields: [personalShopperRequests.quotedBy],
    references: [users.id],
  }),
  purchasedBy: one(users, {
    fields: [personalShopperRequests.purchasedBy],
    references: [users.id],
  }),
  items: many(personalShopperRequestItems),
  statusHistory: many(personalShopperRequestStatusHistory),
}));

export const personalShopperRequestItemsRelations = relations(personalShopperRequestItems, ({ one }) => ({
  personalShopperRequest: one(personalShopperRequests, {
    fields: [personalShopperRequestItems.personalShopperRequestId],
    references: [personalShopperRequests.id],
  }),
}));

export const personalShopperRequestStatusHistoryRelations = relations(personalShopperRequestStatusHistory, ({ one }) => ({
  personalShopperRequest: one(personalShopperRequests, {
    fields: [personalShopperRequestStatusHistory.personalShopperRequestId],
    references: [personalShopperRequests.id],
  }),
  changedBy: one(users, {
    fields: [personalShopperRequestStatusHistory.changedBy],
    references: [users.id],
  }),
}));