import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getWarehouseCapacity } from '@/features/warehouses/db/queries';
import { RouteContext } from '@/lib/types/route';

// GET /api/admin/warehouses/[id]/capacity - Get warehouse capacity details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const { id: warehouseId } = await context.params;
    
    // Get warehouse capacity information
    const capacity = await getWarehouseCapacity(warehouseId);
    
    if (!capacity) {
      return NextResponse.json(
        { error: 'Warehouse not found or has no bin locations' },
        { status: 404 }
      );
    }

    return NextResponse.json(capacity);
  } catch (error) {
    console.error('Error fetching warehouse capacity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse capacity' },
      { status: 500 }
    );
  }
}
