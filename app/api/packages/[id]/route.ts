// app/api/packages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPackageById, updatePackage, deletePackage } from '@/features/packages/db/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    
    const packageItem = await getPackageById(id);
    
    if (!packageItem) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packageItem,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const packageItem = await updatePackage(id, body);
    
    if (!packageItem) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packageItem,
      message: 'Package updated successfully',
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;

    const success = await deletePackage(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete package' },
      { status: 500 }
    );
  }
}