// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, shipments, customerProfiles, financialInvoices } from '@/lib/db/schema';
import { desc, eq, gte, sql } from 'drizzle-orm';
import { requireAdminUser } from '@/lib/auth/admin';

export async function GET() {
  try {
    // Check admin authentication
    await requireAdminUser();

    // Get current date for monthly calculations
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Total packages this month and last month
    const [currentMonthPackages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(gte(packages.createdAt, startOfMonth));

    const [lastMonthPackages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(
        sql`${packages.createdAt} >= ${startOfLastMonth} AND ${packages.createdAt} <= ${endOfLastMonth}`
      );

    // Total active customers
    const [totalCustomers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerProfiles);

    // Active shipments (not delivered or cancelled)
    const [activeShipments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(sql`${shipments.status} NOT IN ('delivered', 'cancelled', 'refunded')`);

    // Monthly revenue
    const [currentMonthRevenue] = await db
      .select({ total: sql<number>`COALESCE(sum(${financialInvoices.totalAmount}), 0)` })
      .from(financialInvoices)
      .where(
        sql`${financialInvoices.paymentStatus} = 'paid' AND ${financialInvoices.paidAt} >= ${startOfMonth}`
      );

    const [lastMonthRevenue] = await db
      .select({ total: sql<number>`COALESCE(sum(${financialInvoices.totalAmount}), 0)` })
      .from(financialInvoices)
      .where(
        sql`${financialInvoices.paymentStatus} = 'paid' AND ${financialInvoices.paidAt} >= ${startOfLastMonth} AND ${financialInvoices.paidAt} <= ${endOfLastMonth}`
      );

    // Calculate percentage changes
    const packagesChange = lastMonthPackages.count > 0 
      ? ((currentMonthPackages.count - lastMonthPackages.count) / lastMonthPackages.count) * 100 
      : 0;

    const revenueChange = lastMonthRevenue.total > 0 
      ? ((currentMonthRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total) * 100 
      : 0;

    const stats = {
      totalPackages: currentMonthPackages.count,
      packagesChange: Math.round(packagesChange * 10) / 10,
      totalCustomers: totalCustomers.count,
      customersChange: 8.3, // TODO: Calculate actual customer growth
      activeShipments: activeShipments.count,
      shipmentsChange: -2.1, // TODO: Calculate actual shipment change
      monthlyRevenue: currentMonthRevenue.total,
      revenueChange: Math.round(revenueChange * 10) / 10,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}