import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getBinLocationById,
  updateBinLocation,
  deleteBinLocation 
} from '@/features/warehouses/db/queries';
import type { 
  UpdateBinLocationData,
  BinLocationResponse 
} from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';

// GET /api/admin/warehouses/bins/[id] - Get bin location by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const binId = (await context.params).id;
    
    // Get bin location
    const bin = await getBinLocationById(binId);
    
    if (!bin) {
      return NextResponse.json(
        { error: 'Bin location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bin as BinLocationResponse);
  } catch (error) {
    console.error('Error fetching bin location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bin location' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/warehouses/bins/[id] - Update bin location
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const binId = (await context.params).id;
    const body: UpdateBinLocationData = await request.json();

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

    // Update bin location
    const updatedBin = await updateBinLocation(binId, body);
    
    if (!updatedBin) {
      return NextResponse.json(
        { error: 'Bin location not found' },
        { status: 404 }
      );
    }

    // Fetch the full bin location with related data
    const fullBin = await getBinLocationById(binId);

    return NextResponse.json(fullBin as BinLocationResponse);
  } catch (error) {
    console.error('Error updating bin location:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update bin location' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/warehouses/bins/[id] - Delete bin location
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const binId = (await context.params).id;
    
    // Delete bin location
    const deleted = await deleteBinLocation(binId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Bin location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Bin location deleted successfully' });
  } catch (error) {
    console.error('Error deleting bin location:', error);
    
    if (error instanceof Error && error.message.includes('active package assignments')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete bin location' },
      { status: 500 }
    );
  }
}
