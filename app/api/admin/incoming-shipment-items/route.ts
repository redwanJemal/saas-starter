// app/api/admin/incoming-shipment-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getIncomingShipmentItems } from '@/features/packages/db/queries';
import type { IncomingShipmentItemFilters, ItemAssignmentStatus } from '@/features/packages/db/schema';

// GET /api/admin/incoming-shipment-items - Get incoming shipment items with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.read');
    
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: IncomingShipmentItemFilters = {
      incomingShipmentId: searchParams.get('incomingShipmentId') || undefined,
      assignmentStatus: parseAssignmentStatus(searchParams.get('assignmentStatus')),
      assignedCustomerProfileId: searchParams.get('assignedCustomerProfileId') || undefined,
      scannedBy: searchParams.get('scannedBy') || undefined,
      isFragile: parseBooleanParam(searchParams.get('isFragile')),
      isHighValue: parseBooleanParam(searchParams.get('isHighValue')),
      requiresInspection: parseBooleanParam(searchParams.get('requiresInspection')),
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Validate pagination parameters
    if (filters.page! < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Page number must be greater than 0' 
        },
        { status: 400 }
      );
    }

    if (filters.limit! < 1 || filters.limit! > 100) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Limit must be between 1 and 100' 
        },
        { status: 400 }
      );
    }

    const result = await getIncomingShipmentItems(adminUser.tenantId, filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error('Error fetching incoming shipment items:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch incoming shipment items' 
      },
      { status: 500 }
    );
  }
}

// Helper function to parse assignment status parameter
function parseAssignmentStatus(statusParam: string | null): ItemAssignmentStatus | ItemAssignmentStatus[] | undefined {
  if (!statusParam) return undefined;
  
  const statuses = statusParam.split(',') as ItemAssignmentStatus[];
  const validStatuses: ItemAssignmentStatus[] = ['unassigned', 'assigned', 'received'];
  
  // Filter out invalid statuses
  const filteredStatuses = statuses.filter(status => validStatuses.includes(status));
  
  if (filteredStatuses.length === 0) return undefined;
  if (filteredStatuses.length === 1) return filteredStatuses[0];
  
  return filteredStatuses;
}

// Helper function to parse boolean parameters
function parseBooleanParam(param: string | null): boolean | undefined {
  if (param === null) return undefined;
  if (param === 'true') return true;
  if (param === 'false') return false;
  return undefined;
}