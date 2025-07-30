import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getWarehouseStatistics,
  getWarehouseCapacity 
} from '@/features/warehouses/db/queries';
import { RouteContext } from '@/lib/types/route';

// GET /api/admin/warehouses/[id]/statistics - Get warehouse statistics
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const warehouseId = (await context.params).id;
    const { searchParams } = new URL(request.url);
    const includeCapacity = searchParams.get('includeCapacity') === 'true';
    
    // Get warehouse statistics
    const statistics = await getWarehouseStatistics(warehouseId);
    
    if (!statistics) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const response: any = { statistics };

    // Optionally include detailed capacity information
    if (includeCapacity) {
      const capacity = await getWarehouseCapacity(warehouseId);
      response.capacity = capacity;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching warehouse statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse statistics' },
      { status: 500 }
    );
  }
}
