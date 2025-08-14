// app/api/customer/invoices/[id]/payment/route.ts

import { db } from '@/lib/db/drizzle';
import { financialInvoices } from '@/lib/db/schema';
import { stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';
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

    const invoiceId = (await RouteContext.params).id;

    // Get invoice details
    const invoiceQuery = await db
      .select({
        id: financialInvoices.id,
        invoiceNumber: financialInvoices.invoiceNumber,
        invoiceType: financialInvoices.invoiceType,
        paymentStatus: financialInvoices.paymentStatus,
        totalAmount: financialInvoices.totalAmount,
        paidAmount: financialInvoices.paidAmount,
        currencyCode: financialInvoices.currencyCode,
        dueDate: financialInvoices.dueDate,
      })
      .from(financialInvoices)
      .where(
        and(
          eq(financialInvoices.id, invoiceId),
          eq(financialInvoices.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (invoiceQuery.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceQuery[0];

    // Check if invoice is payable
    if (invoice.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    if (invoice.paymentStatus === 'cancelled') {
      return NextResponse.json(
        { error: 'Invoice is cancelled' },
        { status: 400 }
      );
    }

    // Calculate balance due
    const totalAmount = parseFloat(invoice.totalAmount || '0');
    const paidAmount = parseFloat(invoice.paidAmount || '0');
    const balanceDue = totalAmount - paidAmount;

    if (balanceDue <= 0) {
      return NextResponse.json(
        { error: 'No balance due on this invoice' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const balanceDueCents = Math.round(balanceDue * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (invoice.currencyCode || 'USD').toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for ${invoice.invoiceType} invoice`,
            },
            unit_amount: balanceDueCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: userWithProfile.id,
      metadata: {
        invoice_id: invoice.id,
        customer_profile_id: userWithProfile.customerProfile.id,
        invoice_number: invoice.invoiceNumber,
        invoice_type: invoice.invoiceType,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/invoices/${invoice.id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/invoices/${invoice.id}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    });

    // Update invoice with Stripe session reference
    await db
      .update(financialInvoices)
      .set({
        paymentReference: session.id,
        updatedAt: new Date(),
      })
      .where(eq(financialInvoices.id, invoiceId));

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      balanceDue,
      currency: invoice.currencyCode,
    });

  } catch (error) {
    console.error('Error creating payment session for invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}