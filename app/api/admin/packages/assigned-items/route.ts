// app/api/admin/packages/assigned-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { IncomingShipmentItemFilters } from '@/lib/db/schema';

// GET /api/admin/packages/assigned-items - Get assigned shipment items
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.read');
    const { searchParams } = new URL(request.url);

    const filters: IncomingShipmentItemFilters = {
      assignmentStatus: searchParams.get('status')?.split(',') as any,
      assignedCustomerProfileId: searchParams.get('customerId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getIncomingShipmentItems(adminUser.tenantId, filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching assigned items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned items' },
      { status: 500 }
    );
  }
}