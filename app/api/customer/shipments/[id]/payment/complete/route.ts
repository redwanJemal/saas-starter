// app/api/customer/shipments/[id]/payment/complete/route.ts

import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  packages, 
  shipmentPackages,
  financialInvoices as invoices,
  financialInvoiceLines as invoiceLineItems
} from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';
import { generateInvoiceNumber } from '@/lib/utils/id-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = params.id;
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
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
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        customerProfileId: shipments.customerProfileId,
        tenantId: shipments.tenantId
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

    // Start transaction to update shipment and create invoice
    const now = new Date();

    // Update shipment status to paid
    const [updatedShipment] = await db
      .update(shipments)
      .set({
        status: 'paid',
        paidAt: now,
        updatedAt: now
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    // Update package statuses to 'shipped'
    await db
      .update(packages)
      .set({
        status: 'shipped',
        updatedAt: now
      })
      .where(
        eq(packages.id, 
          db.select({ packageId: shipmentPackages.packageId })
            .from(shipmentPackages)
            .where(eq(shipmentPackages.shipmentId, shipmentId))
        )
      );

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create financial invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        tenantId: shipment.tenantId,
        customerProfileId: shipment.customerProfileId,
        invoiceNumber,
        invoiceType: 'shipping',
        subtotal: shipment.totalCost || '0.00',
        totalAmount: shipment.totalCost || '0.00',
        currencyCode: shipment.costCurrency || 'USD',
        paymentStatus: 'paid',
        issuedAt: now,
        paidAt: now,
        paymentMethod: 'stripe',
        paymentReference: paymentIntentId,
        shipmentId: shipment.id,
        notes: `Payment completed via Stripe on ${now.toLocaleDateString()}`
      })
      .returning();

    // Create invoice line items
    const lineItems = [];

    // Shipping cost line item
    if (parseFloat(shipment.shippingCost || '0') > 0) {
      const unitPrice = shipment.shippingCost || '0.00';
      lineItems.push({
        invoiceId: newInvoice.id,
        description: 'Shipping Cost',
        quantity: '1.000',
        unitPrice: unitPrice,
        lineTotal: unitPrice,
        referenceType: 'shipment',
        referenceId: shipment.id
      });
    }

    // Insurance cost line item
    if (parseFloat(shipment.insuranceCost || '0') > 0) {
      const unitPrice = shipment.insuranceCost || '0.00';
      lineItems.push({
        invoiceId: newInvoice.id,
        description: 'Insurance',
        quantity: '1.000',
        unitPrice: unitPrice,
        lineTotal: unitPrice,
        referenceType: 'shipment',
        referenceId: shipment.id
      });
    }

    // Handling fee line item
    if (parseFloat(shipment.handlingFee || '0') > 0) {
      const unitPrice = shipment.handlingFee || '0.00';
      lineItems.push({
        invoiceId: newInvoice.id,
        description: 'Handling Fee',
        quantity: '1.000',
        unitPrice: unitPrice,
        lineTotal: unitPrice,
        referenceType: 'shipment',
        referenceId: shipment.id
      });
    }

    // Storage fee line item with breakdown
    if (parseFloat(shipment.storageFee || '0') > 0) {
      // Get package count for storage description
      const packageCountQuery = await db
        .select({ count: count() })
        .from(shipmentPackages)
        .where(eq(shipmentPackages.shipmentId, shipmentId));
      
      const packageCount = packageCountQuery[0]?.count || 1;
      const unitPrice = (parseFloat(shipment.storageFee || '0') / packageCount).toFixed(2);
      const totalPrice = shipment.storageFee || '0.00';
      
      lineItems.push({
        invoiceId: newInvoice.id,
        description: `Storage Fee (${packageCount} package${packageCount > 1 ? 's' : ''})`,
        quantity: packageCount.toString(),
        unitPrice: unitPrice,
        lineTotal: totalPrice,
        referenceType: 'storage',
        referenceId: shipment.id
      });
    }

    // Insert all line items
    if (lineItems.length > 0) {
      await db.insert(invoiceLineItems).values(lineItems);
    }

    // TODO: Send notification emails
    // - Payment confirmation to customer
    // - Shipment ready for processing to warehouse staff

    // TODO: Create shipping label request for warehouse
    // - This could be an automated process or require manual processing

    // Prepare response with updated shipment details
    const responseData = {
      success: true,
      message: 'Payment completed successfully',
      shipment: {
        id: updatedShipment.id,
        shipmentNumber: updatedShipment.shipmentNumber,
        status: updatedShipment.status,
        paidAt: updatedShipment.paidAt?.toISOString(),
        totalCost: parseFloat(updatedShipment.totalCost || '0'),
        currency: updatedShipment.costCurrency || 'USD'
      },
      invoice: {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        totalAmount: parseFloat(newInvoice.totalAmount || '0'),
        currency: newInvoice.currencyCode,
        issuedAt: newInvoice.issuedAt?.toISOString(),
        paidAt: newInvoice.paidAt?.toISOString()
      },
      payment: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert cents back to currency
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status
      },
      nextSteps: [
        'shipment_processing',
        'label_generation',
        'warehouse_pickup'
      ]
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error completing payment:', error);
    
    // If we get here, something went wrong after payment was successful
    // We should log this for manual review but still return success to avoid double-charging
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        warning: 'This payment has already been completed'
      });
    }

    return NextResponse.json(
      { error: 'Failed to complete payment processing' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = params.id;
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    // Get shipment payment status
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        paidAt: shipments.paidAt,
        quoteExpiresAt: shipments.quoteExpiresAt
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

    // If payment intent ID is provided, check Stripe status
    let paymentStatus = null;
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        paymentStatus = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          created: new Date(paymentIntent.created * 1000).toISOString()
        };
      } catch (stripeError) {
        console.error('Error retrieving payment intent:', stripeError);
      }
    }

    return NextResponse.json({
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        totalCost: parseFloat(shipment.totalCost || '0'),
        currency: shipment.costCurrency || 'USD',
        paidAt: shipment.paidAt?.toISOString(),
        isPaid: shipment.status === 'paid' || shipment.paidAt !== null,
        isQuoteExpired: shipment.quoteExpiresAt ? new Date() > new Date(shipment.quoteExpiresAt) : false
      },
      paymentStatus
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}