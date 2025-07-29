// features/audit/db/schema/index.ts
// Audit & Communications schemas (Activity Logs, Notifications, Compliance)

import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { tenants } from '@/features/auth/db/schema';

// =============================================================================
// ENUMS
// =============================================================================

export const notificationStatusEnum = [
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced',
  'unread'
] as const;

export const notificationTypeEnum = [
  'package_received',
  'package_shipped',
  'storage_reminder',
  'payment_due',
  'quote_ready',
  'system_announcement',
  'security_alert',
  'personal_shopper_update',
  'customs_delay',
  'delivery_notification'
] as const;

export const activityActionEnum = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'view',
  'download',
  'upload',
  'approve',
  'reject',
  'assign',
  'unassign',
  'process',
  'ship',
  'deliver',
  'payment_received',
  'invoice_generated'
] as const;

export type NotificationStatus = typeof notificationStatusEnum[number];
export type NotificationType = typeof notificationTypeEnum[number];
export type ActivityAction = typeof activityActionEnum[number];

// =============================================================================
// ACTIVITY LOGGING
// =============================================================================

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'), // References users.id, nullable for system actions
  customerProfileId: uuid('customer_profile_id'), // References customer_profiles.id
  
  // Activity details
  action: varchar('action', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Details
  description: text('description'),
  metadata: jsonb('metadata').default('{}'),
  
  // IP and user agent for security auditing
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 500 }),
  
  // Changes tracking
  previousValues: jsonb('previous_values'),
  newValues: jsonb('new_values'),
  
  // Additional context
  sessionId: varchar('session_id', { length: 255 }),
  requestId: varchar('request_id', { length: 255 }),
  
  // Severity for filtering important events
  severity: varchar('severity', { length: 20 }).default('info'), // debug, info, warn, error, critical
  
  // Tags for categorization
  tags: jsonb('tags').default('[]'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// NOTIFICATION SYSTEM
// =============================================================================

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'), // References users.id
  customerProfileId: uuid('customer_profile_id'), // References customer_profiles.id
  
  // Notification content
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Type and status
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  
  // Priority for ordering and filtering
  priority: varchar('priority', { length: 10 }).default('normal'), // low, normal, high, urgent
  
  // Reference to source object
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  
  // Delivery channels
  channels: jsonb('channels').default('["in_app"]'), // in_app, email, sms, push
  
  // Delivery tracking
  sentViaEmail: boolean('sent_via_email').default(false),
  sentViaSms: boolean('sent_via_sms').default(false),
  sentViaPush: boolean('sent_via_push').default(false),
  sentViaInApp: boolean('sent_via_in_app').default(true),
  
  // Email specific
  emailAddress: varchar('email_address', { length: 255 }),
  emailSubject: varchar('email_subject', { length: 255 }),
  emailTemplate: varchar('email_template', { length: 100 }),
  
  // SMS specific
  phoneNumber: varchar('phone_number', { length: 50 }),
  smsTemplate: varchar('sms_template', { length: 100 }),
  
  // Push notification specific
  pushDeviceTokens: jsonb('push_device_tokens').default('[]'),
  pushTemplate: varchar('push_template', { length: 100 }),
  
  // Interaction tracking
  readAt: timestamp('read_at'),
  clickedAt: timestamp('clicked_at'),
  dismissedAt: timestamp('dismissed_at'),
  
  // Delivery attempts and results
  emailDeliveredAt: timestamp('email_delivered_at'),
  emailFailedAt: timestamp('email_failed_at'),
  emailFailureReason: text('email_failure_reason'),
  smsDeliveredAt: timestamp('sms_delivered_at'),
  smsFailedAt: timestamp('sms_failed_at'),
  smsFailureReason: text('sms_failure_reason'),
  pushDeliveredAt: timestamp('push_delivered_at'),
  pushFailedAt: timestamp('push_failed_at'),
  pushFailureReason: text('push_failure_reason'),
  
  // Retry logic
  retryCount: varchar('retry_count', { length: 2 }).default('0'),
  maxRetries: varchar('max_retries', { length: 2 }).default('3'),
  nextRetryAt: timestamp('next_retry_at'),
  
  // Additional data
  metadata: jsonb('metadata').default('{}'),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  // Grouping for bulk operations
  groupId: varchar('group_id', { length: 100 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Template identification
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  
  // Template content
  title: varchar('title', { length: 255 }).notNull(),
  messageTemplate: text('message_template').notNull(),
  
  // Channel-specific templates
  emailSubjectTemplate: varchar('email_subject_template', { length: 255 }),
  emailBodyTemplate: text('email_body_template'),
  smsTemplate: text('sms_template'),
  pushTemplate: text('push_template'),
  
  // Template variables (for documentation)
  availableVariables: jsonb('available_variables').default('[]'),
  
  // Settings
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  // Localization
  language: varchar('language', { length: 10 }).default('en'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// COMPLIANCE TRACKING
// =============================================================================

export const complianceEvents = pgTable('compliance_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  
  // Event identification
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventCategory: varchar('event_category', { length: 50 }).notNull(),
  
  // Related entities
  userId: uuid('user_id'), // References users.id
  customerProfileId: uuid('customer_profile_id'), // References customer_profiles.id
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: uuid('resource_id'),
  
  // Compliance details
  regulationType: varchar('regulation_type', { length: 50 }), // GDPR, PCI, SOX, etc.
  complianceStatus: varchar('compliance_status', { length: 20 }), // compliant, non_compliant, pending
  
  // Event data
  eventData: jsonb('event_data').default('{}'),
  evidence: jsonb('evidence').default('{}'),
  
  // Risk assessment
  riskLevel: varchar('risk_level', { length: 10 }).default('low'), // low, medium, high, critical
  
  // Resolution tracking
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by'), // References users.id
  resolutionNotes: text('resolution_notes'),
  
  // Retention
  retentionPeriod: varchar('retention_period', { length: 20 }).default('7_years'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Activity log types
export type ActivityLog = InferSelectModel<typeof activityLogs>;
export type NewActivityLog = InferInsertModel<typeof activityLogs>;

// Notification types
export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
export type NotificationTemplate = InferSelectModel<typeof notificationTemplates>;
export type NewNotificationTemplate = InferInsertModel<typeof notificationTemplates>;

// Compliance types
export type ComplianceEvent = InferSelectModel<typeof complianceEvents>;
export type NewComplianceEvent = InferInsertModel<typeof complianceEvents>;

// =============================================================================
// FILTER INTERFACES
// =============================================================================

export interface ActivityLogFilters {
  userId?: string;
  customerProfileId?: string;
  action?: ActivityAction | ActivityAction[];
  resourceType?: string;
  resourceId?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  userId?: string;
  customerProfileId?: string;
  notificationType?: NotificationType | NotificationType[];
  status?: NotificationStatus | NotificationStatus[];
  priority?: string;
  isRead?: boolean;
  channel?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ComplianceEventFilters {
  eventType?: string;
  eventCategory?: string;
  regulationType?: string;
  complianceStatus?: string;
  riskLevel?: string;
  userId?: string;
  customerProfileId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// CREATE/UPDATE INTERFACES
// =============================================================================

export interface CreateActivityLogData {
  userId?: string;
  customerProfileId?: string;
  action: ActivityAction;
  resourceType: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
  severity?: string;
  tags?: string[];
}

export interface CreateNotificationData {
  userId?: string;
  customerProfileId?: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority?: string;
  referenceType?: string;
  referenceId?: string;
  channels?: string[];
  emailAddress?: string;
  emailSubject?: string;
  emailTemplate?: string;
  phoneNumber?: string;
  smsTemplate?: string;
  pushDeviceTokens?: string[];
  pushTemplate?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  groupId?: string;
}

export interface UpdateNotificationData {
  status?: NotificationStatus;
  readAt?: string;
  clickedAt?: string;
  dismissedAt?: string;
  retryCount?: string;
  nextRetryAt?: string;
  emailDeliveredAt?: string;
  emailFailedAt?: string;
  emailFailureReason?: string;
  smsDeliveredAt?: string;
  smsFailedAt?: string;
  smsFailureReason?: string;
  pushDeliveredAt?: string;
  pushFailedAt?: string;
  pushFailureReason?: string;
}

export interface CreateNotificationTemplateData {
  name: string;
  code: string;
  notificationType: NotificationType;
  title: string;
  messageTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  smsTemplate?: string;
  pushTemplate?: string;
  availableVariables?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  language?: string;
}

export interface CreateComplianceEventData {
  eventType: string;
  eventCategory: string;
  userId?: string;
  customerProfileId?: string;
  resourceType?: string;
  resourceId?: string;
  regulationType?: string;
  complianceStatus?: string;
  eventData?: Record<string, any>;
  evidence?: Record<string, any>;
  riskLevel?: string;
  retentionPeriod?: string;
}