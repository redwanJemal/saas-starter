// features/settings/db/schema/addresses.schema.ts
import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

export const addressTypeEnum = ['shipping', 'billing', 'company', 'warehouse'] as const;
export type AddressType = typeof addressTypeEnum[number];

// ============================================================================= 
// GLOBAL ADDRESS MANAGEMENT
// =============================================================================
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Address details
  name: varchar('name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  
  // Contact information
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  
  // Additional details
  deliveryInstructions: text('delivery_instructions'),
  
  // Status and verification
  isVerified: boolean('is_verified').default(false),
  verificationMethod: varchar('verification_method', { length: 50 }),
  verifiedAt: timestamp('verified_at'),
  
  // Metadata
  createdBy: uuid('created_by'), // References users.id
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================= 
// ENTITY ADDRESS ASSOCIATIONS (Polymorphic)
// =============================================================================
export const entityAddresses = pgTable('entity_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  addressId: uuid('address_id').references(() => addresses.id, { onDelete: 'cascade' }).notNull(),
  
  // Polymorphic reference
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'customer_profile', 'company', 'shipment', etc.
  entityId: uuid('entity_id').notNull(),
  
  // Address type for this entity
  addressType: varchar('address_type', { length: 20 }).notNull(),
  
  // Preferences
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Context
  assignedBy: uuid('assigned_by'), // References users.id
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;
export type EntityAddress = InferSelectModel<typeof entityAddresses>;
export type NewEntityAddress = InferInsertModel<typeof entityAddresses>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface AddressFilters {
  entityType?: string;
  entityId?: string;
  addressType?: AddressType | AddressType[];
  countryCode?: string;
  isVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateAddressData {
  name: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  email?: string;
  deliveryInstructions?: string;
  isVerified?: boolean;
  verificationMethod?: string;
  createdBy?: string;
}

export interface UpdateAddressData {
  name?: string;
  companyName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  deliveryInstructions?: string;
  isVerified?: boolean;
  verificationMethod?: string;
}

export interface CreateEntityAddressData {
  entityType: string;
  entityId: string;
  addressId: string;
  addressType: AddressType;
  isDefault?: boolean;
  isActive?: boolean;
  assignedBy?: string;
}
