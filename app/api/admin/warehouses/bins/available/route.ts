import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getAvailableBinLocations } from '@/features/warehouses/db/queries';

// GET /api/admin/warehouses/bins/available - Get available bin locations for warehouse
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId parameter is required' },
        { status: 400 }
      );
    }

    // Get available bin locations
    const availableBins = await getAvailableBinLocations(warehouseId);

    return NextResponse.json({ data: availableBins });
  } catch (error) {
    console.error('Error fetching available bin locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available bin locations' },
      { status: 500 }
    );
  }
}
