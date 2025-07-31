// features/packages/db/queries/packages/get-package-statistics.query.ts

import { db } from '@/lib/db';
import { packages, warehouses } from '@/lib/db/schema';
import { sql, count, eq, gte, lte, and } from 'drizzle-orm';
import type { PackageStatistics, PackageStatus } from '@/features/packages/types/package.types';

export async function getPackageStatistics(): Promise<PackageStatistics> {
  try {
    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(packages);

    // Get counts by status
    const statusCounts = await db
      .select({
        status: packages.status,
        count: count(),
      })
      .from(packages)
      .groupBy(packages.status);

    // Get counts by warehouse
    const warehouseCounts = await db
      .select({
        warehouseId: packages.warehouseId,
        warehouseName: warehouses.name,
        count: count(),
      })
      .from(packages)
      .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .groupBy(packages.warehouseId, warehouses.name);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await db
      .select({
        date: sql<string>`DATE(${packages.createdAt})`,
        received: sql<number>`COUNT(CASE WHEN ${packages.status} = 'received' THEN 1 END)`,
        shipped: sql<number>`COUNT(CASE WHEN ${packages.status} = 'shipped' THEN 1 END)`,
      })
      .from(packages)
      .where(gte(packages.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${packages.createdAt})`)
      .orderBy(sql`DATE(${packages.createdAt})`);

    // Get special counts
    const [specialCounts] = await db
      .select({
        highValue: sql<number>`COUNT(CASE WHEN ${packages.isHighValue} = true THEN 1 END)`,
        fragile: sql<number>`COUNT(CASE WHEN ${packages.isFragile} = true THEN 1 END)`,
        restricted: sql<number>`COUNT(CASE WHEN ${packages.isRestricted} = true THEN 1 END)`,
      })
      .from(packages);

    // Get storage alerts (packages nearing storage expiry - within 7 days)
    const storageAlertDate = new Date();
    storageAlertDate.setDate(storageAlertDate.getDate() + 7);

    const [storageAlerts] = await db
      .select({ count: count() })
      .from(packages)
      .where(
        and(
          lte(packages.storageExpiresAt, storageAlertDate),
          gte(packages.storageExpiresAt, new Date())
        )
      );

    // Calculate average processing time (from received to ready_to_ship)
    const processingTimes = await db
      .select({
        processingHours: sql<number>`EXTRACT(EPOCH FROM (${packages.readyToShipAt} - ${packages.receivedAt})) / 3600`,
      })
      .from(packages)
      .where(
        and(
          eq(packages.status, 'ready_to_ship'),
          sql`${packages.receivedAt} IS NOT NULL`,
          sql`${packages.readyToShipAt} IS NOT NULL`
        )
      );

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time.processingHours, 0) / processingTimes.length
      : 0;

    // Build status counts object with all possible statuses
    const statusCountMap: Record<PackageStatus, number> = {
      'expected': 0,
      'received': 0,
      'processing': 0,
      'ready_to_ship': 0,
      'shipped': 0,
      'delivered': 0,
      'returned': 0,
      'disposed': 0,
      'missing': 0,
      'damaged': 0,
      'held': 0,
    };

    // Fill in actual counts
    statusCounts.forEach(({ status, count }) => {
      if (status in statusCountMap) {
        statusCountMap[status as PackageStatus] = count;
      }
    });

    // Build warehouse counts array
    const warehouseStats = warehouseCounts.map(wc => ({
      warehouseId: wc.warehouseId || 'unassigned',
      warehouseName: wc.warehouseName || 'Unassigned',
      count: wc.count,
    }));

    // Build recent activity array with proper date formatting
    const activityStats = recentActivity.map(activity => ({
      date: activity.date,
      received: activity.received,
      shipped: activity.shipped,
    }));

    const statistics: PackageStatistics = {
      total: totalResult.total,
      byStatus: statusCountMap,
      byWarehouse: warehouseStats,
      recentActivity: activityStats,
      highValue: specialCounts.highValue,
      fragile: specialCounts.fragile,
      restricted: specialCounts.restricted,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100, // Round to 2 decimal places
      storageAlerts: storageAlerts.count,
    };

    return statistics;

  } catch (error) {
    console.error('Error fetching package statistics:', error);
    throw error;
  }
}