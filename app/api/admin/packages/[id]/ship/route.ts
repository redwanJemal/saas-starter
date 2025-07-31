// app/api/admin/packages/[id]/ship/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { updatePackage } from '@/features/packages/db/queries';
import { RouteContext } from '@/lib/types/route';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const { id } = await context.params;

    // Validate package ID
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package ID is required' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.trackingNumberOutbound) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Outbound tracking number is required' 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: 'shipped',
      trackingNumberOutbound: body.trackingNumberOutbound,
      readyToShipAt: body.shippedAt || new Date().toISOString(),
      processedBy: adminUser.id,
      processedAt: new Date().toISOString(),
    };

    // Add notes if provided
    if (body.notes) {
      updateData.warehouseNotes = body.notes;
    }

    // Update the package
    const updatedPackage = await updatePackage(id, updateData, adminUser.id);

    if (!updatedPackage) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: 'Package marked as shipped successfully',
    });

  } catch (error) {
    console.error('Error marking package as shipped:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to mark package as shipped' 
      },
      { status: 500 }
    );
  }
}