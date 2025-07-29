// features/settings/db/schema/documents.schema.ts
import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

// ============================================================================= 
// GLOBAL DOCUMENT STORAGE
// =============================================================================
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // File information
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  
  // Storage information
  bucket: varchar('bucket', { length: 100 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  isPublic: boolean('is_public').default(false),
  
  // Metadata
  description: text('description'),
  tags: text('tags'), // JSON array of tags
  
  // Upload information
  uploadedBy: uuid('uploaded_by'), // References users.id
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  
  // Processing status
  processingStatus: varchar('processing_status', { length: 50 }).default('pending'),
  processedAt: timestamp('processed_at'),
  
  // Security
  checksum: varchar('checksum', { length: 64 }),
  isEncrypted: boolean('is_encrypted').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Document types enum
export const documentTypeEnum = [
  'package_photo',
  'invoice',
  'receipt', 
  'customs_form',
  'delivery_confirmation',
  'damage_report',
  'kyc_document',
  'company_registration',
  'tax_certificate',
  'id_document',
  'passport',
  'utility_bill',
  'bank_statement',
  'business_license',
  'incorporation_doc',
  'commercial_invoice',
  'packing_list',
  'product_photo',
  'other'
] as const;

export type DocumentType = typeof documentTypeEnum[number];

// ============================================================================= 
// ENTITY DOCUMENT ASSOCIATIONS (Polymorphic)
// =============================================================================
export const entityDocuments = pgTable('entity_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  // Polymorphic reference
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'package', 'customer_profile', 'company', 'shipment', etc.
  entityId: uuid('entity_id').notNull(),
  
  // Document metadata for this entity
  documentType: varchar('document_type', { length: 50 }).notNull(), // Uses values from documentTypeEnum
  isRequired: boolean('is_required').default(false),
  isPrimary: boolean('is_primary').default(false),
  displayOrder: integer('display_order').default(0),
  
  // Context when attached
  attachedBy: uuid('attached_by'), // References users.id
  attachedAt: timestamp('attached_at').notNull().defaultNow(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;
export type EntityDocument = InferSelectModel<typeof entityDocuments>;
export type NewEntityDocument = InferInsertModel<typeof entityDocuments>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface DocumentFilters {
  entityType?: string;
  entityId?: string;
  documentType?: DocumentType | DocumentType[];
  uploadedBy?: string;
  processingStatus?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateDocumentData {
  originalFileName: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl: string;
  bucket: string;
  filePath: string;
  isPublic?: boolean;
  description?: string;
  tags?: string[];
  uploadedBy?: string;
  checksum?: string;
  isEncrypted?: boolean;
}

export interface CreateEntityDocumentData {
  entityType: string;
  entityId: string;
  documentId: string;
  documentType: DocumentType;
  isRequired?: boolean;
  isPrimary?: boolean;
  displayOrder?: number;
  attachedBy?: string;
  notes?: string;
}
