import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from './tenancy';
import { users } from './users';
import { customerProfiles } from './customers';

// =============================================================================
// AUDIT LOGGING
// =============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerProfileId: uuid('customer_profile_id').references(() => customerProfiles.id),
  
  // Activity details
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Details
  description: text('description'),
  metadata: jsonb('metadata').default('{}'),
  
  // IP and user agent for security auditing
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 500 }),
  
  // Changes
  previousValues: jsonb('previous_values'),
  newValues: jsonb('new_values'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports
export type ActivityLog = InferSelectModel<typeof activityLogs>;
export type NewActivityLog = InferInsertModel<typeof activityLogs>;
