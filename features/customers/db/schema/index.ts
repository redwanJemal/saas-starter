// features/customers/db/schema/index.ts
// Enhanced Customer Management schemas (Profiles and Companies only - Addresses moved to Settings)

import { AddressType, addressTypeEnum, EntityAddress, NewEntityAddress } from '@/features/settings/db/schema';

import { pgTable, uuid, varchar, text, timestamp, decimal, integer, jsonb, date, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';
import { users } from '@/features/auth/db/schema';

// Enums
export const kycStatusEnum = ['not_required', 'pending', 'approved', 'rejected'] as const;
export const riskLevelEnum = ['low', 'medium', 'high'] as const;
export const companyTypeEnum = ['LLC', 'Corp', 'Ltd', 'Partnership', 'Sole_Proprietorship', 'Other'] as const;
export const verificationStatusEnum = ['unverified', 'pending', 'verified', 'rejected'] as const;

export type KycStatus = typeof kycStatusEnum[number];
export type RiskLevel = typeof riskLevelEnum[number];
export type CompanyType = typeof companyTypeEnum[number];
export type VerificationStatus = typeof verificationStatusEnum[number];

// =============================================================================
// CUSTOMER MANAGEMENT SCHEMA
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
  kycStatus: varchar('kyc_status', { length: 20 }).default('not_required'),
  kycDocuments: jsonb('kyc_documents').default('[]'),
  kycNotes: text('kyc_notes'),
  kycVerifiedAt: timestamp('kyc_verified_at'),
  kycVerifiedBy: uuid('kyc_verified_by').references(() => users.id),
  
  // Risk assessment
  riskLevel: varchar('risk_level', { length: 10 }).default('low'),
  riskNotes: text('risk_notes'),
  lastRiskAssessment: timestamp('last_risk_assessment'),
  
  // Customer lifetime value tracking
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0.00'),
  totalPackages: integer('total_packages').default(0),
  totalShipments: integer('total_shipments').default(0),
  averagePackageValue: decimal('average_package_value', { precision: 12, scale: 2 }).default('0.00'),
  
  // Subscription & Billing
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeProductId: varchar('stripe_product_id', { length: 255 }),
  planName: varchar('plan_name', { length: 100 }),
  planFeatures: jsonb('plan_features').default('{}'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('inactive'),
  subscriptionStartedAt: timestamp('subscription_started_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  
  // Referral system
  referralCode: varchar('referral_code', { length: 50 }).unique(),
  referredBy: uuid('referred_by'), // Self-reference to customer_profiles
  referralReward: decimal('referral_reward', { precision: 8, scale: 2 }).default('0.00'),
  totalReferrals: integer('total_referrals').default(0),
  
  // Preferences
  preferredCurrency: varchar('preferred_currency', { length: 3 }).default('USD'),
  communicationPreferences: jsonb('communication_preferences').default('{}'),
  shippingPreferences: jsonb('shipping_preferences').default('{}'),
  
  // Customer service
  customerServiceNotes: text('customer_service_notes'),
  isVip: boolean('is_vip').default(false),
  vipSince: timestamp('vip_since'),
  
  // Account status
  accountStatus: varchar('account_status', { length: 20 }).default('active'), // active, suspended, closed
  suspensionReason: text('suspension_reason'),
  suspendedAt: timestamp('suspended_at'),
  suspendedBy: uuid('suspended_by').references(() => users.id),
  
  // Marketing
  marketingOptIn: boolean('marketing_opt_in').default(true),
  smsOptIn: boolean('sms_opt_in').default(false),
  emailOptIn: boolean('email_opt_in').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  ownerId: uuid('owner_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Company details
  name: varchar('name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  registrationNumber: varchar('registration_number', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  taxNumberType: varchar('tax_number_type', { length: 50 }),
  vatNumber: varchar('vat_number', { length: 100 }),
  
  // Business information
  companyType: varchar('company_type', { length: 30 }),
  industry: varchar('industry', { length: 100 }),
  businessDescription: text('business_description'),
  yearEstablished: integer('year_established'),
  numberOfEmployees: varchar('number_of_employees', { length: 20 }),
  annualRevenue: varchar('annual_revenue', { length: 20 }),
  
  // Contact details
  website: varchar('website', { length: 255 }),
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactTitle: varchar('primary_contact_title', { length: 100 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 50 }),
  
  // Legal and compliance
  verificationStatus: varchar('verification_status', { length: 20 }).default('unverified'),
  verificationDocuments: jsonb('verification_documents').default('[]'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationNotes: text('verification_notes'),
  
  // Business settings
  showInAddress: boolean('show_in_address').default(false),
  useForCustoms: boolean('use_for_customs').default(false),
  customsExporterNumber: varchar('customs_exporter_number', { length: 100 }),
  
  // Financial
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }),
  creditTerms: varchar('credit_terms', { length: 50 }),
  paymentTerms: varchar('payment_terms', { length: 50 }).default('net_30'),
  
  // Account management
  accountManagerId: uuid('account_manager_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Customer communication log
export const customerCommunications = pgTable('customer_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Communication details
  communicationType: varchar('communication_type', { length: 50 }).notNull(), // email, phone, chat, meeting
  direction: varchar('direction', { length: 10 }).notNull(), // inbound, outbound
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  
  // Participants
  staffMemberId: uuid('staff_member_id').references(() => users.id),
  externalParticipants: jsonb('external_participants').default('[]'),
  
  // Metadata
  duration: integer('duration'), // in minutes for calls/meetings
  outcome: varchar('outcome', { length: 100 }),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: timestamp('follow_up_date'),
  
  // Reference
  referenceType: varchar('reference_type', { length: 50 }), // package, shipment, invoice, etc.
  referenceId: uuid('reference_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Customer preferences and settings
export const customerPreferences = pgTable('customer_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  // Preference details
  category: varchar('category', { length: 50 }).notNull(), // notification, shipping, billing, etc.
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value').notNull(),
  
  // Metadata
  isDefault: boolean('is_default').default(false),
  isEditable: boolean('is_editable').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type CustomerProfile = InferSelectModel<typeof customerProfiles>;
export type NewCustomerProfile = InferInsertModel<typeof customerProfiles>;
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;
export type CustomerCommunication = InferSelectModel<typeof customerCommunications>;
export type NewCustomerCommunication = InferInsertModel<typeof customerCommunications>;
export type CustomerPreference = InferSelectModel<typeof customerPreferences>;
export type NewCustomerPreference = InferInsertModel<typeof customerPreferences>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface CustomerFilters {
  kycStatus?: KycStatus | KycStatus[];
  riskLevel?: RiskLevel | RiskLevel[];
  subscriptionStatus?: string;
  accountStatus?: string;
  isVip?: boolean;
  planName?: string;
  search?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  minSpent?: string;
  maxSpent?: string;
  minPackages?: number;
  maxPackages?: number;
  page?: number;
  limit?: number;
}

export interface CompanyFilters {
  companyType?: CompanyType | CompanyType[];
  verificationStatus?: VerificationStatus | VerificationStatus[];
  industry?: string;
  numberOfEmployees?: string;
  annualRevenue?: string;
  isActive?: boolean;
  accountManagerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerCommunicationFilters {
  customerProfileId?: string;
  communicationType?: string;
  direction?: string;
  staffMemberId?: string;
  followUpRequired?: boolean;
  referenceType?: string;
  referenceId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CustomerPreferenceFilters {
  customerProfileId?: string;
  category?: string;
  key?: string;
  isDefault?: boolean;
  isEditable?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateCustomerProfileData {
  customerId: string;
  dateOfBirth?: string;
  nationality?: string;
  idNumber?: string;
  kycStatus?: KycStatus;
  riskLevel?: RiskLevel;
  referralCode?: string;
  referredBy?: string;
  preferredCurrency?: string;
  communicationPreferences?: Record<string, any>;
  shippingPreferences?: Record<string, any>;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
}

export interface UpdateCustomerProfileData {
  dateOfBirth?: string;
  nationality?: string;
  idNumber?: string;
  kycStatus?: KycStatus;
  kycNotes?: string;
  riskLevel?: RiskLevel;
  riskNotes?: string;
  lastRiskAssessment?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeProductId?: string;
  planName?: string;
  planFeatures?: Record<string, any>;
  subscriptionStatus?: string;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  referralReward?: string;
  totalReferrals?: number;
  preferredCurrency?: string;
  communicationPreferences?: Record<string, any>;
  shippingPreferences?: Record<string, any>;
  customerServiceNotes?: string;
  isVip?: boolean;
  vipSince?: string;
  accountStatus?: string;
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  emailOptIn?: boolean;
}

export interface CreateCompanyData {
  name: string;
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  taxNumberType?: string;
  vatNumber?: string;
  companyType?: CompanyType;
  industry?: string;
  businessDescription?: string;
  yearEstablished?: number;
  numberOfEmployees?: string;
  annualRevenue?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactTitle?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  showInAddress?: boolean;
  useForCustoms?: boolean;
  customsExporterNumber?: string;
  creditLimit?: string;
  creditTerms?: string;
  paymentTerms?: string;
  accountManagerId?: string;
}

export interface UpdateCompanyData {
  name?: string;
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  taxNumberType?: string;
  vatNumber?: string;
  companyType?: CompanyType;
  industry?: string;
  businessDescription?: string;
  yearEstablished?: number;
  numberOfEmployees?: string;
  annualRevenue?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactTitle?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  verificationStatus?: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  showInAddress?: boolean;
  useForCustoms?: boolean;
  customsExporterNumber?: string;
  creditLimit?: string;
  creditTerms?: string;
  paymentTerms?: string;
  accountManagerId?: string;
  isActive?: boolean;
}

export interface CreateCustomerCommunicationData {
  customerProfileId: string;
  communicationType: string;
  direction: string;
  subject?: string;
  content?: string;
  staffMemberId?: string;
  externalParticipants?: string[];
  duration?: number;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateCustomerPreferenceData {
  customerProfileId: string;
  category: string;
  key: string;
  value: string;
  isDefault?: boolean;
  isEditable?: boolean;
}

export interface UpdateCustomerPreferenceData {
  value?: string;
  isDefault?: boolean;
  isEditable?: boolean;
}

// =============================================================================
// BUSINESS LOGIC HELPERS
// =============================================================================

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: string;
  averageOrderValue: string;
  topCustomersBySpent: CustomerProfile[];
  kycStatusDistribution: Record<KycStatus, number>;
  riskLevelDistribution: Record<RiskLevel, number>;
  subscriptionStatusDistribution: Record<string, number>;
}

export interface CustomerLifetimeValue {
  customerId: string;
  totalSpent: string;
  totalPackages: number;
  totalShipments: number;
  averagePackageValue: string;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceFirstOrder: number;
  daysSinceLastOrder: number;
  predictedLifetimeValue: string;
}

// Address helper types (since addresses are now in settings)
export interface CustomerAddressReference {
  entityType: 'customer_profile';
  entityId: string;
  addressType: AddressType;
}

export interface CompanyAddressReference {
  entityType: 'company';
  entityId: string;
  addressType: AddressType;
}

// Helper functions for polymorphic address associations
export const createCustomerAddressLink = (customerId: string, addressId: string, addressType: AddressType): NewEntityAddress => ({
  entityType: 'customer_profile',
  entityId: customerId,
  addressId,
  addressType,
});

export const createCompanyAddressLink = (companyId: string, addressId: string, addressType: AddressType): NewEntityAddress => ({
  entityType: 'company',
  entityId: companyId,
  addressId,
  addressType,
});

// Helper types for working with customer addresses
export interface CustomerWithAddresses extends CustomerProfile {
  addresses?: EntityAddress[];
}

export interface CompanyWithAddresses extends Company {
  addresses?: EntityAddress[];
}
