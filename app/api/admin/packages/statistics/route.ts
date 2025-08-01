// app/api/admin/packages/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { updatePackageStatus } from '@/features/packages/db/queries';
import type { PackageStatus } from '@/features/packages/types/package.types';
import type { RouteContext } from '@/lib/types/route';

export async function PATCH(
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

    if (!body.status) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Status is required' 
        },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses: PackageStatus[] = [
      'expected', 'received', 'processing', 'ready_to_ship', 
      'shipped', 'delivered', 'returned', 'disposed', 
      'missing', 'damaged', 'held'
    ];

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Update package status
    const result = await updatePackageStatus(
      id,
      body.status,
      body.reason || 'manual_update',
      body.notes,
      adminUser.id
    );

    if (!result) {
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
      data: result,
      message: 'Package status updated successfully',
    });

  } catch (error) {
    console.error('Error updating package status:', error);
    
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
        message: 'Failed to update package status' 
      },
      { status: 500 }
    );
  }
}