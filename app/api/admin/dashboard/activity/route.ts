// app/api/admin/dashboard/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, packageStatusHistory } from '@/lib/db/schema/packages';
import { personalShopperRequests, personalShopperRequestStatusHistory } from '@/lib/db/schema/personal-shopping';
import { shipments, shipmentStatusHistory } from '@/lib/db/schema/shipments';
import { users } from '@/lib/db/schema/users';
import { eq, desc, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { customerProfiles } from '@/lib/db/schema/customers';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('dashboard.view');

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get recent package activities
    const packageActivities = await db
      .select({
        id: packageStatusHistory.id,
        type: sql<string>`'package'`.as('type'),
        title: sql<string>`'Package ' || ${packages.internalId}`.as('title'),
        description: sql<string>`CASE 
          WHEN ${packageStatusHistory.status} = 'received' THEN 'Package received at warehouse'
          WHEN ${packageStatusHistory.status} = 'ready_to_ship' THEN 'Package ready to ship'
          WHEN ${packageStatusHistory.status} = 'shipped' THEN 'Package shipped'
          WHEN ${packageStatusHistory.status} = 'expected' THEN 'Package expected'
          ELSE 'Status updated to ' || ${packageStatusHistory.status}
        END`.as('description'),
        timestamp: packageStatusHistory.createdAt,
        status: packageStatusHistory.status,
        href: sql<string>`'/admin/packages/' || ${packages.id}`.as('href'),
      })
      .from(packageStatusHistory)
      .innerJoin(packages, eq(packageStatusHistory.packageId, packages.id))
      .orderBy(desc(packageStatusHistory.createdAt))
      .limit(limit);

    // Get recent personal shopping activities
    const personalShoppingActivities = await db
      .select({
        id: personalShopperRequestStatusHistory.id,
        type: sql<string>`'personal_shopping'`.as('type'),
        title: sql<string>`'Shopping Request ' || ${personalShopperRequests.requestNumber}`.as('title'),
        description: sql<string>`CASE 
          WHEN ${personalShopperRequestStatusHistory.status} = 'submitted' THEN 'New shopping request submitted'
          WHEN ${personalShopperRequestStatusHistory.status} = 'quoted' THEN 'Quote provided for request'
          WHEN ${personalShopperRequestStatusHistory.status} = 'approved' THEN 'Request approved by customer'
          WHEN ${personalShopperRequestStatusHistory.status} = 'purchasing' THEN 'Items being purchased'
          WHEN ${personalShopperRequestStatusHistory.status} = 'purchased' THEN 'Items purchased'
          WHEN ${personalShopperRequestStatusHistory.status} = 'received' THEN 'Items received at warehouse'
          ELSE 'Status updated to ' || ${personalShopperRequestStatusHistory.status}
        END`.as('description'),
        timestamp: personalShopperRequestStatusHistory.createdAt,
        status: personalShopperRequestStatusHistory.status,
        href: sql<string>`'/admin/personal-shopping/' || ${personalShopperRequests.id}`.as('href'),
      })
      .from(personalShopperRequestStatusHistory)
      .innerJoin(personalShopperRequests, eq(personalShopperRequestStatusHistory.personalShopperRequestId, personalShopperRequests.id))
      .orderBy(desc(personalShopperRequestStatusHistory.createdAt))
      .limit(limit);

    // Get recent shipment activities
    const shipmentActivities = await db
      .select({
        id: shipmentStatusHistory.id,
        type: sql<string>`'shipment'`.as('type'),
        title: sql<string>`'Shipment ' || ${shipments.trackingNumber}`.as('title'),
        description: sql<string>`CASE 
          WHEN ${shipmentStatusHistory.status} = 'processing' THEN 'Shipment being processed'
          WHEN ${shipmentStatusHistory.status} = 'dispatched' THEN 'Shipment dispatched'
          WHEN ${shipmentStatusHistory.status} = 'delivered' THEN 'Shipment delivered'
          ELSE 'Status updated to ' || ${shipmentStatusHistory.status}
        END`.as('description'),
        timestamp: shipmentStatusHistory.createdAt,
        status: shipmentStatusHistory.status,
        href: sql<string>`'/admin/shipments/' || ${shipments.id}`.as('href'),
      })
      .from(shipmentStatusHistory)
      .innerJoin(shipments, eq(shipmentStatusHistory.shipmentId, shipments.id))
      .orderBy(desc(shipmentStatusHistory.createdAt))
      .limit(limit);

    // Get recent customer activities
    const customerActivities = await db
      .select({
        id: users.id,
        type: sql<string>`'customer'`.as('type'),
        title: sql<string>`'Customer ' || ${users.firstName} || ' ' || ${users.lastName}`.as('title'),
        description: sql<string>`'New customer registered'`.as('description'),
        timestamp: users.createdAt,
        status: sql<string>`'new'`.as('status'),
        href: sql<string>`'/admin/customers/' || ${customerProfiles.id}`.as('href'),
      })
      .from(users)
      .innerJoin(customerProfiles, eq(users.id, customerProfiles.userId))
      .orderBy(desc(users.createdAt))
      .limit(limit);

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...packageActivities,
      ...personalShoppingActivities,
      ...shipmentActivities,
      ...customerActivities,
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(activity => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      }));

    return NextResponse.json({
      activities: allActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard activity' },
      { status: 500 }
    );
  }
}
