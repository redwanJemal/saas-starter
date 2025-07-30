import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getCustomerWarehouseAssignmentById,
  updateCustomerWarehouseAssignment,
  deleteCustomerWarehouseAssignment 
} from '@/features/warehouses/db/queries';
import type { 
  UpdateCustomerWarehouseAssignmentData,
  CustomerWarehouseAssignmentResponse 
} from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';

// GET /api/admin/warehouses/assignments/[id] - Get customer warehouse assignment by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const assignmentId = (await context.params).id;
    
    // Get assignment
    const assignment = await getCustomerWarehouseAssignmentById(assignmentId);
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Customer warehouse assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment as CustomerWarehouseAssignmentResponse);
  } catch (error) {
    console.error('Error fetching customer warehouse assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer warehouse assignment' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/warehouses/assignments/[id] - Update customer warehouse assignment
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const assignmentId = (await context.params).id;
    const body: UpdateCustomerWarehouseAssignmentData = await request.json();

    // Update assignment
    const updatedAssignment = await updateCustomerWarehouseAssignment(assignmentId, body);

    if (!updatedAssignment) {
    return NextResponse.json(
        { error: 'Customer warehouse assignment not found' },
        { status: 404 }
    );
    }

    // Fetch the full assignment with related data
    const fullAssignment = await getCustomerWarehouseAssignmentById(assignmentId);

    return NextResponse.json(fullAssignment as CustomerWarehouseAssignmentResponse);
  } catch (error) {
    console.error('Error updating customer warehouse assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update customer warehouse assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/warehouses/assignments/[id] - Delete customer warehouse assignment
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const assignmentId = (await context.params).id;
    
    // Delete assignment
    const deleted = await deleteCustomerWarehouseAssignment(assignmentId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Customer warehouse assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Customer warehouse assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer warehouse assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer warehouse assignment' },
      { status: 500 }
    );
  }
}
