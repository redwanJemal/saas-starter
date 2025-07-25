import { pgTable, uuid, varchar, timestamp, boolean, inet } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { userTypeEnum, userStatusEnum } from './enums';
import { tenants } from './tenancy';
import { roles } from './rbac';

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

// Type exports
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type UserRole = InferSelectModel<typeof userRoles>;
export type NewUserRole = InferInsertModel<typeof userRoles>;
