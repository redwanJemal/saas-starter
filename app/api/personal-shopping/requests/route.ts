// app/api/personal-shopping/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { personalShopperRequests, personalShopperRequestItems, personalShopperRequestStatusHistory } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

// Generate request number
function generateRequestNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PS-${timestamp.slice(-6)}${random}`;
}

// GET /api/personal-shopping/requests - Get customer's requests
export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    let query = db
      .select({
        id: personalShopperRequests.id,
        requestNumber: personalShopperRequests.requestNumber,
        status: personalShopperRequests.status,
        shippingOption: personalShopperRequests.shippingOption,
        shippingPreference: personalShopperRequests.shippingPreference,
        allowAlternateRetailers: personalShopperRequests.allowAlternateRetailers,
        estimatedCost: personalShopperRequests.estimatedCost,
        actualCost: personalShopperRequests.actualCost,
        totalAmount: personalShopperRequests.totalAmount,
        currencyCode: personalShopperRequests.currencyCode,
        quotedAt: personalShopperRequests.quotedAt,
        approvedAt: personalShopperRequests.approvedAt,
        purchasedAt: personalShopperRequests.purchasedAt,
        specialInstructions: personalShopperRequests.specialInstructions,
        createdAt: personalShopperRequests.createdAt,
        updatedAt: personalShopperRequests.updatedAt,
      })
      .from(personalShopperRequests)
      .where(eq(personalShopperRequests.customerProfileId, userWithProfile.customerProfile.id))
      .orderBy(desc(personalShopperRequests.createdAt))
      .limit(limit);

    if (status) {
      query = query.where(eq(personalShopperRequests.status, status as any));
    }

    const requests = await query;

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching personal shopping requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST /api/personal-shopping/requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the request format
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate required fields for each item
    for (const item of body.items) {
      if (!item.name) {
        return NextResponse.json(
          { error: 'Item name is required for all items' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Valid quantity is required for all items' },
          { status: 400 }
        );
      }
    }

    const requestNumber = generateRequestNumber();
    
    // Determine status based on action
    const status = body.action === 'SAVE FOR LATER' ? 'draft' : 'submitted';

    // Create the personal shopper request
    const [newRequest] = await db
      .insert(personalShopperRequests)
      .values({
        tenantId: userWithProfile.tenantId,
        customerProfileId: userWithProfile.customerProfile.id,
        requestNumber,
        status,
        shippingOption: body.shipping?.option,
        shippingPreference: body.shipping?.preference || 'send_together',
        allowAlternateRetailers: body.allow_alternate_retailers ?? true,
        specialInstructions: body.special_instructions,
        currencyCode: 'USD', // Default currency, could be made configurable
      })
      .returning();

    // Create request items
    const itemsToInsert = body.items.map((item: any, index: number) => ({
      personalShopperRequestId: newRequest.id,
      name: item.name,
      url: item.url,
      size: item.size,
      color: item.color,
      quantity: item.quantity.toString(),
      maxBudgetPerItem: item.max_budget_per_item,
      additionalInstructions: item.additional_instructions,
      sortOrder: index.toString(),
    }));

    const newItems = await db
      .insert(personalShopperRequestItems)
      .values(itemsToInsert)
      .returning();

    // Create status history entry
    await db
      .insert(personalShopperRequestStatusHistory)
      .values({
        personalShopperRequestId: newRequest.id,
        status,
        notes: status === 'draft' ? 'Request saved as draft' : 'Request submitted for review',
        changedBy: userWithProfile.id,
        changeReason: 'Initial creation',
      });

    // Return the created request with items
    const response = {
      ...newRequest,
      items: newItems,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating personal shopping request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}