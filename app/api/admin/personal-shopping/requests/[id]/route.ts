// app/api/admin/personal-shopping/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  personalShopperRequests, 
  personalShopperRequestItems,
  personalShopperRequestStatusHistory,
  customerProfiles,
  users 
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, desc, sql } from 'drizzle-orm';

// GET /api/admin/personal-shopping/requests/[id] - Get specific request details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requirePermission('personal_shopping.read');
    const requestId = params.id;

    // Get the request with customer details
    const [requestData] = await db
      .select({
        // Request details
        id: personalShopperRequests.id,
        requestNumber: personalShopperRequests.requestNumber,
        status: personalShopperRequests.status,
        shippingOption: personalShopperRequests.shippingOption,
        shippingPreference: personalShopperRequests.shippingPreference,
        allowAlternateRetailers: personalShopperRequests.allowAlternateRetailers,
        estimatedCost: personalShopperRequests.estimatedCost,
        actualCost: personalShopperRequests.actualCost,
        serviceFee: personalShopperRequests.serviceFee,
        totalAmount: personalShopperRequests.totalAmount,
        currencyCode: personalShopperRequests.currencyCode,
        quotedAt: personalShopperRequests.quotedAt,
        approvedAt: personalShopperRequests.approvedAt,
        purchasedAt: personalShopperRequests.purchasedAt,
        specialInstructions: personalShopperRequests.specialInstructions,
        internalNotes: personalShopperRequests.internalNotes,
        createdAt: personalShopperRequests.createdAt,
        updatedAt: personalShopperRequests.updatedAt,
        
        // Customer details
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        customerPhone: users.phone,
      })
      .from(personalShopperRequests)
      .innerJoin(customerProfiles, eq(personalShopperRequests.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(eq(personalShopperRequests.id, requestId))
      .limit(1);

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
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

// PATCH /api/admin/personal-shopping/requests/[id] - Update request status and quote
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requirePermission('personal_shopping.manage');
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

    const updateData: any = {
      updatedAt: new Date(),
    };

    let statusHistoryEntry: any = {
      personalShopperRequestId: requestId,
      changedBy: adminUser.id,
    };

    // Handle different update types
    if (body.action === 'provide_quote') {
      // Validate quote data
      if (!body.estimated_cost || !body.service_fee) {
        return NextResponse.json(
          { error: 'Estimated cost and service fee are required for quote' },
          { status: 400 }
        );
      }

      updateData.estimatedCost = body.estimated_cost;
      updateData.serviceFee = body.service_fee;
      updateData.totalAmount = (parseFloat(body.estimated_cost) + parseFloat(body.service_fee)).toString();
      updateData.status = 'quoted';
      updateData.quotedAt = new Date();
      updateData.quotedBy = adminUser.id;
      
      if (body.internal_notes) {
        updateData.internalNotes = body.internal_notes;
      }

      statusHistoryEntry.status = 'quoted';
      statusHistoryEntry.notes = 'Quote provided to customer';
      statusHistoryEntry.changeReason = 'Admin quote';

    } else if (body.action === 'mark_purchasing') {
      if (currentRequest.status !== 'approved') {
        return NextResponse.json(
          { error: 'Request must be approved before purchasing' },
          { status: 400 }
        );
      }

      updateData.status = 'purchasing';
      statusHistoryEntry.status = 'purchasing';
      statusHistoryEntry.notes = 'Started purchasing items';
      statusHistoryEntry.changeReason = 'Admin action';

    } else if (body.action === 'mark_purchased') {
      if (!['purchasing', 'approved'].includes(currentRequest.status)) {
        return NextResponse.json(
          { error: 'Invalid status for marking as purchased' },
          { status: 400 }
        );
      }

      updateData.status = 'purchased';
      updateData.purchasedAt = new Date();
      updateData.purchasedBy = adminUser.id;
      
      if (body.actual_cost) {
        updateData.actualCost = body.actual_cost;
      }

      statusHistoryEntry.status = 'purchased';
      statusHistoryEntry.notes = body.notes || 'Items successfully purchased';
      statusHistoryEntry.changeReason = 'Admin action';

    } else if (body.action === 'mark_received') {
      if (currentRequest.status !== 'purchased') {
        return NextResponse.json(
          { error: 'Request must be purchased before marking as received' },
          { status: 400 }
        );
      }

      updateData.status = 'received';
      statusHistoryEntry.status = 'received';
      statusHistoryEntry.notes = body.notes || 'Items received at warehouse';
      statusHistoryEntry.changeReason = 'Admin action';

    } else if (body.action === 'update_notes') {
      if (body.internal_notes !== undefined) {
        updateData.internalNotes = body.internal_notes;
      }
      
      statusHistoryEntry.status = currentRequest.status;
      statusHistoryEntry.notes = 'Internal notes updated';
      statusHistoryEntry.changeReason = 'Admin note update';

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update the request
    const [updatedRequest] = await db
      .update(personalShopperRequests)
      .set(updateData)
      .where(eq(personalShopperRequests.id, requestId))
      .returning();

    // Add status history entry
    await db
      .insert(personalShopperRequestStatusHistory)
      .values(statusHistoryEntry);

    // TODO: Send notification to customer if status changed
    // This would integrate with your notification system

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating personal shopping request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}