// app/api/personal-shopping/requests/[id]/payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  personalShopperRequests,
  personalShopperRequestStatusHistory,
  financialInvoices,
  financialInvoiceLines
} from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/payments/stripe';
import { RouteContext } from '@/lib/utils/route';

// POST /api/personal-shopping/requests/[id]/payment - Create Stripe checkout session
export async function POST(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = (await RouteContext.params).id;

    // Get current request
    const [personalShopperRequest] = await db
      .select()
      .from(personalShopperRequests)
      .where(eq(personalShopperRequests.id, requestId))
      .limit(1);

    if (!personalShopperRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (personalShopperRequest.customerProfileId !== userWithProfile.customerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow payment if status is 'approved'
    if (personalShopperRequest.status !== 'approved') {
      return NextResponse.json(
        { error: 'Request must be approved before payment' },
        { status: 400 }
      );
    }

    // Check if total amount is set
    if (!personalShopperRequest.totalAmount || parseFloat(personalShopperRequest.totalAmount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `PS-${personalShopperRequest.requestNumber}-${Date.now()}`;

    // Create financial invoice
    const [invoice] = await db
      .insert(financialInvoices)
      .values({
        tenantId: personalShopperRequest.tenantId,
        customerProfileId: personalShopperRequest.customerProfileId,
        invoiceNumber,
        invoiceType: 'personal_shopper',
        subtotal: personalShopperRequest.estimatedCost || '0.00',
        totalAmount: personalShopperRequest.totalAmount,
        currencyCode: personalShopperRequest.currencyCode || 'USD',
        paymentStatus: 'pending',
        issuedAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      })
      .returning();

    // Create invoice lines
    const invoiceLines = [];
    
    // Item cost line
    if (personalShopperRequest.estimatedCost && parseFloat(personalShopperRequest.estimatedCost) > 0) {
      invoiceLines.push({
        invoiceId: invoice.id,
        description: `Personal Shopping Service - Items (${personalShopperRequest.requestNumber})`,
        quantity: '1.000',
        unitPrice: personalShopperRequest.estimatedCost,
        lineTotal: personalShopperRequest.estimatedCost,
        referenceType: 'personal_shopper_request',
        referenceId: personalShopperRequest.id,
        sortOrder: 1,
      });
    }

    // Service fee line
    if (personalShopperRequest.serviceFee && parseFloat(personalShopperRequest.serviceFee) > 0) {
      invoiceLines.push({
        invoiceId: invoice.id,
        description: `Personal Shopping Service Fee (${personalShopperRequest.requestNumber})`,
        quantity: '1.000',
        unitPrice: personalShopperRequest.serviceFee,
        lineTotal: personalShopperRequest.serviceFee,
        referenceType: 'personal_shopper_request',
        referenceId: personalShopperRequest.id,
        sortOrder: 2,
      });
    }

    if (invoiceLines.length > 0) {
      await db.insert(financialInvoiceLines).values(invoiceLines);
    }

    // Create Stripe checkout session
    const totalAmountCents = Math.round(parseFloat(personalShopperRequest.totalAmount) * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: personalShopperRequest.currencyCode?.toLowerCase() || 'usd',
            product_data: {
              name: `Personal Shopping Service - ${personalShopperRequest.requestNumber}`,
              description: `Personal shopping service for your requested items`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: userWithProfile.id,
      metadata: {
        invoice_id: invoice.id,
        personal_shopper_request_id: personalShopperRequest.id,
        customer_profile_id: personalShopperRequest.customerProfileId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personal-shopping/requests/${requestId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personal-shopping/requests/${requestId}?payment=cancelled`,
    });

    // Update invoice with Stripe payment reference
    await db
      .update(financialInvoices)
      .set({
        paymentReference: session.id,
        updatedAt: new Date(),
      })
      .where(eq(financialInvoices.id, invoice.id));

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      invoice,
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}