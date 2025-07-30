import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getCustomerWarehouseAssignments,
  createCustomerWarehouseAssignment 
} from '@/features/warehouses/db/queries';
import type { 
  CustomerWarehouseAssignmentFilters,
  CreateCustomerWarehouseAssignmentData,
  CustomerWarehouseAssignmentResponse 
} from '@/features/warehouses/db/schema';
import { PaginatedResponse } from '@/shared/types/api.types';

// GET /api/admin/warehouses/assignments - List customer warehouse assignments
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: CustomerWarehouseAssignmentFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      warehouseId: searchParams.get('warehouseId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      status: searchParams.get('status') as any || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Get assignments with pagination
    const result = await getCustomerWarehouseAssignments(filters);

    const response: PaginatedResponse<CustomerWarehouseAssignmentResponse> = {
      data: result.data as CustomerWarehouseAssignmentResponse[],
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customer warehouse assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer warehouse assignments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/warehouses/assignments - Create customer warehouse assignment
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.manage');
    
    const body: CreateCustomerWarehouseAssignmentData = await request.json();

    // Validate required fields
    const requiredFields = ['customerProfileId', 'warehouseId'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateCustomerWarehouseAssignmentData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create assignment
    const newAssignment = await createCustomerWarehouseAssignment(
      adminUser.tenantId,
      body,
      adminUser.id
    );

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Error creating customer warehouse assignment:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already has an active assignment')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer warehouse assignment' },
      { status: 500 }
    );
  }
}
