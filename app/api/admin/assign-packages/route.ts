// app/api/admin/assign-packages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { sendNotification } from '@/lib/notifications';
import { assignIncomingShipmentItems } from '@/features/packages/db/queries';

// POST /api/admin/assign-packages - Assign packages to customers
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.write');
    const body = await request.json();

    if (!body.assignments || !Array.isArray(body.assignments)) {
      return NextResponse.json(
        { error: 'assignments array is required' },
        { status: 400 }
      );
    }
    const customerProfileId = body.customerProfileId;
    
    if (!customerProfileId) {
      return NextResponse.json(
        { error: 'customerProfileId is required' },
        { status: 400 }
      );
    }

    // Validate each assignment
    for (const assignment of body.assignments) {
      if (!assignment.itemId) {
        return NextResponse.json(
          { error: 'Each assignment must have itemId and customerProfileId' },
          { status: 400 }
        );
      }
    }

    const assignments = body.assignments.map((assignment: any) => ({
      itemId: assignment.itemId,
      customerProfileId,
      assignedBy: adminUser.id,
    }));

    // Use the actual database function instead of mock
    const result = await assignIncomingShipmentItems(assignments);

    // Send notifications to customers for successfully assigned items
    for (const assignedItem of result.assignedItems) {
      try {
        await sendNotification({
          type: 'package_assigned',
          customerProfileId,
          data: {
            trackingNumber: assignedItem.trackingNumber,
            assignedAt: assignedItem.assignedAt,
          },
        });
      } catch (notificationError) {
        // Log notification error but don't fail the assignment
        console.error('Failed to send assignment notification:', notificationError);
      }
    }

    // Return detailed response including any failures
    const response = {
      success: true,
      data: result,
      message: result.assignedItems.length > 0 
        ? `Successfully assigned ${result.assignedItems.length} items`
        : 'No items were assigned',
    };

    // If there were failures, include them in the message
    if (result.failed.length > 0) {
      response.message += `. ${result.failed.length} items failed to assign.`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error assigning packages:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to assign packages' },
      { status: 500 }
    );
  }
}