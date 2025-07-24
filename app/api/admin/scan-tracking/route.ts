// app/api/admin/scan-tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { incomingShipments, incomingShipmentItems, couriers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create');

    const body = await request.json();
    const { incomingShipmentId, trackingNumbers } = body;

    // Validate required fields
    if (!incomingShipmentId || !trackingNumbers || !Array.isArray(trackingNumbers)) {
      return NextResponse.json(
        { error: 'Incoming shipment ID and tracking numbers array are required' },
        { status: 400 }
      );
    }

    // Verify incoming shipment exists and get courier info
    const [shipment] = await db
      .select({
        id: incomingShipments.id,
        courierId: incomingShipments.courierId,
        trackingUrlTemplate: couriers.trackingUrlTemplate,
      })
      .from(incomingShipments)
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(eq(incomingShipments.id, incomingShipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json(
        { error: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    // Prepare items for bulk insert
    const itemsToInsert = trackingNumbers
      .filter((trackingNumber: string) => trackingNumber.trim()) // Remove empty entries
      .map((trackingNumber: string) => {
        const courierTrackingUrl = shipment.trackingUrlTemplate
          ? shipment.trackingUrlTemplate.replace('{tracking_number}', trackingNumber.trim())
          : null;

        return {
          incomingShipmentId,
          trackingNumber: trackingNumber.trim(),
          courierTrackingUrl,
          scannedBy: adminUser.id,
          assignmentStatus: 'unassigned' as const,
        };
      });

    if (itemsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No valid tracking numbers provided' },
        { status: 400 }
      );
    }

    // Insert tracking numbers in bulk
    const insertedItems = await db
      .insert(incomingShipmentItems)
      .values(itemsToInsert)
      .returning();

    // Update shipment status to 'scanning' if it's currently 'pending'
    await db
      .update(incomingShipments)
      .set({ 
        status: 'scanning',
        updatedAt: sql`now()`,
      })
      .where(
        sql`${incomingShipments.id} = ${incomingShipmentId} AND ${incomingShipments.status} = 'pending'`
      );

    return NextResponse.json({
      message: `Successfully scanned ${insertedItems.length} tracking numbers`,
      items: insertedItems,
    }, { status: 201 });

  } catch (error) {
    console.error('Error scanning tracking numbers:', error);
    return NextResponse.json(
      { error: 'Failed to scan tracking numbers' },
      { status: 500 }
    );
  }
}

// Get unassigned tracking numbers for assignment
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.update');

    const searchParams = request.nextUrl.searchParams;
    const incomingShipmentId = searchParams.get('incoming_shipment_id');
    const assignmentStatus = searchParams.get('assignment_status') || 'unassigned';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [
      eq(incomingShipmentItems.assignmentStatus, assignmentStatus as any)
    ];

    if (incomingShipmentId) {
      whereConditions.push(eq(incomingShipmentItems.incomingShipmentId, incomingShipmentId));
    }

    if (search) {
      whereConditions.push(
        sql`${incomingShipmentItems.trackingNumber} ILIKE ${`%${search}%`}`
      );
    }

    // Combine conditions
    const whereClause = whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`);

    // Get tracking items with shipment info
    const items = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedAt: incomingShipmentItems.scannedAt,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        assignedAt: incomingShipmentItems.assignedAt,
        batchReference: incomingShipments.batchReference,
        courierName: couriers.name,
      })
      .from(incomingShipmentItems)
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(whereClause)
      .orderBy(incomingShipmentItems.scannedAt)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .where(whereClause);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching tracking items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking items' },
      { status: 500 }
    );
  }
}