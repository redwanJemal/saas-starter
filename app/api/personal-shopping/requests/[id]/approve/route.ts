// app/api/personal-shopping/requests/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  personalShopperRequests,
  personalShopperRequestStatusHistory 
} from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { RouteContext } from '@/lib/utils/route';

// POST /api/personal-shopping/requests/[id]/approve - Customer approves quote
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

    // Only allow approval if status is 'quoted'
    if (currentRequest.status !== 'quoted') {
      return NextResponse.json(
        { error: 'Request must be in quoted status to approve' },
        { status: 400 }
      );
    }

    // Update status to approved
    const [updatedRequest] = await db
      .update(personalShopperRequests)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(personalShopperRequests.id, requestId))
      .returning();

    // Add status history
    await db
      .insert(personalShopperRequestStatusHistory)
      .values({
        personalShopperRequestId: requestId,
        status: 'approved',
        notes: 'Quote approved by customer',
        changedBy: userWithProfile.id,
        changeReason: 'Customer approval',
      });

    // TODO: Send notification to admin team about approval
    // This would integrate with your notification system

    return NextResponse.json({
      message: 'Quote approved successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error approving quote:', error);
    return NextResponse.json(
      { error: 'Failed to approve quote' },
      { status: 500 }
    );
  }
}