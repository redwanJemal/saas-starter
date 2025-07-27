// lib/db/schema/documents.ts
import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from './tenancy';
import { users } from './users';
import { packages } from './packages';

// =============================================================================
// GLOBAL DOCUMENT STORAGE
// =============================================================================

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // File information
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(), // Generated unique filename
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  
  // Storage information
  bucket: varchar('bucket', { length: 100 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  isPublic: boolean('is_public').default(false),
  
  // Metadata
  description: text('description'),
  tags: text('tags'), // JSON array of tags for categorization
  
  // Upload information
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  
  // Processing status (for future use - image processing, virus scanning, etc.)
  processingStatus: varchar('processing_status', { length: 50 }).default('pending'), // pending, processing, completed, failed
  processedAt: timestamp('processed_at'),
  
  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Updated package_documents table - now references global documents
export const packageDocuments = pgTable('package_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  // Package-specific document metadata
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'picture', 'invoice', 'receipt', 'label', etc.
  isRequired: boolean('is_required').default(false),
  isPrimary: boolean('is_primary').default(false), // For primary package photo
  displayOrder: integer('display_order').default(0),
  
  // Context when attached to package
  attachedBy: uuid('attached_by').references(() => users.id),
  attachedAt: timestamp('attached_at').notNull().defaultNow(),
  
  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// For temporary document storage before package creation
export const temporaryDocuments = pgTable('temporary_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(), // Browser session or upload session
  purpose: varchar('purpose', { length: 50 }).notNull(), // 'package_creation', 'profile_update', etc.
  
  // Cleanup
  expiresAt: timestamp('expires_at').notNull(), // Auto-cleanup after 24 hours
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports
export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;
export type PackageDocument = InferSelectModel<typeof packageDocuments>;
export type NewPackageDocument = InferInsertModel<typeof packageDocuments>;
export type TemporaryDocument = InferSelectModel<typeof temporaryDocuments>;
export type NewTemporaryDocument = InferInsertModel<typeof temporaryDocuments>;