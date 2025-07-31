// app/api/admin/assign-packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { sendNotification } from '@/lib/notifications';
import { assignIncomingShipmentItems } from '@/features/packages/hooks/use-packages-query';

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

    const assignments = body.assignments.map((assignment: any) => ({
      itemId: assignment.itemId,
      customerProfileId: assignment.customerProfileId,
      assignedBy: adminUser.id,
    }));

    const result = await assignIncomingShipmentItems(assignments);

    // Send notifications to customers
    for (const assignment of result.assignedItems) {
      await sendNotification({
        type: 'package_assigned',
        customerProfileId: assignment.assignedCustomerProfileId,
        data: {
          trackingNumber: assignment.trackingNumber,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully assigned ${result.assignedItems.length} items`,
    });
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