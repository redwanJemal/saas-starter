import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getStoragePricing,
  createStoragePricing 
} from '@/features/warehouses/db/queries';
import type { 
  StoragePricingFilters,
  CreateStoragePricingData,
  StoragePricingResponse 
} from '@/features/warehouses/db/schema';
import { PaginatedResponse } from '@/lib/utils';

// GET /api/admin/warehouses/storage-pricing - List storage pricing
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: StoragePricingFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      warehouseId: searchParams.get('warehouseId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      effectiveDate: searchParams.get('effectiveDate') || undefined,
    };

    // Get pricing with pagination
    const result = await getStoragePricing(filters);

    const response: PaginatedResponse<StoragePricingResponse> = {
      data: result.data.map(mapToStoragePricingResponse),
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching storage pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage pricing' },
      { status: 500 }
    );
  }
}

// POST /api/admin/warehouses/storage-pricing - Create storage pricing
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.manage');
    
    const body: CreateStoragePricingData = await request.json();

    // Validate required fields
    const requiredFields = ['warehouseId', 'freeDays', 'dailyRateAfterFree', 'effectiveFrom'];
    for (const field of requiredFields) {
      if (body[field as keyof CreateStoragePricingData] === undefined || body[field as keyof CreateStoragePricingData] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields
    if (body.freeDays < 0) {
      return NextResponse.json(
        { error: 'Free days must be non-negative' },
        { status: 400 }
      );
    }

    if (parseFloat(body.dailyRateAfterFree) < 0) {
      return NextResponse.json(
        { error: 'Daily rate must be non-negative' },
        { status: 400 }
      );
    }

    // Create pricing
    const newPricing = await createStoragePricing(adminUser.tenantId, body);

    return NextResponse.json(newPricing, { status: 201 });
  } catch (error) {
    console.error('Error creating storage pricing:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create storage pricing' },
      { status: 500 }
    );
  }
}

// Helper function - not exported to avoid Next.js route export errors
function mapToStoragePricingResponse(pricing: any): StoragePricingResponse {
    if (!pricing) return {} as StoragePricingResponse;
    
    return {
      ...pricing,
      effectiveFrom: new Date(pricing.effectiveFrom),
      effectiveUntil: pricing.effectiveUntil ? new Date(pricing.effectiveUntil) : undefined,
      createdAt: new Date(pricing.createdAt),
      updatedAt: new Date(pricing.updatedAt),
      maxDuration: pricing.maxDuration ? new Date(pricing.maxDuration) : undefined,
    };
  }