import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getActiveStoragePricing } from '@/features/warehouses/db/queries';

// GET /api/admin/warehouses/storage-pricing/active - Get active storage pricing for warehouse
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const effectiveDate = searchParams.get('effectiveDate') || undefined;

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'warehouseId parameter is required' },
        { status: 400 }
      );
    }

    // Get active pricing
    const activePricing = await getActiveStoragePricing(warehouseId, effectiveDate);
    
    if (!activePricing) {
      return NextResponse.json(
        { error: 'No active storage pricing found for this warehouse' },
        { status: 404 }
      );
    }

    return NextResponse.json(activePricing);
  } catch (error) {
    console.error('Error fetching active storage pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active storage pricing' },
      { status: 500 }
    );
  }
}
