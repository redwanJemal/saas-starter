// app/api/admin/shipments/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments } from '@/lib/db/schema';
import { shipmentStatusHistory } from '@/lib/db/schema/shipments';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { RouteContext } from '@/lib/utils/route';

export async function PATCH(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipments.manage');
    
    const shipmentId = (await RouteContext.params).id;
    const body = await request.json();
    const { status, notes, trackingNumber } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get current shipment
    const [currentShipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!currentShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'quote_requested': ['quoted', 'cancelled'],
      'quoted': ['paid', 'cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['dispatched', 'cancelled'],
      'dispatched': ['in_transit', 'returned'],
      'in_transit': ['out_for_delivery', 'returned'],
      'out_for_delivery': ['delivered', 'delivery_failed'],
      'delivery_failed': ['out_for_delivery', 'returned'],
      'delivered': [], // Terminal state
      'returned': ['processing'], // Can be reprocessed
      'cancelled': [], // Terminal state
      'refunded': [] // Terminal state
    };

    const allowedStatuses = validTransitions[currentShipment.status as string] || [];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: `Cannot transition from ${currentShipment.status} to ${status}`,
          allowedStatuses 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add tracking number if provided
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    // Set timestamps based on status
    switch (status) {
      case 'quoted':
        updateData.quotedAt = new Date();
        break;
      case 'paid':
        updateData.paidAt = new Date();
        break;
      case 'dispatched':
        updateData.dispatchedAt = new Date();
        break;
      case 'delivered':
        updateData.deliveredAt = new Date();
        break;
    }

    // Update shipment
    const [updatedShipment] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, shipmentId))
      .returning();

    // Add to status history
    await db.insert(shipmentStatusHistory).values({
      shipmentId: shipmentId,
      status: status,
      previousStatus: currentShipment.status,
      notes: notes || `Status changed from ${currentShipment.status} to ${status}`,
      changedBy: adminUser.id,
      changedAt: new Date(),
      trackingNumber: trackingNumber || undefined,
      carrierName: currentShipment.carrierCode || undefined,
    });

    // Send notifications based on status
    if (status === 'quoted') {
      // TODO: Send quote notification to customer
      console.log('TODO: Send quote notification to customer');
    } else if (status === 'dispatched') {
      // TODO: Send dispatch notification to customer
      console.log('TODO: Send dispatch notification to customer');
    } else if (status === 'delivered') {
      // TODO: Send delivery confirmation to customer
      console.log('TODO: Send delivery confirmation to customer');
    }

    return NextResponse.json({
      shipment: updatedShipment,
      message: `Shipment status updated to ${status}`,
    });

  } catch (error) {
    console.error('Error updating shipment status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipment status' },
      { status: 500 }
    );
  }
}