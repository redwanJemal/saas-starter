import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import {
  getPackageBinAssignments,
  createPackageBinAssignment,
  removePackageBinAssignment,
} from '@/features/warehouses/db/queries';
import type {
  CreatePackageBinAssignmentData,
} from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';

// Using RouteContext from lib/types/route.ts

// GET /api/admin/packages/[id]/bin-assignment
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('packages.read');

    const { id: packageId } = await context.params;

    const result = await getPackageBinAssignments({
      packageId,
      activeOnly: false,
      limit: 100,
    });

    return NextResponse.json({
      assignments: result.data,
      currentAssignment: result.data.find(a => !a.removedAt) || null,
    });
  } catch (error) {
    console.error('Error fetching package bin assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package bin assignment' },
      { status: 500 }
    );
  }
}

// POST /api/admin/packages/[id]/bin-assignment
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('packages.manage');

    const { id: packageId } = await context.params;
    const body = await request.json();

    if (!body.binId) {
      return NextResponse.json({ error: 'binId is required' }, { status: 400 });
    }

    const assignmentData: CreatePackageBinAssignmentData = {
      packageId,
      binId: body.binId,
      assignmentReason: body.assignmentReason || 'Manual assignment',
      notes: body.notes,
    };

    const newAssignment = await createPackageBinAssignment(assignmentData, adminUser.id);

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning package to bin:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes('already has an active') ||
      message.includes('not available') ||
      message.includes('maximum capacity')
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to assign package to bin' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/packages/[id]/bin-assignment
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('packages.manage');

    const { id: packageId } = await context.params;
    const { searchParams } = new URL(request.url);
    const removalReason = searchParams.get('reason') || 'Manual removal';
    const notes = searchParams.get('notes') || undefined;

    const removed = await removePackageBinAssignment(
      { packageId, removalReason, notes },
      adminUser.id
    );

    if (!removed) {
      return NextResponse.json(
        { error: 'Package has no active bin assignment' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Package removed from bin successfully' });
  } catch (error) {
    console.error('Error removing package from bin:', error);
    return NextResponse.json(
      { error: 'Failed to remove package from bin' },
      { status: 500 }
    );
  }
}
