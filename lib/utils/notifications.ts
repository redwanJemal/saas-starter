// lib/utils/notifications.ts

import { db } from '@/lib/db/drizzle';
import { notifications, customerProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface NotificationData {
  title: string;
  message: string;
  notificationType: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  detailPageUrl?: string;
}

export async function createCustomerNotification(
  tenantId: string,
  customerProfileId: string,
  data: NotificationData
) {
  try {
    // Get customer's user ID
    const [customer] = await db
      .select({ 
        userId: customerProfiles.userId,
      })
      .from(customerProfiles)
      .where(eq(customerProfiles.id, customerProfileId))
      .limit(1);

    if (!customer?.userId) {
      throw new Error('Customer user not found');
    }

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        tenantId,
        userId: customer.userId,
        title: data.title,
        message: data.message,
        notificationType: data.notificationType,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        metadata: {
          ...data.metadata,
          detailPageUrl: data.detailPageUrl,
          customerName: `${customer.userId}`.trim(),
        },
      })
      .returning();

    return notification;
  } catch (error) {
    console.error('Error creating customer notification:', error);
    throw error;
  }
}

export async function notifyPackageAssigned(
  tenantId: string,
  customerProfileId: string,
  trackingNumber: string,
  incomingShipmentItemId: string
) {
  return createCustomerNotification(tenantId, customerProfileId, {
    title: 'Package Arrived',
    message: `Your package with tracking number ${trackingNumber} has arrived at our warehouse and is being processed.`,
    notificationType: 'package_assigned',
    referenceType: 'incoming_shipment_item',
    referenceId: incomingShipmentItemId,
    detailPageUrl: `/dashboard/packages?filter=incoming`,
    metadata: {
      trackingNumber,
      status: 'assigned'
    }
  });
}

export async function notifyPackageReceived(
  tenantId: string,
  customerProfileId: string,
  packageId: string,
  internalId: string
) {
  return createCustomerNotification(tenantId, customerProfileId, {
    title: 'Package Ready to Ship',
    message: `Your package ${internalId} has been fully processed and is ready for shipping.`,
    notificationType: 'package_received',
    referenceType: 'package',
    referenceId: packageId,
    detailPageUrl: `/dashboard/packages/${packageId}`,
    metadata: {
      internalId,
      status: 'ready_to_ship'
    }
  });
}

export async function notifyPackageStatusChange(
  tenantId: string,
  customerProfileId: string,
  packageId: string,
  internalId: string,
  newStatus: string,
  notes?: string
) {
  const statusMessages = {
    'received': 'Your package has been received and processed.',
    'ready_to_ship': 'Your package is ready for shipping.',
    'shipped': 'Your package has been shipped.',
    'on_hold': 'Your package is temporarily on hold.',
    'processing': 'Your package is being processed.',
  };

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 
    `Your package status has been updated to ${newStatus.replace('_', ' ')}.`;

  return createCustomerNotification(tenantId, customerProfileId, {
    title: 'Package Status Update',
    message: notes ? `${message} ${notes}` : message,
    notificationType: 'package_status_change',
    referenceType: 'package',
    referenceId: packageId,
    detailPageUrl: `/dashboard/packages/${packageId}`,
    metadata: {
      internalId,
      newStatus,
      notes
    }
  });
}