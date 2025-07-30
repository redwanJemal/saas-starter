import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getPackageBinAssignmentById,
  removePackageBinAssignment 
} from '@/features/warehouses/db/queries';
import type { PackageBinAssignmentResponse } from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';

// GET /api/admin/packages/bin-assignments/[id] - Get package bin assignment by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('packages.read');
    
    const { id: assignmentId } = await context.params;
    
    // Get assignment
    const assignment = await getPackageBinAssignmentById(assignmentId);
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Package bin assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment as PackageBinAssignmentResponse);
  } catch (error) {
    console.error('Error fetching package bin assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package bin assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/packages/bin-assignments/[id] - Remove package bin assignment
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');
    
    const { id: assignmentId } = await context.params;
    const { searchParams } = new URL(request.url);
    const removalReason = searchParams.get('reason') || 'Manual removal';
    const notes = searchParams.get('notes') || undefined;
    
    // Remove assignment
    const removed = await removePackageBinAssignment(
      { binAssignmentId: assignmentId, removalReason, notes },
      adminUser.id
    );
    
    if (!removed) {
      return NextResponse.json(
        { error: 'Package bin assignment not found or already removed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Package bin assignment removed successfully' });
  } catch (error) {
    console.error('Error removing package bin assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove package bin assignment' },
      { status: 500 }
    );
  }
}
