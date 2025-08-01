// app/api/admin/packages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getPackages, 
  createPackage, 
  getPackageById,
  getPackageByIncomingShipmentItemId,
  updateIncomingShipmentItem,
  markIncomingShipmentAsReceived 
} from '@/features/packages/db/queries';
import type { CreatePackageData, PackageFilters } from '@/features/packages/types/package.types';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const searchParams = request.nextUrl.searchParams;
    
    // Extract and validate query parameters
    const filters: PackageFilters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      customerProfileId: searchParams.get('customerProfileId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      senderName: searchParams.get('senderName') || undefined,
      trackingNumber: searchParams.get('trackingNumber') || undefined,
      isHighValue: searchParams.get('isHighValue') ? searchParams.get('isHighValue') === 'true' : undefined,
      isFragile: searchParams.get('isFragile') ? searchParams.get('isFragile') === 'true' : undefined,
      isRestricted: searchParams.get('isRestricted') ? searchParams.get('isRestricted') === 'true' : undefined,
      hasDocuments: searchParams.get('hasDocuments') ? searchParams.get('hasDocuments') === 'true' : undefined,
      internalId: searchParams.get('internalId') || undefined,
      suiteCode: searchParams.get('suiteCode') || undefined,
      courierName: searchParams.get('courierName') || undefined,
      batchReference: searchParams.get('batchReference') || undefined,
      estimatedValueMin: searchParams.get('estimatedValueMin') ? 
        parseFloat(searchParams.get('estimatedValueMin')!) : undefined,
      estimatedValueMax: searchParams.get('estimatedValueMax') ? 
        parseFloat(searchParams.get('estimatedValueMax')!) : undefined,
      weightMin: searchParams.get('weightMin') ? 
        parseFloat(searchParams.get('weightMin')!) : undefined,
      weightMax: searchParams.get('weightMax') ? 
        parseFloat(searchParams.get('weightMax')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: Math.min(
        searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
        100 // Maximum limit
      ),
    };

    // Get packages using the query function
    const result = await getPackages(filters);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching packages:', error);
    
    // Handle specific error types
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
        message: 'Failed to fetch packages' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const adminUser = await requirePermission('packages.write');
    // Parse request body
    const body = await request.json();
    
    // Check if a package already exists for this incoming shipment item
    if (body.incomingShipmentItemId) {
      const existingPackage = await getPackageByIncomingShipmentItemId(body.incomingShipmentItemId);
      if (existingPackage) {
        return NextResponse.json({
          success: false,
          message: 'A package already exists for this incoming shipment item',
          data: existingPackage
        }, { status: 400 });
      }
    }

    // Prepare package data
    const packageData: CreatePackageData = {
      tenantId: adminUser.tenantId,
      // Customer reference
      customerProfileId: body.customerProfileId,
      suiteCodeCaptured: body.suiteCodeCaptured,
      
      // Package identification
      internalId: body.internalId,
      trackingNumberInbound: body.trackingNumberInbound,
      trackingNumberOutbound: body.trackingNumberOutbound,
      
      // Sender information
      senderName: body.senderName,
      senderCompany: body.senderCompany,
      senderAddress: body.senderAddress,
      senderCity: body.senderCity,
      senderCountryCode: body.senderCountryCode,
      senderPostalCode: body.senderPostalCode,
      senderPhone: body.senderPhone,
      senderEmail: body.senderEmail,
      senderTrackingUrl: body.senderTrackingUrl,
      
      // Package details
      description: body.description,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : undefined,
      estimatedValueCurrency: body.estimatedValueCurrency,
      
      // Physical characteristics
      weightActualKg: body.weightActualKg ? parseFloat(body.weightActualKg) : undefined,
      lengthCm: body.lengthCm ? parseFloat(body.lengthCm) : undefined,
      widthCm: body.widthCm ? parseFloat(body.widthCm) : undefined,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : undefined,
      volumetricWeightKg: body.volumetricWeightKg ? parseFloat(body.volumetricWeightKg) : undefined,
      chargeableWeightKg: body.chargeableWeightKg ? parseFloat(body.chargeableWeightKg) : undefined,
      
      // Status and dates
      status: body.status,
      expectedArrivalDate: body.expectedArrivalDate,
      receivedAt: body.receivedAt,
      readyToShipAt: body.readyToShipAt,
      storageExpiresAt: body.storageExpiresAt,
      
      // Warehouse assignment
      warehouseId: body.warehouseId ?? '8689f564-e3f8-46c6-8d37-a087adbe6f61',
      
      // Notes and instructions
      warehouseNotes: body.warehouseNotes,
      customerNotes: body.customerNotes,
      specialInstructions: body.specialInstructions,
      
      // Package characteristics
      isFragile: Boolean(body.isFragile),
      isHighValue: Boolean(body.isHighValue),
      requiresAdultSignature: Boolean(body.requiresAdultSignature),
      isRestricted: Boolean(body.isRestricted),
      
      // Customs information
      customsDeclaration: body.customsDeclaration,
      customsValue: body.customsValue ? parseFloat(body.customsValue) : undefined,
      customsValueCurrency: body.customsValueCurrency,
      countryOfOrigin: body.countryOfOrigin,
      hsCode: body.hsCode,
      
      // Pre-receiving workflow
      incomingShipmentItemId: body.incomingShipmentItemId,
    };

    // Create the package
    const result = await createPackage(packageData, adminUser.id);

    // Update the incoming shipment item status to received
    if (body.incomingShipmentItemId) {
      await updateIncomingShipmentItem(
        body.incomingShipmentItemId, 
        { 
          assignmentStatus: 'received' 
        }, 
        adminUser.id
      );
    }

    // Return the created package with success response
    return NextResponse.json({
      success: true,
      data: result.package,
      message: 'Package created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating package:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Handle validation errors
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
        message: 'Failed to create package' 
      },
      { status: 500 }
    );
  }
}