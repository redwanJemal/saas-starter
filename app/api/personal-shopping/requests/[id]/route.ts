// app/api/personal-shopping/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  personalShopperRequests, 
  personalShopperRequestItems, 
  personalShopperRequestStatusHistory,
  users 
} from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, desc, sql } from 'drizzle-orm';

// GET /api/personal-shopping/requests/[id] - Get specific request details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;

    // Get the request
    const [requestData] = await db
      .select()
      .from(personalShopperRequests)
      .where(
        eq(personalShopperRequests.id, requestId)
      )
      .limit(1);

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (requestData.customerProfileId !== userWithProfile.customerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get items
    const items = await db
      .select()
      .from(personalShopperRequestItems)
      .where(eq(personalShopperRequestItems.personalShopperRequestId, requestId))
      .orderBy(personalShopperRequestItems.sortOrder);

    // Get status history with user details
    const statusHistory = await db
      .select({
        id: personalShopperRequestStatusHistory.id,
        status: personalShopperRequestStatusHistory.status,
        notes: personalShopperRequestStatusHistory.notes,
        changeReason: personalShopperRequestStatusHistory.changeReason,
        createdAt: personalShopperRequestStatusHistory.createdAt,
        changedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        changedByEmail: users.email,
      })
      .from(personalShopperRequestStatusHistory)
      .leftJoin(users, eq(personalShopperRequestStatusHistory.changedBy, users.id))
      .where(eq(personalShopperRequestStatusHistory.personalShopperRequestId, requestId))
      .orderBy(desc(personalShopperRequestStatusHistory.createdAt));

    const response = {
      ...requestData,
      items,
      statusHistory,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching personal shopping request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

// PATCH /api/personal-shopping/requests/[id] - Update request (only if draft or submitted)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;
    const body = await request.json();

    // Get current request
    const [currentRequest] = await db
      .select()
      .from(personalShopperRequests)
      .where(eq(personalShopperRequests.id, requestId))
      .limit(1);

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (currentRequest.customerProfileId !== userWithProfile.customerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow updates for draft or submitted status
    if (!['draft', 'submitted'].includes(currentRequest.status)) {
      return NextResponse.json(
        { error: 'Request cannot be modified in current status' },
        { status: 400 }
      );
    }

    // Update the request
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.shipping?.option !== undefined) {
      updateData.shippingOption = body.shipping.option;
    }
    if (body.shipping?.preference !== undefined) {
      updateData.shippingPreference = body.shipping.preference;
    }
    if (body.allow_alternate_retailers !== undefined) {
      updateData.allowAlternateRetailers = body.allow_alternate_retailers;
    }
    if (body.special_instructions !== undefined) {
      updateData.specialInstructions = body.special_instructions;
    }

    // Handle action
    if (body.action === 'SUBMIT REQUEST' && currentRequest.status === 'draft') {
      updateData.status = 'submitted';
    }

    const [updatedRequest] = await db
      .update(personalShopperRequests)
      .set(updateData)
      .where(eq(personalShopperRequests.id, requestId))
      .returning();

    // Add status history if status changed
    if (updateData.status && updateData.status !== currentRequest.status) {
      await db
        .insert(personalShopperRequestStatusHistory)
        .values({
          personalShopperRequestId: requestId,
          status: updateData.status,
          notes: 'Request submitted for review',
          changedBy: userWithProfile.id,
          changeReason: 'Customer submission',
        });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating personal shopping request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

// DELETE /api/personal-shopping/requests/[id] - Cancel request (only if draft or submitted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;

    // Get current request
    const [currentRequest] = await db
      .select()
      .from(personalShopperRequests)
      .where(eq(personalShopperRequests.id, requestId))
      .limit(1);

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (currentRequest.customerProfileId !== userWithProfile.customerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow cancellation for certain statuses
    if (!['draft', 'submitted', 'quoted'].includes(currentRequest.status)) {
      return NextResponse.json(
        { error: 'Request cannot be cancelled in current status' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await db
      .update(personalShopperRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(personalShopperRequests.id, requestId));

    // Add status history
    await db
      .insert(personalShopperRequestStatusHistory)
      .values({
        personalShopperRequestId: requestId,
        status: 'cancelled',
        notes: 'Request cancelled by customer',
        changedBy: userWithProfile.id,
        changeReason: 'Customer cancellation',
      });

    return NextResponse.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling personal shopping request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
}