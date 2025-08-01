// app/api/admin/packages/[id]/receive/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { updatePackage, updatePackageStatus } from '@/features/packages/db/queries';
import { RouteContext } from '@/lib/types/route';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const { id } = await context.params;

    // Validate package ID
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package ID is required' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      status: 'received',
      receivedAt: body.receivedAt || new Date().toISOString(),
      processedBy: adminUser.id,
      processedAt: new Date().toISOString(),
    };

    // Add warehouse notes if provided
    if (body.warehouseNotes) {
      updateData.warehouseNotes = body.warehouseNotes;
    }

    // Add actual weight if provided
    if (body.actualWeight) {
      updateData.weightInKg = parseFloat(body.actualWeight);
    }

    // Add actual dimensions if provided
    if (body.actualDimensions) {
      if (body.actualDimensions.lengthCm) updateData.lengthCm = parseFloat(body.actualDimensions.lengthCm);
      if (body.actualDimensions.widthCm) updateData.widthCm = parseFloat(body.actualDimensions.widthCm);
      if (body.actualDimensions.heightCm) updateData.heightCm = parseFloat(body.actualDimensions.heightCm);
    }

    // Update the package
    const updatedPackage = await updatePackage(id, updateData, adminUser.id);

    if (!updatedPackage) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: 'Package marked as received successfully',
    });

  } catch (error) {
    console.error('Error marking package as received:', error);
    
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
        message: 'Failed to mark package as received' 
      },
      { status: 500 }
    );
  }
}