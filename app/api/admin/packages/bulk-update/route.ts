// app/api/admin/packages/bulk-update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import type { BulkPackageAction } from '@/features/packages/types/package.types';
import { bulkUpdatePackages } from '@/features/packages/db/queries';

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    // Parse request body
    const body = await request.json();

    // Validate request structure
    if (!body.packageIds || !Array.isArray(body.packageIds) || body.packageIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package IDs array is required and cannot be empty' 
        },
        { status: 400 }
      );
    }

    if (!body.action) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Action is required' 
        },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['update_status', 'assign_warehouse', 'add_note', 'mark_ready', 'delete'];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid action. Must be one of: ${validActions.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent performance issues
    if (body.packageIds.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot update more than 100 packages at once' 
        },
        { status: 400 }
      );
    }

    const bulkAction: BulkPackageAction = {
      packageIds: body.packageIds,
      action: body.action,
      data: body.data || {},
    };

    // Validate action-specific data
    switch (body.action) {
      case 'update_status':
        if (!body.data?.status) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Status is required for update_status action' 
            },
            { status: 400 }
          );
        }
        break;
      
      case 'assign_warehouse':
        if (!body.data?.warehouseId) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Warehouse ID is required for assign_warehouse action' 
            },
            { status: 400 }
          );
        }
        break;
      
      case 'add_note':
        if (!body.data?.notes) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Notes are required for add_note action' 
            },
            { status: 400 }
          );
        }
        break;
    }

    // Perform bulk update
    const result = await bulkUpdatePackages(bulkAction, adminUser.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bulk operation completed. Updated: ${result.updated}, Failed: ${result.failed.length}`,
    });

  } catch (error) {
    console.error('Error performing bulk update:', error);
    
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
        message: 'Failed to perform bulk update' 
      },
      { status: 500 }
    );
  }
}