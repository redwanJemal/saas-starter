// app/api/admin/shipping/rates/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getShippingRateById, updateShippingRate, deleteShippingRate } from '@/features/shipping/db/queries';
import type { UpdateShippingRateData } from '@/features/shipping/types/shipping.types';
import type { RouteContext } from '@/lib/types/route';
import type { ApiResponse } from '@/shared/services/api/client';

// GET /api/admin/shipping/rates/[id] - Get shipping rate by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.read');
    const { id } = await context.params;

    // Get shipping rate by ID
    const rate = await getShippingRateById(id, adminUser.tenantId);

    if (!rate) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: rate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shipping rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rate' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/shipping/rates/[id] - Update shipping rate
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

    const updateData = body as UpdateShippingRateData;

    // Validate numeric fields if provided
    const numericFields = ['baseRate', 'perKgRate', 'minCharge', 'maxWeightKg'];
    for (const field of numericFields) {
      const value = updateData[field as keyof UpdateShippingRateData];
      if (value !== undefined) {
        const numValue = parseFloat(value as string);
        if (isNaN(numValue) || numValue < 0) {
          return NextResponse.json(
            { error: `${field} must be a valid positive number` },
            { status: 400 }
          );
        }
      }
    }

    // Validate service type if provided
    if (updateData.serviceType) {
      const validServiceTypes = ['standard', 'express', 'economy'];
      if (!validServiceTypes.includes(updateData.serviceType)) {
        return NextResponse.json(
          { error: 'Invalid service type' },
          { status: 400 }
        );
      }
    }

    // Update shipping rate
    const updatedRate = await updateShippingRate(id, adminUser.tenantId, updateData);

    if (!updatedRate) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      data: updatedRate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('overlapping')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update shipping rate' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shipping/rates/[id] - Delete shipping rate
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.write');
    const { id } = await context.params;

    // Delete shipping rate
    const deleted = await deleteShippingRate(id, adminUser.tenantId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping rate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('cannot be deleted')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete shipping rate' },
      { status: 500 }
    );
  }
}