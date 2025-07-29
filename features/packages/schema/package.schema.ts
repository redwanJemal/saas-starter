import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Define the Package status enum values
export type PackageStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';

// Define the Package table schema
export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'shipped', 'delivered', 'returned'] })
    .notNull()
    .default('pending'),
  weight: varchar('weight', { length: 20 }),
  dimensions: varchar('dimensions', { length: 50 }),
  origin: varchar('origin', { length: 100 }),
  destination: varchar('destination', { length: 100 }).notNull(),
  estimatedDelivery: timestamp('estimated_delivery'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define the Package Photos table schema
export const packagePhotos = pgTable('package_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => packages.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 255 }).notNull(),
  caption: varchar('caption', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type definitions for Package and related data
export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
export type PackagePhoto = typeof packagePhotos.$inferSelect;
export type NewPackagePhoto = typeof packagePhotos.$inferInsert;

// Type for Package filters
export interface PackageFilters {
  status?: PackageStatus | PackageStatus[];
  trackingNumber?: string;
  customerId?: string;
  origin?: string;
  destination?: string;
  fromDate?: Date;
  toDate?: Date;
}

// Type for creating a new package
export type CreatePackageData = Omit<NewPackage, 'id' | 'createdAt' | 'updatedAt'>;

// Type for updating an existing package
export type UpdatePackageData = Partial<Omit<NewPackage, 'id' | 'createdAt' | 'updatedAt'>>;
