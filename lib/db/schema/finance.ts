import { pgTable, uuid, varchar, text, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { invoiceTypeEnum, paymentStatusEnum } from './enums';
import { tenants } from './tenancy';
import { customerProfiles } from './customers';
import { shipments } from './shipments';

// =============================================================================
// FINANCIAL MANAGEMENT
// =============================================================================

export const financialInvoices = pgTable('financial_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
  
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  
  // References
  shipmentId: uuid('shipment_id').references(() => shipments.id),
  
  // Financial details
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  
  // Payment status
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  
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

export const financialInvoiceLines = pgTable('financial_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => financialInvoices.id, { onDelete: 'cascade' }).notNull(),
  
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

// Type exports
export type FinancialInvoice = InferSelectModel<typeof financialInvoices>;
export type NewFinancialInvoice = InferInsertModel<typeof financialInvoices>;

export type FinancialInvoiceLine = InferSelectModel<typeof financialInvoiceLines>;
export type NewFinancialInvoiceLine = InferInsertModel<typeof financialInvoiceLines>;
