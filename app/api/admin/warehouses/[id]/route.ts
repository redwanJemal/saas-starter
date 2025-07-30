// app/api/admin/warehouses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getWarehouseById, updateWarehouse, deleteWarehouse } from '@/features/warehouses/db/queries';
import type { UpdateWarehouseData, WarehouseResponse } from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';
import { ApiResponse } from '@/shared/services/api/client';

// GET /api/admin/warehouses/[id] - Get warehouse by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');

    const { id: warehouseId } = await context.params;

    // Get warehouse by ID
    const warehouse = await getWarehouseById(warehouseId);

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: warehouse, success: true } as ApiResponse<WarehouseResponse>);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/warehouses/[id] - Update warehouse
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.write');

    const { id: warehouseId } = await context.params;
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updateData = body as UpdateWarehouseData;

    // Update warehouse
    const updatedWarehouse = await updateWarehouse(warehouseId, updateData);

    if (!updatedWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedWarehouse, success: true } as ApiResponse<WarehouseResponse>);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.delete');

    const { id: warehouseId } = await context.params;

    // Delete warehouse
    const deleted = await deleteWarehouse(warehouseId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Warehouse deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('active customer assignments')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}