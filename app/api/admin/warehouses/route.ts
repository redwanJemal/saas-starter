// app/api/admin/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getWarehouses, createWarehouse } from '@/features/warehouses/db/queries';
import type { WarehouseFilters, CreateWarehouseData, Warehouse } from '@/features/warehouses/db/schema';
import { PaginatedResponse } from '@/shared/types/api.types';
import { ApiResponse } from '@/shared/services/api/client';

// GET /api/admin/warehouses - List warehouses
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: WarehouseFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      status: searchParams.get('status') as any || undefined,
      countryCode: searchParams.get('countryCode') || undefined,
      acceptsNewPackages: searchParams.get('acceptsNewPackages') === 'true' ? true : 
                          searchParams.get('acceptsNewPackages') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Get warehouses with pagination
    const result = await getWarehouses(filters);

    const response: PaginatedResponse<Warehouse> = {
      data: result.data,
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// POST /api/admin/warehouses - Create warehouse
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.manage');
    
    const body: CreateWarehouseData = await request.json();

    // Validate required fields
    const requiredFields = ['code', 'name', 'countryCode', 'addressLine1', 'city', 'currencyCode'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateWarehouseData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create warehouse
    const newWarehouse = await createWarehouse(adminUser.tenantId, body);

    const response: ApiResponse<Warehouse> = {
      success: true,
      data: newWarehouse,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}