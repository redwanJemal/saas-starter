// features/auth/db/schema/index.ts
// Authentication, Users, Tenancy, and RBAC schemas

import { pgTable, uuid, varchar, timestamp, boolean, inet, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const tenantStatusEnum = ['active', 'suspended', 'cancelled'] as const;
export const userTypeEnum = ['customer', 'admin', 'staff'] as const;
export const userStatusEnum = ['active', 'inactive', 'suspended'] as const;
export const roleTypeEnum = ['customer', 'admin', 'staff'] as const;

export type TenantStatus = typeof tenantStatusEnum[number];
export type UserType = typeof userTypeEnum[number];
export type UserStatus = typeof userStatusEnum[number];
export type RoleType = typeof roleTypeEnum[number];

// =============================================================================
// TENANCY MANAGEMENT
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
  status: varchar('status', { length: 20 }).notNull().default('active'),
  maxUsers: integer('max_users').default(1000),
  maxPackagesMonthly: integer('max_packages_monthly').default(10000),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
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
  userType: varchar('user_type', { length: 20 }).notNull().default('customer'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  
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

// =============================================================================
// RBAC SYSTEM
// =============================================================================

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  roleType: varchar('role_type', { length: 20 }).notNull(),
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

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at'),
  assignedBy: uuid('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Tenant types
export type Tenant = InferSelectModel<typeof tenants>;
export type NewTenant = InferInsertModel<typeof tenants>;

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// RBAC types
export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type Permission = InferSelectModel<typeof permissions>;
export type NewPermission = InferInsertModel<typeof permissions>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;
export type NewRolePermission = InferInsertModel<typeof rolePermissions>;
export type UserRole = InferSelectModel<typeof userRoles>;
export type NewUserRole = InferInsertModel<typeof userRoles>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface TenantFilters {
  status?: TenantStatus;
  planType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  userType?: UserType;
  status?: UserStatus;
  search?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface RoleFilters {
  roleType?: RoleType;
  isSystemRole?: boolean;
  search?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateTenantData {
  name: string;
  slug: string;
  domain?: string;
  companyName?: string;
  companyRegistration?: string;
  taxNumber?: string;
  planType?: string;
  billingEmail?: string;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  companyName?: string;
  companyRegistration?: string;
  taxNumber?: string;
  planType?: string;
  billingEmail?: string;
  status?: TenantStatus;
  maxUsers?: number;
  maxPackagesMonthly?: number;
  settings?: Record<string, any>;
  branding?: Record<string, any>;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: UserType;
  status?: UserStatus;
  language?: string;
  timezone?: string;
  currencyPreference?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
  language?: string;
  timezone?: string;
  currencyPreference?: string;
  twoFactorEnabled?: boolean;
}

export interface CreateRoleData {
  name: string;
  slug: string;
  description?: string;
  roleType: RoleType;
  isSystemRole?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  roleType?: RoleType;
}