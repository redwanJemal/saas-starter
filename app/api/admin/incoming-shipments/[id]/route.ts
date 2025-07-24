// app/api/admin/incoming-shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { incomingShipments, incomingShipmentItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const shipmentId = params.id;

    // Get shipment details with related data
    const [shipmentDetails] = await db
      .select({
        id: incomingShipments.id,
        batchReference: incomingShipments.batchReference,
        courierId: incomingShipments.courierId,
        courierName: incomingShipments.courierName,
        arrivalDate: incomingShipments.arrivalDate,
        status: incomingShipments.status,
        receivedBy: incomingShipments.receivedBy,
        receivedAt: incomingShipments.receivedAt,
        notes: incomingShipments.notes,
        createdAt: incomingShipments.createdAt,
        updatedAt: incomingShipments.updatedAt,
      })
      .from(incomingShipments)
      .where(eq(incomingShipments.id, shipmentId))
      .limit(1);

    if (!shipmentDetails) {
      return NextResponse.json(
        { error: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    // Get scan statistics
    const [scanStats] = await db
      .select({
        totalScanned: sql<number>`count(*)`,
        totalAssigned: sql<number>`count(*) filter (where assignment_status = 'assigned')`,
        totalUnassigned: sql<number>`count(*) filter (where assignment_status = 'unassigned')`,
      })
      .from(incomingShipmentItems)
      .where(eq(incomingShipmentItems.incomingShipmentId, shipmentId));

    return NextResponse.json({
      shipment: shipmentDetails,
      statistics: {
        totalScanned: scanStats.totalScanned || 0,
        totalAssigned: scanStats.totalAssigned || 0,
        totalUnassigned: scanStats.totalUnassigned || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching incoming shipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incoming shipment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');

    const body = await request.json();
    const { status, scanCompletedAt, manifestFileUrl } = body;
    const shipmentId = (await params).id;

    console.log('🔄 PATCH incoming shipment:', { shipmentId, status, scanCompletedAt });

    // Verify shipment exists
    const [existingShipment] = await db
      .select({ 
        id: incomingShipments.id,
        status: incomingShipments.status,
        batchReference: incomingShipments.batchReference
      })
      .from(incomingShipments)
      .where(eq(incomingShipments.id, shipmentId))
      .limit(1);

    if (!existingShipment) {
      console.error('❌ Shipment not found:', shipmentId);
      return NextResponse.json(
        { error: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found existing shipment:', existingShipment);

    // Prepare update data with proper typing
    const updateData: Record<string, any> = {
      updatedAt: sql`now()`
    };

    console.log('📝 Update data:', updateData);

    // Update the shipment
    const [updatedShipment] = await db
      .update(incomingShipments)
      .set(updateData)
      .where(eq(incomingShipments.id, shipmentId))
      .returning({
        id: incomingShipments.id,
        batchReference: incomingShipments.batchReference,
        status: incomingShipments.status,
        processedAt: incomingShipments.processedAt,
        updatedAt: incomingShipments.updatedAt,
      });

    console.log('✅ Updated shipment:', updatedShipment);

    // If status changed to 'scanned', get scan statistics
    let statistics = null;
    if (status === 'scanned') {
      const [scanStats] = await db
        .select({
          totalScanned: sql<number>`count(*)`,
          totalAssigned: sql<number>`count(*) filter (where assignment_status = 'assigned')`,
          totalUnassigned: sql<number>`count(*) filter (where assignment_status = 'unassigned')`,
        })
        .from(incomingShipmentItems)
        .where(eq(incomingShipmentItems.incomingShipmentId, shipmentId));

      statistics = {
        totalScanned: scanStats.totalScanned || 0,
        totalAssigned: scanStats.totalAssigned || 0,
        totalUnassigned: scanStats.totalUnassigned || 0,
      };

      console.log('📊 Scan statistics:', statistics);
    }

    return NextResponse.json({
      message: 'Incoming shipment updated successfully',
      shipment: updatedShipment,
      statistics,
    });

  } catch (error) {
    console.error('❌ Error updating incoming shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update incoming shipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    await requirePermission('packages.manage');

    const shipmentId = params.id;

    // Verify shipment exists and check if it can be deleted
    const [existingShipment] = await db
      .select({ 
        id: incomingShipments.id,
        status: incomingShipments.status 
      })
      .from(incomingShipments)
      .where(eq(incomingShipments.id, shipmentId))
      .limit(1);

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    // Check if shipment has scanned items
    const [itemCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .where(eq(incomingShipmentItems.incomingShipmentId, shipmentId));

    if (itemCount.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete shipment with scanned items' },
        { status: 409 }
      );
    }

    // Delete the shipment (items will be deleted automatically due to CASCADE)
    await db
      .delete(incomingShipments)
      .where(eq(incomingShipments.id, shipmentId));

    return NextResponse.json({
      message: 'Incoming shipment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting incoming shipment:', error);
    return NextResponse.json(
      { error: 'Failed to delete incoming shipment' },
      { status: 500 }
    );
  }
}