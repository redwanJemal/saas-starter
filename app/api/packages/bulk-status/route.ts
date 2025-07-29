// app/api/packages/bulk-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updatePackagesStatus } from '@/features/packages/db/queries/update-packages-status.query';
import type { PackageStatus } from '@/features/packages/types/package.types';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Package IDs array is required' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'returned'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Use the query layer to update package statuses
    const result = await updatePackagesStatus(body.ids, body.status as PackageStatus);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error bulk updating package status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update package status' },
      { status: 500 }
    );
  }
}