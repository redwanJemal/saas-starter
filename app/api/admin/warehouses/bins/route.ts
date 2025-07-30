import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getBinLocations,
  createBinLocation 
} from '@/features/warehouses/db/queries';
import type { 
  BinLocationFilters,
  CreateBinLocationData,
  BinLocationResponse 
} from '@/features/warehouses/db/schema';

import { PaginatedResponse } from '@/shared/types/api.types';

// GET /api/admin/warehouses/bins - List bin locations
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: BinLocationFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      warehouseId: searchParams.get('warehouseId') || undefined,
      zoneName: searchParams.get('zoneName') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      isAvailable: searchParams.get('isAvailable') ? searchParams.get('isAvailable') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Get bin locations with pagination
    const result = await getBinLocations(filters);

    const response: PaginatedResponse<BinLocationResponse> = {
      data: result.data as BinLocationResponse[],
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bin locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bin locations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/warehouses/bins - Create bin location
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.manage');
    
    const body: CreateBinLocationData = await request.json();

    // Validate required fields
    const requiredFields = ['warehouseId', 'binCode', 'zoneName'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateBinLocationData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields if provided
    if (body.maxCapacity !== undefined && body.maxCapacity < 0) {
      return NextResponse.json(
        { error: 'Max capacity must be non-negative' },
        { status: 400 }
      );
    }

    if (body.maxWeightKg !== undefined && parseFloat(body.maxWeightKg) < 0) {
      return NextResponse.json(
        { error: 'Max weight must be non-negative' },
        { status: 400 }
      );
    }

    if (body.dailyPremium !== undefined && parseFloat(body.dailyPremium) < 0) {
      return NextResponse.json(
        { error: 'Daily premium must be non-negative' },
        { status: 400 }
      );
    }

    // Create bin location
    const newBin = await createBinLocation(adminUser.tenantId, body);

    return NextResponse.json(newBin, { status: 201 });
  } catch (error) {
    console.error('Error creating bin location:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create bin location' },
      { status: 500 }
    );
  }
}
