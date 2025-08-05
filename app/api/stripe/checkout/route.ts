// app/api/stripe/checkout/route.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, customerProfiles } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('No subscription found for this session.');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;
    if (!plan) {
      throw new Error('No plan found for this subscription.');
    }

    const productId = (plan.product as Stripe.Product).id;
    if (!productId) {
      throw new Error('No product ID found for this subscription.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    // Find user using direct table query
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        tenantId: users.tenantId,
        userType: users.userType,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error('User not found in database.');
    }

    const user = userResult[0];

    // Find customer profile using direct table query
    const customerProfileResult = await db
      .select({
        id: customerProfiles.id,
        userId: customerProfiles.userId,
        customerId: customerProfiles.customerId,
        kycStatus: customerProfiles.kycStatus,
        riskLevel: customerProfiles.riskLevel,
      })
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, user.id))
      .limit(1);

    if (customerProfileResult.length === 0) {
      throw new Error('Customer profile not found for user.');
    }

    const customerProfile = customerProfileResult[0];

    // Update customer profile with Stripe subscription data
    await db
      .update(customerProfiles)
      .set({
        // Add subscription fields to customer profile if needed
        // You might want to add these fields to the customerProfiles table:
        // stripeCustomerId: customerId,
        // stripeSubscriptionId: subscriptionId,
        // stripeProductId: productId,
        // planName: (plan.product as Stripe.Product).name,
        // subscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.id, customerProfile.id));

    // Create user object with customer profile for session
    const userWithProfile = {
      ...user,
      customerProfile: customerProfile,
    };

    await setSession(userWithProfile);

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error handling successful checkout:', error);
    return NextResponse.redirect(new URL('/pricing?error=checkout_failed', request.url));
  }
}