// lib/db/queries-customer-enhanced.ts
import { db } from '@/lib/db/drizzle';
import { 
  packages, 
  shipments, 
  incomingShipmentItems,
} from '@/lib/db/schema';
import { eq, count, and, sql } from 'drizzle-orm';

export async function getEnhancedCustomerDashboardStats(customerProfileId: string) {
  try {
    // Get total packages count
    const [totalPackagesResult] = await db
      .select({ count: count() })
      .from(packages)
      .where(eq(packages.customerProfileId, customerProfileId));

    // Get packages ready to ship
    const [packagesReadyResult] = await db
      .select({ count: count() })
      .from(packages)
      .where(
        and(
          eq(packages.customerProfileId, customerProfileId),
          eq(packages.status, 'ready_to_ship')
        )
      );

    // Get received packages (not yet ready to ship)
    const [packagesReceivedResult] = await db
      .select({ count: count() })
      .from(packages)
      .where(
        and(
          eq(packages.customerProfileId, customerProfileId),
          eq(packages.status, 'received')
        )
      );

    // Get incoming items (assigned but not yet processed)
    const [incomingItemsResult] = await db
      .select({ count: count() })
      .from(incomingShipmentItems)
      .where(
        and(
          eq(incomingShipmentItems.assignedCustomerProfileId, customerProfileId),
          eq(incomingShipmentItems.assignmentStatus, 'assigned')
        )
      );

    // Get shipments in transit
    const [shipmentsInTransitResult] = await db
      .select({ count: count() })
      .from(shipments)
      .where(
        and(
          eq(shipments.customerProfileId, customerProfileId),
          eq(shipments.status, 'in_transit')
        )
      );

    // Get delivered shipments
    const [shipmentsDeliveredResult] = await db
      .select({ count: count() })
      .from(shipments)
      .where(
        and(
          eq(shipments.customerProfileId, customerProfileId),
          eq(shipments.status, 'delivered')
        )
      );

    // Get total shipments
    const [totalShipmentsResult] = await db
      .select({ count: count() })
      .from(shipments)
      .where(eq(shipments.customerProfileId, customerProfileId));

    // Get packages by status for pie chart data
    const packagesByStatus = await db
      .select({
        status: packages.status,
        count: count()
      })
      .from(packages)
      .where(eq(packages.customerProfileId, customerProfileId))
      .groupBy(packages.status);

    // Get recent activity count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentPackagesResult] = await db
      .select({ count: count() })
      .from(packages)
      .where(
        and(
          eq(packages.customerProfileId, customerProfileId),
          sql`${packages.createdAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      );

    const [recentShipmentsResult] = await db
      .select({ count: count() })
      .from(shipments)
      .where(
        and(
          eq(shipments.customerProfileId, customerProfileId),
          sql`${shipments.createdAt} >= ${thirtyDaysAgo.toISOString()}`
        )
      );

    return {
      // Main stats
      totalPackages: totalPackagesResult?.count || 0,
      packagesReady: packagesReadyResult?.count || 0,
      packagesReceived: packagesReceivedResult?.count || 0,
      incomingItems: incomingItemsResult?.count || 0,
      shipmentsInTransit: shipmentsInTransitResult?.count || 0,
      shipmentsDelivered: shipmentsDeliveredResult?.count || 0,
      totalShipments: totalShipmentsResult?.count || 0,
      totalAddresses: 0,
      
      // Recent activity (last 30 days)
      recentPackages: recentPackagesResult?.count || 0,
      recentShipments: recentShipmentsResult?.count || 0,
      
      // Package status breakdown
      packagesByStatus: packagesByStatus.map(item => ({
        status: item.status,
        count: item.count,
        label: item.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
      }))
    };

  } catch (error) {
    console.error('Error fetching enhanced customer dashboard stats:', error);
    return {
      totalPackages: 0,
      packagesReady: 0,
      packagesReceived: 0,
      incomingItems: 0,
      shipmentsInTransit: 0,
      shipmentsDelivered: 0,
      totalShipments: 0,
      totalAddresses: 0,
      recentPackages: 0,
      recentShipments: 0,
      packagesByStatus: []
    };
  }
}

export async function getCustomerRecentPackages(customerProfileId: string, limit: number = 5) {
  try {
    const recentPackages = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        status: packages.status,
        senderName: packages.senderName,
        description: packages.description,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        receivedAt: packages.receivedAt,
        createdAt: packages.createdAt,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
      })
      .from(packages)
      .where(eq(packages.customerProfileId, customerProfileId))
      .orderBy(sql`${packages.createdAt} DESC`)
      .limit(limit);

    return recentPackages.map(pkg => ({
      id: pkg.id,
      internalId: pkg.internalId,
      trackingNumberInbound: pkg.trackingNumberInbound || '',
      status: pkg.status,
      senderName: pkg.senderName || '',
      description: pkg.description || '',
      estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0,
      estimatedValueCurrency: pkg.estimatedValueCurrency || 'USD',
      receivedAt: pkg.receivedAt?.toISOString() || null,
      createdAt: pkg.createdAt.toISOString(),
      isFragile: pkg.isFragile || false,
      isHighValue: pkg.isHighValue || false,
    }));

  } catch (error) {
    console.error('Error fetching customer recent packages:', error);
    return [];
  }
}

export async function getCustomerRecentIncomingItems(customerProfileId: string, limit: number = 5) {
  try {
    const recentItems = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        scannedAt: incomingShipmentItems.scannedAt,
        assignedAt: incomingShipmentItems.assignedAt,
        description: incomingShipmentItems.description,
        estimatedValue: incomingShipmentItems.estimatedValue,
        estimatedValueCurrency: incomingShipmentItems.estimatedValueCurrency,
        isFragile: incomingShipmentItems.isFragile,
        isHighValue: incomingShipmentItems.isHighValue,
      })
      .from(incomingShipmentItems)
      .where(
        and(
          eq(incomingShipmentItems.assignedCustomerProfileId, customerProfileId),
          eq(incomingShipmentItems.assignmentStatus, 'assigned')
        )
      )
      .orderBy(sql`${incomingShipmentItems.assignedAt} DESC`)
      .limit(limit);

    return recentItems.map(item => ({
      id: item.id,
      trackingNumber: item.trackingNumber || '',
      courierTrackingUrl: item.courierTrackingUrl || '',
      assignmentStatus: item.assignmentStatus,
      scannedAt: item.scannedAt?.toISOString() || null,
      assignedAt: item.assignedAt?.toISOString() || null,
      description: item.description || '',
      estimatedValue: item.estimatedValue ? parseFloat(item.estimatedValue) : 0,
      estimatedValueCurrency: item.estimatedValueCurrency || 'USD',
      isFragile: item.isFragile || false,
      isHighValue: item.isHighValue || false,
    }));

  } catch (error) {
    console.error('Error fetching customer recent incoming items:', error);
    return [];
  }
}