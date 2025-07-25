import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { notificationStatusEnum } from './enums';
import { tenants } from './tenancy';
import { users } from './users';

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Notification content
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Type and status
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  status: notificationStatusEnum('status').default('unread'),
  
  // Reference to source object
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  
  // Delivery tracking
  sentViaEmail: boolean('sent_via_email').default(false),
  sentViaSms: boolean('sent_via_sms').default(false),
  sentViaPush: boolean('sent_via_push').default(false),
  
  // Interaction tracking
  readAt: timestamp('read_at'),
  clickedAt: timestamp('clicked_at'),
  
  // Additional data
  metadata: jsonb('metadata').default('{}'),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports
export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
