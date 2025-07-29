import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Define the Customer status enum values
export type CustomerStatus = 'active' | 'inactive' | 'pending' | 'blocked';

// Define the Customer table schema
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  status: text('status', { enum: ['active', 'inactive', 'pending', 'blocked'] })
    .notNull()
    .default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type definitions for Customer and related data
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// Type for Customer filters
export interface CustomerFilters {
  status?: CustomerStatus | CustomerStatus[];
  name?: string;
  email?: string;
  country?: string;
  city?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Type for creating a new customer
export type CreateCustomerData = Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating an existing customer
export type UpdateCustomerData = Partial<Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>>;
