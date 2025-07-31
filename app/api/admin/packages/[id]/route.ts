// app/api/admin/packages/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import type { UpdatePackageData } from '@/features/packages/types/package.types';
import { deletePackage, getPackageById, updatePackage } from '@/features/packages/db/queries';
import { RouteContext } from '@/lib/types/route';

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('packages.read');

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

    // Get package details
    const packageData = await getPackageById(id);

    if (!packageData) {
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
      data: packageData,
    });

  } catch (error) {
    console.error('Error fetching package:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch package' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Prepare update data with proper type conversion
    const updateData: UpdatePackageData = {};

    // Only update fields that are provided in the request
    if (body.customerProfileId !== undefined) updateData.customerProfileId = body.customerProfileId;
    if (body.suiteCodeCaptured !== undefined) updateData.suiteCodeCaptured = body.suiteCodeCaptured;
    if (body.internalId !== undefined) updateData.internalId = body.internalId;
    if (body.trackingNumberInbound !== undefined) updateData.trackingNumberInbound = body.trackingNumberInbound;
    if (body.trackingNumberOutbound !== undefined) updateData.trackingNumberOutbound = body.trackingNumberOutbound;
    
    // Sender information
    if (body.senderName !== undefined) updateData.senderName = body.senderName;
    if (body.senderCompany !== undefined) updateData.senderCompany = body.senderCompany;
    if (body.senderAddress !== undefined) updateData.senderAddress = body.senderAddress;
    if (body.senderCity !== undefined) updateData.senderCity = body.senderCity;
    if (body.senderCountryCode !== undefined) updateData.senderCountryCode = body.senderCountryCode;
    if (body.senderPostalCode !== undefined) updateData.senderPostalCode = body.senderPostalCode;
    if (body.senderPhone !== undefined) updateData.senderPhone = body.senderPhone;
    if (body.senderEmail !== undefined) updateData.senderEmail = body.senderEmail;
    if (body.senderTrackingUrl !== undefined) updateData.senderTrackingUrl = body.senderTrackingUrl;
    
    // Package details
    if (body.description !== undefined) updateData.description = body.description;
    if (body.estimatedValue !== undefined) {
      updateData.estimatedValue = body.estimatedValue ? parseFloat(body.estimatedValue) : undefined;
    }
    if (body.estimatedValueCurrency !== undefined) updateData.estimatedValueCurrency = body.estimatedValueCurrency;
    
    // Physical characteristics
    if (body.weightActualKg !== undefined) {
      updateData.weightActualKg = body.weightActualKg ? parseFloat(body.weightActualKg) : undefined;
    }
    if (body.lengthCm !== undefined) {
      updateData.lengthCm = body.lengthCm ? parseFloat(body.lengthCm) : undefined;
    }
    if (body.widthCm !== undefined) {
      updateData.widthCm = body.widthCm ? parseFloat(body.widthCm) : undefined;
    }
    if (body.heightCm !== undefined) {
      updateData.heightCm = body.heightCm ? parseFloat(body.heightCm) : undefined;
    }
    if (body.volumetricWeightKg !== undefined) {
      updateData.volumetricWeightKg = body.volumetricWeightKg ? parseFloat(body.volumetricWeightKg) : undefined;
    }
    if (body.chargeableWeightKg !== undefined) {
      updateData.chargeableWeightKg = body.chargeableWeightKg ? parseFloat(body.chargeableWeightKg) : undefined;
    }
    
    // Status and dates
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expectedArrivalDate !== undefined) updateData.expectedArrivalDate = body.expectedArrivalDate;
    if (body.receivedAt !== undefined) updateData.receivedAt = body.receivedAt;
    if (body.readyToShipAt !== undefined) updateData.readyToShipAt = body.readyToShipAt;
    if (body.storageExpiresAt !== undefined) updateData.storageExpiresAt = body.storageExpiresAt;
    
    // Warehouse assignment
    if (body.warehouseId !== undefined) updateData.warehouseId = body.warehouseId;
    
    // Notes and instructions
    if (body.warehouseNotes !== undefined) updateData.warehouseNotes = body.warehouseNotes;
    if (body.customerNotes !== undefined) updateData.customerNotes = body.customerNotes;
    if (body.specialInstructions !== undefined) updateData.specialInstructions = body.specialInstructions;
    
    // Package characteristics
    if (body.isFragile !== undefined) updateData.isFragile = Boolean(body.isFragile);
    if (body.isHighValue !== undefined) updateData.isHighValue = Boolean(body.isHighValue);
    if (body.requiresAdultSignature !== undefined) updateData.requiresAdultSignature = Boolean(body.requiresAdultSignature);
    if (body.isRestricted !== undefined) updateData.isRestricted = Boolean(body.isRestricted);
    
    // Customs information
    if (body.customsDeclaration !== undefined) updateData.customsDeclaration = body.customsDeclaration;
    if (body.customsValue !== undefined) {
      updateData.customsValue = body.customsValue ? parseFloat(body.customsValue) : undefined;
    }
    if (body.customsValueCurrency !== undefined) updateData.customsValueCurrency = body.customsValueCurrency;
    if (body.countryOfOrigin !== undefined) updateData.countryOfOrigin = body.countryOfOrigin;
    if (body.hsCode !== undefined) updateData.hsCode = body.hsCode;
    
    // Pre-receiving workflow
    if (body.incomingShipmentItemId !== undefined) updateData.incomingShipmentItemId = body.incomingShipmentItemId;
    
    // Processing info
    if (body.processedBy !== undefined) updateData.processedBy = body.processedBy;
    if (body.processedAt !== undefined) updateData.processedAt = body.processedAt;

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
      message: 'Package updated successfully',
    });

  } catch (error) {
    console.error('Error updating package:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid customer profile ID or warehouse ID' 
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Package with this internal ID already exists' 
          },
          { status: 409 }
        );
      }

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
        message: 'Failed to update package' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('packages.delete');

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

    // Check if package exists first
    const existingPackage = await getPackageById(id);
    if (!existingPackage) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package not found' 
        },
        { status: 404 }
      );
    }

    // Check if package can be deleted (business rules)
    if (existingPackage.status === 'shipped' || existingPackage.status === 'delivered') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete shipped or delivered packages' 
        },
        { status: 400 }
      );
    }

    // Delete the package
    const success = await deletePackage(id);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to delete package' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting package:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Cannot delete package - it has related records' 
          },
          { status: 400 }
        );
      }

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
        message: 'Failed to delete package' 
      },
      { status: 500 }
    );
  }
}