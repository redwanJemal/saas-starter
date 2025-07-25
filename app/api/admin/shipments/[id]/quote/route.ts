// app/api/admin/shipments/[id]/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permissions
    const adminUser = await requirePermission('shipments.manage');
    
    const { id: shipmentId } = await params;
    const body = await request.json();
    
    const {
      carrierCode,
      carrierName,
      serviceType,
      trackingNumber,
      shippingCost,
      insuranceCost = 0,
      handlingFee = 0,
      storageFee = 0,
      costCurrency = 'USD',
      estimatedDeliveryDays,
      notes
    } = body;

    // Validate required fields
    if (!carrierCode || !carrierName || !shippingCost) {
      return NextResponse.json(
        { error: 'Carrier code, name, and shipping cost are required' },
        { status: 400 }
      );
    }

    // Get shipment to verify it exists and is in quote_requested status
    const [existingShipment] = await db
      .select({
        id: shipments.id,
        status: shipments.status,
        shipmentNumber: shipments.shipmentNumber,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    if (existingShipment.status !== 'quote_requested') {
      return NextResponse.json(
        { error: 'Shipment is not in quote_requested status' },
        { status: 400 }
      );
    }

    // Calculate total cost
    const totalCost = parseFloat(shippingCost) + 
                     parseFloat(insuranceCost) + 
                     parseFloat(handlingFee) + 
                     parseFloat(storageFee);

    // Calculate quote expiry (7 days from now)
    const quoteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Calculate estimated delivery date if provided
    let estimatedDeliveryDate = null;
    if (estimatedDeliveryDays) {
      estimatedDeliveryDate = new Date(Date.now() + estimatedDeliveryDays * 24 * 60 * 60 * 1000);
    }

    // Update shipment with quote details
    const [updatedShipment] = await db
      .update(shipments)
      .set({
        carrierCode,
        serviceType,
        trackingNumber: trackingNumber || null,
        shippingCost: shippingCost.toString(),
        insuranceCost: insuranceCost.toString(),
        handlingFee: handlingFee.toString(),
        storageFee: storageFee.toString(),
        totalCost: totalCost.toString(),
        costCurrency,
        status: 'quoted',
        quoteExpiresAt,
        estimatedDeliveryDate: estimatedDeliveryDate?.toISOString(),
        processedBy: adminUser.id,
        updatedAt: new Date()
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    // TODO: Send notification to customer about quote ready
    // await sendNotification(shipment.customerProfileId, 'quote_ready', ...)

    return NextResponse.json({
      message: 'Quote generated successfully',
      shipment: updatedShipment,
      quote: {
        carrierCode,
        carrierName,
        serviceType,
        trackingNumber,
        costs: {
          shipping: parseFloat(shippingCost),
          insurance: parseFloat(insuranceCost),
          handling: parseFloat(handlingFee),
          storage: parseFloat(storageFee),
          total: totalCost,
          currency: costCurrency,
        },
        estimatedDeliveryDays,
        quoteExpiresAt: quoteExpiresAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}