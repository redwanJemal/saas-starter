// features/finance/db/schema/index.ts
// Finance & Services schemas (Invoicing, Billing, Payments, Personal Shopping)

import { pgTable, uuid, varchar, text, timestamp, decimal, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

// =============================================================================
// ENUMS
// =============================================================================

export const invoiceTypeEnum = [
  'shipping',
  'storage', 
  'handling',
  'personal_shopper',
  'customs_duty',
  'insurance',
  'other'
] as const;

export const paymentStatusEnum = [
  'pending',
  'paid',
  'partially_paid', 
  'overdue',
  'cancelled',
  'refunded'
] as const;

export const personalShopperRequestStatusEnum = [
  'draft',
  'submitted',
  'quoted',
  'approved', 
  'purchasing',
  'purchased',
  'received',
  'cancelled',
  'completed'
] as const;

export const shippingPreferenceEnum = [
  'send_together',
  'send_as_available',
  'send_by_category',
  'fastest_delivery'
] as const;

export type InvoiceType = typeof invoiceTypeEnum[number];
export type PaymentStatus = typeof paymentStatusEnum[number];
export type PersonalShopperRequestStatus = typeof personalShopperRequestStatusEnum[number];
export type ShippingPreference = typeof shippingPreferenceEnum[number];

// =============================================================================
// FINANCIAL MANAGEMENT
// =============================================================================

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').notNull(), // References customer_profiles.id
  invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
  invoiceType: varchar('invoice_type', { length: 30 }).notNull(),
  
  // References
  shipmentId: uuid('shipment_id'), // References shipments.id
  personalShopperRequestId: uuid('personal_shopper_request_id'), // References personal_shopper_requests.id
  
  // Financial details
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  
  // Payment status
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  
  // Payment tracking
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  paidAt: timestamp('paid_at'),
  
  // Important dates
  issuedAt: timestamp('issued_at').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  
  // Additional info
  notes: text('notes'),
  paymentTerms: text('payment_terms'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).default('1.000'),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
  
  // Tax information
  taxRate: decimal('tax_rate', { precision: 5, scale: 4 }).default('0.0000'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  
  // Reference to source object
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// PERSONAL SHOPPING SERVICE
// =============================================================================

export const personalShopperRequests = pgTable('personal_shopper_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  customerProfileId: uuid('customer_profile_id').notNull(), // References customer_profiles.id
  
  // Request metadata
  requestNumber: varchar('request_number', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  
  // Shipping preferences
  shippingOption: varchar('shipping_option', { length: 100 }),
  shippingPreference: varchar('shipping_preference', { length: 20 }).default('send_together'),
  
  // Retailer preferences
  allowAlternateRetailers: boolean('allow_alternate_retailers').default(true),
  
  // Financial info
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }).default('0.00'),
  actualCost: decimal('actual_cost', { precision: 12, scale: 2 }).default('0.00'),
  serviceFee: decimal('service_fee', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0.00'),
  currencyCode: varchar('currency_code', { length: 3 }).default('USD'),
  
  // Processing info
  quotedAt: timestamp('quoted_at'),
  quotedBy: uuid('quoted_by'), // References users.id
  approvedAt: timestamp('approved_at'),
  purchasedAt: timestamp('purchased_at'),
  purchasedBy: uuid('purchased_by'), // References users.id
  
  // Notes and instructions
  specialInstructions: text('special_instructions'),
  internalNotes: text('internal_notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
  variant: varchar('variant', { length: 100 }),
  
  // Quantity and pricing
  quantity: decimal('quantity', { precision: 10, scale: 0 }).notNull().default('1'),
  maxBudgetPerItem: decimal('max_budget_per_item', { precision: 12, scale: 2 }),
  actualPrice: decimal('actual_price', { precision: 12, scale: 2 }),
  totalItemCost: decimal('total_item_cost', { precision: 12, scale: 2 }),
  
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
  status: varchar('status', { length: 50 }).default('pending'),
  
  // Sort order for display
  sortOrder: decimal('sort_order', { precision: 3, scale: 0 }).default('0'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const personalShopperRequestStatusHistory = pgTable('personal_shopper_request_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalShopperRequestId: uuid('personal_shopper_request_id').notNull()
    .references(() => personalShopperRequests.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull(),
  notes: text('notes'),
  changedBy: uuid('changed_by'), // References users.id
  changeReason: varchar('change_reason', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Financial types
export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;
export type InvoiceLine = InferSelectModel<typeof invoiceLines>;
export type NewInvoiceLine = InferInsertModel<typeof invoiceLines>;

// Personal shopping types
export type PersonalShopperRequest = InferSelectModel<typeof personalShopperRequests>;
export type NewPersonalShopperRequest = InferInsertModel<typeof personalShopperRequests>;
export type PersonalShopperRequestItem = InferSelectModel<typeof personalShopperRequestItems>;
export type NewPersonalShopperRequestItem = InferInsertModel<typeof personalShopperRequestItems>;
export type PersonalShopperRequestStatusHistory = InferSelectModel<typeof personalShopperRequestStatusHistory>;
export type NewPersonalShopperRequestStatusHistory = InferInsertModel<typeof personalShopperRequestStatusHistory>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface FinancialInvoiceFilters {
  invoiceType?: InvoiceType | InvoiceType[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  customerProfileId?: string;
  shipmentId?: string;
  personalShopperRequestId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PersonalShopperRequestFilters {
  status?: PersonalShopperRequestStatus | PersonalShopperRequestStatus[];
  customerProfileId?: string;
  quotedBy?: string;
  purchasedBy?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PersonalShopperRequestItemFilters {
  personalShopperRequestId?: string;
  status?: string;
  retailerName?: string;
  packageId?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateFinancialInvoiceData {
  customerProfileId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  shipmentId?: string;
  personalShopperRequestId?: string;
  subtotal: string;
  taxAmount?: string;
  discountAmount?: string;
  totalAmount: string;
  currencyCode: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  lines: CreateFinancialInvoiceLineData[];
}

export interface UpdateFinancialInvoiceData {
  paymentStatus?: PaymentStatus;
  paidAmount?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
}

export interface CreateFinancialInvoiceLineData {
  description: string;
  quantity?: string;
  unitPrice: string;
  lineTotal: string;
  taxRate?: string;
  taxAmount?: string;
  referenceType?: string;
  referenceId?: string;
  sortOrder?: number;
}

export interface CreatePersonalShopperRequestData {
  requestNumber: string;
  shippingOption?: string;
  shippingPreference?: ShippingPreference;
  allowAlternateRetailers?: boolean;
  specialInstructions?: string;
  items: CreatePersonalShopperRequestItemData[];
}

export interface UpdatePersonalShopperRequestData {
  status?: PersonalShopperRequestStatus;
  shippingOption?: string;
  shippingPreference?: ShippingPreference;
  allowAlternateRetailers?: boolean;
  estimatedCost?: string;
  actualCost?: string;
  serviceFee?: string;
  totalAmount?: string;
  quotedAt?: string;
  quotedBy?: string;
  approvedAt?: string;
  purchasedAt?: string;
  purchasedBy?: string;
  specialInstructions?: string;
  internalNotes?: string;
}

export interface CreatePersonalShopperRequestItemData {
  name: string;
  url?: string;
  description?: string;
  size?: string;
  color?: string;
  variant?: string;
  quantity?: string;
  maxBudgetPerItem?: string;
  additionalInstructions?: string;
  sortOrder?: string;
}

export interface UpdatePersonalShopperRequestItemData {
  name?: string;
  url?: string;
  description?: string;
  size?: string;
  color?: string;
  variant?: string;
  quantity?: string;
  maxBudgetPerItem?: string;
  actualPrice?: string;
  totalItemCost?: string;
  additionalInstructions?: string;
  retailerName?: string;
  retailerOrderNumber?: string;
  purchasedAt?: string;
  retailerTrackingNumber?: string;
  packageId?: string;
  status?: string;
  sortOrder?: string;
}