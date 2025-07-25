import { pgTable, uuid, varchar, text, timestamp, decimal, integer, jsonb, date, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { kycStatusEnum, riskLevelEnum, companyTypeEnum, verificationStatusEnum } from './enums';
import { tenants } from './tenancy';
import { users } from './users';

// =============================================================================
// CUSTOMER PROFILES & COMPANIES
// =============================================================================

export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Unique customer identifier
  customerId: varchar('customer_id', { length: 50 }).unique().notNull(),
  
  // Personal details
  dateOfBirth: date('date_of_birth'),
  nationality: varchar('nationality', { length: 2 }),
  idNumber: varchar('id_number', { length: 100 }),
  
  // KYC/Compliance
  kycStatus: kycStatusEnum('kyc_status').default('not_required'),
  kycDocuments: jsonb('kyc_documents').default('[]'),
  kycNotes: text('kyc_notes'),
  kycVerifiedAt: timestamp('kyc_verified_at'),
  kycVerifiedBy: uuid('kyc_verified_by').references(() => users.id),
  
  // Risk assessment
  riskLevel: riskLevelEnum('risk_level').default('low'),
  
  // Customer lifetime value tracking
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  totalPackages: integer('total_packages').default(0),
  totalShipments: integer('total_shipments').default(0),
  
  // Stripe subscription fields - ADD THESE
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  planName: varchar('plan_name', { length: 100 }),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('inactive'),
  
  // Referral system - IMPORTANT: Use string UUID instead of direct reference to avoid circular dependency
  referralCode: varchar('referral_code', { length: 50 }).unique(),
  referredBy: uuid('referred_by'), 
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  ownerId: uuid('owner_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Company details
  name: varchar('name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  taxNumberType: varchar('tax_number_type', { length: 50 }),
  
  // Address
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 50 }),
  
  // Company type
  companyType: companyTypeEnum('company_type'),
  industry: varchar('industry', { length: 100 }),
  
  // Verification status
  verificationStatus: verificationStatusEnum('verification_status').default('unverified'),
  verificationDocuments: jsonb('verification_documents').default('[]'),
  
  // Settings
  showInAddress: boolean('show_in_address').default(false),
  useForCustoms: boolean('use_for_customs').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type CustomerProfile = InferSelectModel<typeof customerProfiles>;
export type NewCustomerProfile = InferInsertModel<typeof customerProfiles>;

export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;
