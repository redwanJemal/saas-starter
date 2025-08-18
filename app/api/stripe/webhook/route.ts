// app/api/stripe/webhook/route.ts

import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, financialInvoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret. Please set STRIPE_WEBHOOK_SECRET environment variable.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  const shipmentId = paymentIntent.metadata.shipmentId;
  if (shipmentId) {
    try {
      // Update shipment status to indicate successful payment
      await db
        .update(shipments)
        .set({
          status: 'paid', // Initial status after payment succeeds
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          paymentReference: paymentIntent.id,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));

      console.log(`Shipment ${shipmentId} marked as paid`);

      // Note: Full payment completion will be handled when customer calls
      // the /payment/complete endpoint, which will verify and move to 'payment_completed'
    } catch (error) {
      console.error('Error updating shipment after payment success:', error);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const shipmentId = paymentIntent.metadata.shipmentId;
  if (shipmentId) {
    try {
      // Reset shipment to quoted status so customer can try again
      await db
        .update(shipments)
        .set({
          status: 'quoted',
          stripePaymentIntentId: paymentIntent.id, // Keep track of the failed payment intent
          paymentMethod: null,
          paymentReference: null,
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));

      console.log(`Shipment ${shipmentId} reset to quoted after payment failure`);
    } catch (error) {
      console.error('Error updating shipment after payment failure:', error);
    }
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  console.log('Charge disputed:', dispute.charge);

  // Find the payment intent associated with this charge
  const charge = await stripe.charges.retrieve(dispute.charge as string, {
    expand: ['payment_intent']
  });

  const paymentIntent = charge.payment_intent as Stripe.PaymentIntent;
  const shipmentId = paymentIntent?.metadata?.shipmentId;

  if (shipmentId) {
    try {
      // Mark shipment for review due to dispute
      await db
        .update(shipments)
        .set({
          status: 'cancelled', // or create a new 'disputed' status
          paymentMethod: 'stripe_disputed',
          paymentReference: dispute.id,
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));

      console.log(`Shipment ${shipmentId} marked as cancelled due to dispute`);
      
      // TODO: Notify admin team about the dispute
    } catch (error) {
      console.error('Error handling charge dispute:', error);
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  const paymentIntent = charge.payment_intent as Stripe.PaymentIntent;
  const shipmentId = paymentIntent?.metadata?.shipmentId;

  if (shipmentId) {
    try {
      await db
        .update(shipments)
        .set({
          status: 'refunded',
          paymentMethod: 'stripe_refunded',
          paymentReference: charge.id,
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));

      console.log(`Shipment ${shipmentId} marked as refunded`);
    } catch (error) {
      console.error('Error handling charge refund:', error);
    }
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent canceled:', paymentIntent.id);

  const shipmentId = paymentIntent.metadata.shipmentId;
  if (shipmentId) {
    try {
      // Reset to quoted status so customer can try payment again
      await db
        .update(shipments)
        .set({
          status: 'quoted',
          stripePaymentIntentId: paymentIntent.id, // Keep track of the canceled payment intent
          paymentMethod: null,
          paymentReference: null,
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));

      console.log(`Shipment ${shipmentId} reset to quoted after payment cancellation`);
    } catch (error) {
      console.error('Error updating shipment after payment cancellation:', error);
    }
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  const invoiceId = session.metadata?.invoice_id;
  if (invoiceId) {
    try {
      // Update invoice payment status
      await db
        .update(financialInvoices)
        .set({
          paymentStatus: 'paid',
          paidAmount: ((session.amount_total || 0) / 100).toFixed(2), // Convert from cents and format as string
          paymentMethod: 'card',
          paymentReference: session.payment_intent as string,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(financialInvoices.id, invoiceId));

      console.log(`Invoice ${invoiceId} marked as paid via checkout session`);

      // TODO: Send payment confirmation email
      
      // Update related shipment if applicable
      const shipmentId = session.metadata?.shipment_id;
      if (shipmentId) {
        await db
          .update(shipments)
          .set({
            status: 'paid',
            paymentMethod: 'stripe_checkout',
            stripePaymentIntentId: session.payment_intent as string,
            paymentReference: session.id,
            paidAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(shipments.id, shipmentId));

        console.log(`Shipment ${shipmentId} marked as paid via checkout session`);
      }
    } catch (error) {
      console.error('Error updating invoice after checkout completion:', error);
    }
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Checkout session expired:', session.id);

  const invoiceId = session.metadata?.invoice_id;
  if (invoiceId) {
    try {
      // Reset payment reference since session expired
      await db
        .update(financialInvoices)
        .set({
          paymentReference: null,
          updatedAt: new Date()
        })
        .where(eq(financialInvoices.id, invoiceId));

      console.log(`Invoice ${invoiceId} payment session expired - reference cleared`);
    } catch (error) {
      console.error('Error handling expired checkout session:', error);
    }
  }
}