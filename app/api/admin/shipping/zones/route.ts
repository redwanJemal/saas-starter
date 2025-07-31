// app/api/admin/shipping/zones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getZones, createZone } from '@/features/shipping/db/queries';
import type { CreateZoneData, ZoneFilters } from '@/features/shipping/types/shipping.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/services/api/client';

// GET /api/admin/shipping/zones - Get zones with pagination
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.read');

    const searchParams = request.nextUrl.searchParams;
    
    const filters: ZoneFilters = {
      isActive: searchParams.get('isActive') === 'true' ? true : 
                 searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Get zones with pagination
    const result = await getZones(adminUser.tenantId, filters);

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shipping/zones - Create zone
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.write');

    const body: CreateZoneData = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      );
    }

    // Create zone
    const newZone = await createZone(adminUser.tenantId, body);

    const response: ApiResponse<any> = {
      success: true,
      data: newZone,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}