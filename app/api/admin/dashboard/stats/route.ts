// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages } from '@/lib/db/schema/packages';
import { personalShopperRequests } from '@/lib/db/schema/personal-shopping';
import { shipments } from '@/lib/db/schema/shipments';
import { users } from '@/lib/db/schema/users';
import { count, eq, and, gte, sum, lte } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { customerProfiles } from '@/lib/db/schema/customers';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('dashboard.view');

    // Get current date for monthly calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Package statistics - using separate counts with filters
    const packageCounts = await Promise.all([
      db.select({ count: count() }).from(packages),
      db.select({ count: count() }).from(packages).where(eq(packages.status, 'received')),
      db.select({ count: count() }).from(packages).where(eq(packages.status, 'ready_to_ship')),
      db.select({ count: count() }).from(packages).where(eq(packages.status, 'shipped')),
      db.select({ count: count() }).from(packages).where(eq(packages.status, 'expected')),
    ]);

    // Personal shopping statistics
    const personalShoppingCounts = await Promise.all([
      db.select({ count: count() }).from(personalShopperRequests),
      db.select({ count: count() }).from(personalShopperRequests).where(eq(personalShopperRequests.status, 'submitted')),
      db.select({ count: count() }).from(personalShopperRequests).where(eq(personalShopperRequests.status, 'quoted')),
      db.select({ count: count() }).from(personalShopperRequests).where(eq(personalShopperRequests.status, 'approved')),
      db.select({ count: count() }).from(personalShopperRequests).where(eq(personalShopperRequests.status, 'purchasing')),
    ]);

    // Shipment statistics
    const shipmentCounts = await Promise.all([
      db.select({ count: count() }).from(shipments),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, 'processing')),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, 'dispatched')),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, 'delivered')),
    ]);

    // Customer statistics
    const customerCounts = await Promise.all([
      db.select({ count: count() })
        .from(customerProfiles)
        .innerJoin(users, eq(customerProfiles.userId, users.id)),
      db.select({ count: count() })
        .from(customerProfiles)
        .innerJoin(users, eq(customerProfiles.userId, users.id))
        .where(gte(users.createdAt, firstDayOfMonth)),
    ]);

    // Financial statistics
    const financialStats = await Promise.all([
      db.select({ revenue: sum(shipments.totalCost) })
        .from(shipments)
        .where(gte(shipments.createdAt, firstDayOfMonth)),
      db.select({ pending: sum(shipments.totalCost) })
        .from(shipments),
    ]);

    return NextResponse.json({
      packages: {
        total: packageCounts[0][0]?.count || 0,
        received: packageCounts[1][0]?.count || 0,
        readyToShip: packageCounts[2][0]?.count || 0,
        shipped: packageCounts[3][0]?.count || 0,
        pending: packageCounts[4][0]?.count || 0,
      },
      personalShopping: {
        total: personalShoppingCounts[0][0]?.count || 0,
        pending: personalShoppingCounts[1][0]?.count || 0,
        quoted: personalShoppingCounts[2][0]?.count || 0,
        paid: personalShoppingCounts[3][0]?.count || 0,
        purchasing: personalShoppingCounts[4][0]?.count || 0,
      },
      shipments: {
        total: shipmentCounts[0][0]?.count || 0,
        processing: shipmentCounts[1][0]?.count || 0,
        dispatched: shipmentCounts[2][0]?.count || 0,
        delivered: shipmentCounts[3][0]?.count || 0,
      },
      customers: {
        total: customerCounts[0][0]?.count || 0,
        active: customerCounts[0][0]?.count || 0, // Same as total since no status field
        newThisMonth: customerCounts[1][0]?.count || 0,
      },
      financial: {
        monthlyRevenue: Number(financialStats[0][0]?.revenue) || 0,
        pendingPayments: (Number(financialStats[1][0]?.pending) || 0) / 10,
        currency: 'USD',
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}