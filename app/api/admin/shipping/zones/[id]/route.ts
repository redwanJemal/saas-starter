// app/api/admin/shipping/zones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getZoneById, updateZone, deleteZone } from '@/features/shipping/db/queries';
import type { UpdateZoneData } from '@/features/shipping/types/shipping.types';
import type { RouteContext } from '@/lib/types/route';
import type { ApiResponse } from '@/shared/services/api/client';

// GET /api/admin/shipping/zones/[id] - Get zone by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.read');
    const { id } = await context.params;

    // Get zone by ID
    const zone = await getZoneById(id, adminUser.tenantId);

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: zone,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/shipping/zones/[id] - Update zone
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.write');
    const { id } = await context.params;

    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updateData = body as UpdateZoneData;

    // Update zone
    const updatedZone = await updateZone(id, adminUser.tenantId, updateData);

    if (!updatedZone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: updatedZone,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating zone:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shipping/zones/[id] - Delete zone
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.write');
    const { id } = await context.params;

    // Delete zone
    const deleted = await deleteZone(id, adminUser.tenantId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Zone deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting zone:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('cannot be deleted')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
}