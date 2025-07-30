import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getPackageBinAssignments,
  createPackageBinAssignment 
} from '@/features/warehouses/db/queries';
import type { 
  CreatePackageBinAssignmentData,
  PackageBinAssignmentResponse 
} from '@/features/warehouses/db/schema';
import { PaginatedResponse } from '@/shared/types/api.types';

interface PackageBinAssignmentFilters {
  page?: number;
  limit?: number;
  binId?: string;
  packageId?: string;
  warehouseId?: string;
  activeOnly?: boolean;
}

// GET /api/admin/packages/bin-assignments - List package bin assignments
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: PackageBinAssignmentFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      binId: searchParams.get('binId') || undefined,
      packageId: searchParams.get('packageId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      activeOnly: searchParams.get('activeOnly') ? searchParams.get('activeOnly') === 'true' : true,
    };

    // Get assignments with pagination
    const result = await getPackageBinAssignments(filters);

    const response: PaginatedResponse<PackageBinAssignmentResponse> = {
      data: result.data as PackageBinAssignmentResponse[],
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching package bin assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package bin assignments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/packages/bin-assignments - Create package bin assignment
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');
    
    const body: CreatePackageBinAssignmentData = await request.json();

    // Validate required fields
    const requiredFields = ['packageId', 'binId'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreatePackageBinAssignmentData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create assignment
    const newAssignment = await createPackageBinAssignment(body, adminUser.id);

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Error creating package bin assignment:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already has an active') || error.message.includes('not available') || error.message.includes('maximum capacity')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create package bin assignment' },
      { status: 500 }
    );
  }
}
