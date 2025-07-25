import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { addressTypeEnum } from './enums';
import { customerProfiles } from './customers';

// =============================================================================
// ADDRESS MANAGEMENT
// =============================================================================

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  addressType: addressTypeEnum('address_type').notNull(),
  
  // Address details
  name: varchar('name', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  
  // Contact
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  
  // Additional details
  deliveryInstructions: text('delivery_instructions'),
  
  // Status and preferences
  isDefault: boolean('is_default').default(false),
  isVerified: boolean('is_verified').default(false),
  verificationMethod: varchar('verification_method', { length: 50 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;
