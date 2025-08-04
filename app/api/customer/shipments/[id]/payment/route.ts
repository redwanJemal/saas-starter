// app/api/customer/shipments/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { stripe } from '@/lib/payments/stripe';
import { RouteContext } from '@/lib/utils/route';

export async function POST(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = (await RouteContext.params).id;
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Validate that this payment belongs to this shipment
    if (paymentIntent.metadata.shipmentId !== shipmentId) {
      return NextResponse.json(
        { error: 'Payment intent does not match shipment' },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment was not successful' },
        { status: 400 }
      );
    }

    // Get current shipment to validate
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    // Validate shipment status
    if (shipment.status !== 'quoted') {
      return NextResponse.json(
        { error: 'Shipment is not in quoted status' },
        { status: 400 }
      );
    }

    // Validate payment amount matches shipment cost
    const shipmentCostCents = Math.round(parseFloat(shipment.totalCost || '0') * 100);
    if (paymentIntent.amount !== shipmentCostCents) {
      return NextResponse.json(
        { error: 'Payment amount does not match shipment cost' },
        { status: 400 }
      );
    }

    // Update shipment status to paid
    const [updatedShipment] = await db
      .update(shipments)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    return NextResponse.json({
      message: 'Payment confirmed successfully',
      shipment: {
        id: updatedShipment.id,
        shipmentNumber: updatedShipment.shipmentNumber,
        status: updatedShipment.status,
        paidAt: updatedShipment.paidAt,
      },
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

// Get payment status for a shipment
export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = (await RouteContext.params).id;

    // Get shipment payment status
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        paidAt: shipments.paidAt,
        quoteExpiresAt: shipments.quoteExpiresAt,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    return NextResponse.json({
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        totalCost: shipment.totalCost ? parseFloat(shipment.totalCost) : 0,
        costCurrency: shipment.costCurrency || 'USD',
        paidAt: shipment.paidAt,
        quoteExpiresAt: shipment.quoteExpiresAt,
        isPaid: shipment.status === 'paid' || shipment.status === 'processing' || 
               shipment.status === 'dispatched' || shipment.status === 'in_transit' ||
               shipment.status === 'delivered',
        canPay: shipment.status === 'quoted' && 
                (!shipment.quoteExpiresAt || new Date() <= new Date(shipment.quoteExpiresAt)),
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}