import { pgEnum } from 'drizzle-orm/pg-core';

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
  'reserved',
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
  'bounced',
  'unread'
]);
export const companyTypeEnum = pgEnum('company_type', ['LLC', 'Corp', 'Ltd', 'Partnership', 'Sole_Proprietorship', 'Other']);
export const verificationStatusEnum = pgEnum('verification_status', ['unverified', 'pending', 'verified', 'rejected']);
export const incomingShipmentStatusEnum = pgEnum('incoming_shipment_status', [
  'pending', 'scanning', 'scanned', 'assigned', 'received', 'expected'
]);

export const itemAssignmentStatusEnum = pgEnum('item_assignment_status', [
  'unassigned', 'assigned', 'received'
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'standard', 'express', 'economy'
]);