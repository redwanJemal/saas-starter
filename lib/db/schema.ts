import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  date,
  serial,
  inet,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'cancelled']);
export const userTypeEnum = pgEnum('user_type', ['customer', 'admin', 'staff']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const roleTypeEnum = pgEnum('role_type', ['customer', 'admin', 'staff']);
export const kycStatusEnum = pgEnum('kyc_status', ['not_required', 'pending', 'approved', 'rejected']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high']);
export const taxTreatmentEnum = pgEnum('tax_treatment', ['standard', 'tax_free', 'bonded']);
export const warehouseStatusEnum = pgEnum('warehouse_status', ['active', 'inactive', 'maintenance']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['active', 'suspended', 'expired']);
export const addressTypeEnum = pgEnum('address_type', ['shipping', 'billing']);
export const packageStatusEnum = pgEnum('package_status', [
  'expected',
  'received', 
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'returned',
  'disposed',
  'missing',
  'damaged',
  'held'
]);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'quote_requested',
  'quoted',
  'paid',
  'processing',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'returned',
  'cancelled',
  'refunded'
]);
export const invoiceTypeEnum = pgEnum('invoice_type', [
  'shipping',
  'storage',
  'handling',
  'personal_shopper',
  'customs_duty',
  'insurance',
  'other'
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'refunded'
]);
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced'
]);
export const companyTypeEnum = pgEnum('company_type', ['LLC', 'Corp', 'Ltd', 'Partnership', 'Sole_Proprietorship', 'Other']);
export const verificationStatusEnum = pgEnum('verification_status', ['unverified', 'pending', 'verified', 'rejected']);

// =============================================================================
// TENANCY SYSTEM
// =============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  domain: varchar('domain', { length: 255 }),
  
  // Business details
  companyName: varchar('company_name', { length: 255 }),
  companyRegistration: varchar('company_registration', { length: 100 }),
  taxNumber: varchar('tax_number', { length: 100 }),
  
  // Tenant settings
  settings: jsonb('settings').default('{}'),
  branding: jsonb('branding').default('{}'),
  
  // Subscription/billing
  planType: varchar('plan_type', { length: 50 }).default('standard'),
  billingEmail: varchar('billing_email', { length: 255 }),
  
  // Status and limits
  status: tenantStatusEnum('status').default('active'),
  maxUsers: integer('max_users').default(1000),
  maxPackagesMonthly: integer('max_packages_monthly').default(10000),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// =============================================================================
// RBAC SYSTEM
// =============================================================================

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  
  roleType: roleTypeEnum('role_type').notNull(),
  isSystemRole: boolean('is_system_role').default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  name: varchar('name', { length: 100 }).unique().notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  
  category: varchar('category', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Authentication
  email: varchar('email', { length: 255 }).notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  
  // Profile
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  // User type and status
  userType: userTypeEnum('user_type').default('customer'),
  status: userStatusEnum('status').default('active'),
  
  // Security
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: inet('last_login_ip'),
  
  // Preferences
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  currencyPreference: varchar('currency_preference', { length: 3 }).default('USD'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  
  expiresAt: timestamp('expires_at'),
  assignedBy: uuid('assigned_by').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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

// =============================================================================
// WAREHOUSE MANAGEMENT
// =============================================================================

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Basic info
  code: varchar('code', { length: 20 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Location
  countryCode: varchar('country_code', { length: 2 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  
  // Operational details
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  
  // Business settings
  taxTreatment: taxTreatmentEnum('tax_treatment').default('standard'),
  storageFreeDays: integer('storage_free_days').default(30),
  storageFeePerDay: decimal('storage_fee_per_day', { precision: 8, scale: 2 }).default('1.00'),
  
  // Capacity and limits
  maxPackageWeightKg: decimal('max_package_weight_kg', { precision: 8, scale: 2 }).default('30.00'),
  maxPackageValue: decimal('max_package_value', { precision: 12, scale: 2 }).default('10000.00'),
  
  // Status
  status: warehouseStatusEnum('status').default('active'),
  acceptsNewPackages: boolean('accepts_new_packages').default(true),
  
  // Operating hours
  operatingHours: jsonb('operating_hours').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customerWarehouseAssignments = pgTable('customer_warehouse_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  suiteCode: varchar('suite_code', { length: 50 }).notNull(),
  status: assignmentStatusEnum('status').default('active'),
  
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  assignedBy: uuid('assigned_by').references(() => users.id),
});

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

// =============================================================================
// PACKAGE MANAGEMENT
// =============================================================================

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Package identification
  internalId: varchar('internal_id', { length: 50 }).unique().notNull(),
  suiteCodeCaptured: varchar('suite_code_captured', { length: 50 }),
  trackingNumberInbound: varchar('tracking_number_inbound', { length: 255 }),
  
  // Sender information
  senderName: varchar('sender_name', { length: 255 }),
  senderCompany: varchar('sender_company', { length: 255 }),
  senderTrackingUrl: varchar('sender_tracking_url', { length: 500 }),
  
  // Package details
  description: text('description'),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  estimatedValueCurrency: varchar('estimated_value_currency', { length: 3 }).default('USD'),
  
  // Physical properties
  weightActualKg: decimal('weight_actual_kg', { precision: 8, scale: 3 }),
  lengthCm: decimal('length_cm', { precision: 8, scale: 2 }),
  widthCm: decimal('width_cm', { precision: 8, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 8, scale: 2 }),
  volumetricWeightKg: decimal('volumetric_weight_kg', { precision: 8, scale: 3 }),
  
  // Status tracking
  status: packageStatusEnum('status').default('expected'),
  
  // Important dates
  expectedArrivalDate: date('expected_arrival_date'),
  receivedAt: timestamp('received_at'),
  readyToShipAt: timestamp('ready_to_ship_at'),
  storageExpiresAt: timestamp('storage_expires_at'),
  
  // Processing notes
  warehouseNotes: text('warehouse_notes'),
  customerNotes: text('customer_notes'),
  specialInstructions: text('special_instructions'),
  
  // Flags
  isFragile: boolean('is_fragile').default(false),
  isHighValue: boolean('is_high_value').default(false),
  requiresAdultSignature: boolean('requires_adult_signature').default(false),
  isRestricted: boolean('is_restricted').default(false),
  
  // Processing details
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const packageDocuments = pgTable('package_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  
  documentType: varchar('document_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Categorization
  isPublic: boolean('is_public').default(true),
  displayOrder: integer('display_order').default(0),
  
  // Metadata
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadNotes: text('upload_notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const packageStatusHistory = pgTable('package_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  
  status: packageStatusEnum('status').notNull(),
  notes: text('notes'),
  
  changedBy: uuid('changed_by').references(() => users.id),
  changeReason: varchar('change_reason', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// SHIPMENT MANAGEMENT
// =============================================================================

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'cascade' }).notNull(),
  
  // Shipment identification
  shipmentNumber: varchar('shipment_number', { length: 50 }).unique().notNull(),
  
  // Destination
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id),
  companyId: uuid('company_id').references(() => companies.id),
  
  // Carrier information
  carrierCode: varchar('carrier_code', { length: 50 }),
  serviceType: varchar('service_type', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrierReference: varchar('carrier_reference', { length: 255 }),
  
  // Shipment details
  totalWeightKg: decimal('total_weight_kg', { precision: 8, scale: 3 }),
  totalDeclaredValue: decimal('total_declared_value', { precision: 12, scale: 2 }),
  declaredValueCurrency: varchar('declared_value_currency', { length: 3 }).default('USD'),
  
  // Shipping costs
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
  insuranceCost: decimal('insurance_cost', { precision: 10, scale: 2 }).default('0.00'),
  handlingFee: decimal('handling_fee', { precision: 10, scale: 2 }).default('0.00'),
  storageFee: decimal('storage_fee', { precision: 10, scale: 2 }).default('0.00'),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  costCurrency: varchar('cost_currency', { length: 3 }),
  
  // Status tracking
  status: shipmentStatusEnum('status').default('quote_requested'),
  
  // Important dates
  quoteExpiresAt: timestamp('quote_expires_at'),
  paidAt: timestamp('paid_at'),
  dispatchedAt: timestamp('dispatched_at'),
  estimatedDeliveryDate: date('estimated_delivery_date'),
  deliveredAt: timestamp('delivered_at'),
  
  // Customs and compliance
  customsDeclaration: jsonb('customs_declaration').default('{}'),
  commercialInvoiceUrl: varchar('commercial_invoice_url', { length: 500 }),
  customsStatus: varchar('customs_status', { length: 30 }).default('pending'),
  
  // Special handling
  requiresSignature: boolean('requires_signature').default(false),
  deliveryInstructions: text('delivery_instructions'),
  
  // Processing
  createdBy: uuid('created_by').references(() => users.id),
  processedBy: uuid('processed_by').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const shipmentPackages = pgTable('shipment_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  
  declaredValue: decimal('declared_value', { precision: 12, scale: 2 }),
  declaredDescription: text('declared_description'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shipmentTrackingEvents = pgTable('shipment_tracking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  
  eventCode: varchar('event_code', { length: 50 }).notNull(),
  eventDescription: text('event_description').notNull(),
  location: varchar('location', { length: 255 }),
  
  eventTimestamp: timestamp('event_timestamp').notNull(),
  
  source: varchar('source', { length: 50 }).default('manual'),
  rawData: jsonb('raw_data'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  
  eventType: varchar('event_type', { length: 100 }).notNull(),
  
  emailEnabled: boolean('email_enabled').default(true),
  smsEnabled: boolean('sms_enabled').default(false),
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  pushEnabled: boolean('push_enabled').default(true),
  
  emailAddress: varchar('email_address', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id),
  
  eventType: varchar('event_type', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  
  // Message content
  subject: varchar('subject', { length: 500 }),
  message: text('message'),
  
  // Status tracking
  status: notificationStatusEnum('status').default('pending'),
  
  // External service details
  provider: varchar('provider', { length: 50 }),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  providerResponse: jsonb('provider_response'),
  
  // Retry logic
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at'),
  
  // Reference to triggering object
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// AUDIT & ACTIVITY LOGGING
// =============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Actor information
  userId: uuid('user_id').references(() => users.id),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id),
  
  // Action details
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Context
  description: text('description'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  
  // Changes (for update actions)
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  
  // Additional metadata
  metadata: jsonb('metadata').default('{}'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// SYSTEM CONFIGURATION
// =============================================================================

export const systemConfigs = pgTable('system_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  configKey: varchar('config_key', { length: 255 }).notNull(),
  configValue: text('config_value'),
  configType: varchar('config_type', { length: 50 }).default('string'),
  
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  isEncrypted: boolean('is_encrypted').default(false),
  
  validationRules: jsonb('validation_rules'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  customerProfiles: many(customerProfiles),
  companies: many(companies),
  warehouses: many(warehouses),
  packages: many(packages),
  shipments: many(shipments),
  financialInvoices: many(financialInvoices),
  activityLogs: many(activityLogs),
  notificationLogs: many(notificationLogs),
  systemConfigs: many(systemConfigs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles),
  userRoles: many(userRoles),
  packagesProcessed: many(packages),
  shipmentsCreated: many(shipments),
  documentsUploaded: many(packageDocuments),
  statusChanges: many(packageStatusHistory),
  activityLogs: many(activityLogs),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [customerProfiles.tenantId],
    references: [tenants.id],
  }),
  referrer: one(customerProfiles, {
    fields: [customerProfiles.referredBy],
    references: [customerProfiles.id],
  }),
  companies: many(companies),
  addresses: many(addresses),
  packages: many(packages),
  shipments: many(shipments),
  financialInvoices: many(financialInvoices),
  warehouseAssignments: many(customerWarehouseAssignments),
  notificationPreferences: many(notificationPreferences),
  notificationLogs: many(notificationLogs),
  activityLogs: many(activityLogs),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
  owner: one(customerProfiles, {
    fields: [companies.ownerId],
    references: [customerProfiles.id],
  }),
  shipments: many(shipments),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [warehouses.tenantId],
    references: [tenants.id],
  }),
  customerAssignments: many(customerWarehouseAssignments),
  packages: many(packages),
  shipments: many(shipments),
}));

export const customerWarehouseAssignmentsRelations = relations(customerWarehouseAssignments, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [customerWarehouseAssignments.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [customerWarehouseAssignments.warehouseId],
    references: [warehouses.id],
  }),
  assignedByUser: one(users, {
    fields: [customerWarehouseAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  customerProfile: one(customerProfiles, {
    fields: [addresses.customerProfileId],
    references: [customerProfiles.id],
  }),
  shipmentsAsShipping: many(shipments),
  shipmentsAsBilling: many(shipments),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [packages.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [packages.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [packages.warehouseId],
    references: [warehouses.id],
  }),
  processedByUser: one(users, {
    fields: [packages.processedBy],
    references: [users.id],
  }),
  documents: many(packageDocuments),
  statusHistory: many(packageStatusHistory),
  shipmentPackages: many(shipmentPackages),
}));

export const packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(packages, {
    fields: [packageDocuments.packageId],
    references: [packages.id],
  }),
  uploadedByUser: one(users, {
    fields: [packageDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const packageStatusHistoryRelations = relations(packageStatusHistory, ({ one }) => ({
  package: one(packages, {
    fields: [packageStatusHistory.packageId],
    references: [packages.id],
  }),
  changedByUser: one(users, {
    fields: [packageStatusHistory.changedBy],
    references: [users.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [shipments.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [shipments.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [shipments.warehouseId],
    references: [warehouses.id],
  }),
  shippingAddress: one(addresses, {
    fields: [shipments.shippingAddressId],
    references: [addresses.id],
  }),
  billingAddress: one(addresses, {
    fields: [shipments.billingAddressId],
    references: [addresses.id],
  }),
  company: one(companies, {
    fields: [shipments.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
  }),
  processedByUser: one(users, {
    fields: [shipments.processedBy],
    references: [users.id],
  }),
  shipmentPackages: many(shipmentPackages),
  trackingEvents: many(shipmentTrackingEvents),
  financialInvoices: many(financialInvoices),
}));

export const shipmentPackagesRelations = relations(shipmentPackages, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentPackages.shipmentId],
    references: [shipments.id],
  }),
  package: one(packages, {
    fields: [shipmentPackages.packageId],
    references: [packages.id],
  }),
}));

export const shipmentTrackingEventsRelations = relations(shipmentTrackingEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentTrackingEvents.shipmentId],
    references: [shipments.id],
  }),
}));

export const financialInvoicesRelations = relations(financialInvoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [financialInvoices.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [financialInvoices.customerProfileId],
    references: [customerProfiles.id],
  }),
  shipment: one(shipments, {
    fields: [financialInvoices.shipmentId],
    references: [shipments.id],
  }),
  invoiceLines: many(financialInvoiceLines),
}));

export const financialInvoiceLinesRelations = relations(financialInvoiceLines, ({ one }) => ({
  invoice: one(financialInvoices, {
    fields: [financialInvoiceLines.invoiceId],
    references: [financialInvoices.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [notificationPreferences.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notificationLogs.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [notificationLogs.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [activityLogs.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const systemConfigsRelations = relations(systemConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [systemConfigs.tenantId],
    references: [tenants.id],
  }),
}));

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_TENANT_SLUG = 'default';
export const CUSTOMER_ID_PREFIX = 'PF';
export const CUSTOMER_ID_LENGTH = 8;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;

export type CustomerWarehouseAssignment = typeof customerWarehouseAssignments.$inferSelect;
export type NewCustomerWarehouseAssignment = typeof customerWarehouseAssignments.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

export type PackageDocument = typeof packageDocuments.$inferSelect;
export type NewPackageDocument = typeof packageDocuments.$inferInsert;

export type PackageStatusHistory = typeof packageStatusHistory.$inferSelect;
export type NewPackageStatusHistory = typeof packageStatusHistory.$inferInsert;

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

export type ShipmentPackage = typeof shipmentPackages.$inferSelect;
export type NewShipmentPackage = typeof shipmentPackages.$inferInsert;

export type ShipmentTrackingEvent = typeof shipmentTrackingEvents.$inferSelect;
export type NewShipmentTrackingEvent = typeof shipmentTrackingEvents.$inferInsert;

export type FinancialInvoice = typeof financialInvoices.$inferSelect;
export type NewFinancialInvoice = typeof financialInvoices.$inferInsert;

export type FinancialInvoiceLine = typeof financialInvoiceLines.$inferSelect;
export type NewFinancialInvoiceLine = typeof financialInvoiceLines.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type SystemConfig = InferSelectModel<typeof systemConfigs>;
export type NewSystemConfig = InferInsertModel<typeof systemConfigs>;

// =============================================================================
// COMPLEX TYPES FOR QUERIES
// =============================================================================

export type CustomerWithProfile = User & {
  customerProfile: CustomerProfile & {
    companies: Company[];
    addresses: Address[];
    warehouseAssignments: (CustomerWarehouseAssignment & {
      warehouse: Warehouse;
    })[];
  };
};

export type PackageWithDetails = Package & {
  customerProfile: CustomerProfile & {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  };
  warehouse: Warehouse;
  documents: PackageDocument[];
  statusHistory: (PackageStatusHistory & {
    changedByUser: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
  })[];
};

export type ShipmentWithDetails = Shipment & {
  customerProfile: CustomerProfile & {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  };
  warehouse: Warehouse;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  company: Company | null;
  shipmentPackages: (ShipmentPackage & {
    package: Package;
  })[];
  trackingEvents: ShipmentTrackingEvent[];
  financialInvoices: FinancialInvoice[];
};

export type InvoiceWithLines = FinancialInvoice & {
  customerProfile: CustomerProfile & {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  };
  shipment: Shipment | null;
  invoiceLines: FinancialInvoiceLine[];
};

// =============================================================================
// ENUMS FOR APPLICATION USE
// =============================================================================

export enum ActivityType {
  // Authentication
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // Profile management
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ADDRESS_ADDED = 'ADDRESS_ADDED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_DELETED = 'ADDRESS_DELETED',
  
  // Package operations
  PACKAGE_RECEIVED = 'PACKAGE_RECEIVED',
  PACKAGE_PROCESSED = 'PACKAGE_PROCESSED',
  PACKAGE_PHOTOS_UPLOADED = 'PACKAGE_PHOTOS_UPLOADED',
  PACKAGE_READY_TO_SHIP = 'PACKAGE_READY_TO_SHIP',
  PACKAGE_SHIPPED = 'PACKAGE_SHIPPED',
  
  // Shipment operations
  SHIPMENT_QUOTE_REQUESTED = 'SHIPMENT_QUOTE_REQUESTED',
  SHIPMENT_QUOTE_PROVIDED = 'SHIPMENT_QUOTE_PROVIDED',
  SHIPMENT_PAID = 'SHIPMENT_PAID',
  SHIPMENT_DISPATCHED = 'SHIPMENT_DISPATCHED',
  SHIPMENT_DELIVERED = 'SHIPMENT_DELIVERED',
  
  // Financial operations
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_PAID = 'INVOICE_PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  
  // System operations
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_REACTIVATED = 'ACCOUNT_REACTIVATED',
  KYC_SUBMITTED = 'KYC_SUBMITTED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
}

export enum NotificationEventType {
  // Package events
  PACKAGE_RECEIVED = 'package_received',
  PACKAGE_READY_TO_SHIP = 'package_ready_to_ship',
  PACKAGE_PHOTOS_AVAILABLE = 'package_photos_available',
  PACKAGE_STORAGE_EXPIRING = 'package_storage_expiring',
  PACKAGE_DISPOSED = 'package_disposed',
  
  // Shipment events
  SHIPMENT_QUOTE_READY = 'shipment_quote_ready',
  SHIPMENT_QUOTE_EXPIRING = 'shipment_quote_expiring',
  SHIPMENT_DISPATCHED = 'shipment_dispatched',
  SHIPMENT_IN_TRANSIT = 'shipment_in_transit',
  SHIPMENT_OUT_FOR_DELIVERY = 'shipment_out_for_delivery',
  SHIPMENT_DELIVERED = 'shipment_delivered',
  SHIPMENT_DELIVERY_FAILED = 'shipment_delivery_failed',
  
  // Financial events
  INVOICE_CREATED = 'invoice_created',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_OVERDUE = 'invoice_overdue',
  PAYMENT_FAILED = 'payment_failed',
  
  // Account events
  ACCOUNT_CREATED = 'account_created',
  EMAIL_VERIFICATION_REQUIRED = 'email_verification_required',
  PASSWORD_CHANGED = 'password_changed',
  KYC_REQUIRED = 'kyc_required',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  
  // System events
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SERVICE_DISRUPTION = 'service_disruption',
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type PackageStatus = typeof packageStatusEnum.enumValues[number];
export type ShipmentStatus = typeof shipmentStatusEnum.enumValues[number];
export type InvoiceType = typeof invoiceTypeEnum.enumValues[number];
export type PaymentStatus = typeof paymentStatusEnum.enumValues[number];
export type UserType = typeof userTypeEnum.enumValues[number];
export type RoleType = typeof roleTypeEnum.enumValues[number];
export type AddressType = typeof addressTypeEnum.enumValues[number];

// =============================================================================
// SCHEMA VALIDATION HELPERS
// =============================================================================

export const PACKAGE_STATUS_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  expected: ['received', 'missing'],
  received: ['processing', 'damaged', 'held'],
  processing: ['ready_to_ship', 'held', 'returned'],
  ready_to_ship: ['shipped', 'held', 'returned'],
  shipped: ['delivered', 'returned'],
  delivered: [],
  returned: ['disposed'],
  disposed: [],
  missing: ['received'],
  damaged: ['disposed', 'returned'],
  held: ['processing', 'returned', 'disposed'],
};

export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  quote_requested: ['quoted', 'cancelled'],
  quoted: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['in_transit'],
  in_transit: ['out_for_delivery', 'returned'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: [],
  delivery_failed: ['out_for_delivery', 'returned'],
  returned: ['processing'],
  cancelled: ['refunded'],
  refunded: [],
};

export const HIGH_VALUE_THRESHOLD = 1000; // USD
export const DEFAULT_STORAGE_FREE_DAYS = 30;
export const DEFAULT_STORAGE_FEE_PER_DAY = 1.00; // USD

// =============================================================================
// ADDITIONAL CONFIGURATION CONSTANTS
// =============================================================================

export const SHIPMENT_NUMBER_PREFIX = 'SH';
export const INVOICE_NUMBER_PREFIX = 'INV';