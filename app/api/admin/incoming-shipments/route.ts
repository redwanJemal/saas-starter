// app/api/admin/incoming-shipments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getIncomingShipments, 
  createIncomingShipment 
} from '@/features/packages/db/queries';
import type { CreateIncomingShipmentData } from '@/features/packages/types/package.types';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const searchParams = request.nextUrl.searchParams;
    
    // Extract and validate query parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      courierName: searchParams.get('courierName') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: Math.min(
        searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
        100 // Maximum limit
      ),
    };

    // Get incoming shipments using the query function
    const result = await getIncomingShipments(filters);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching incoming shipments:', error);
    
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
        message: 'Failed to fetch incoming shipments' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create');

    // Parse and validate request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.warehouseId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Warehouse ID is required' 
        },
        { status: 400 }
      );
    }

    if (!body.batchReference) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Batch reference is required' 
        },
        { status: 400 }
      );
    }

    const shipmentData: CreateIncomingShipmentData = {
      warehouseId: body.warehouseId,
      batchReference: body.batchReference,
      courierId: body.courierId,
      courierName: body.courierName,
      trackingNumber: body.trackingNumber,
      arrivalDate: body.arrivalDate,
      expectedArrivalDate: body.expectedArrivalDate,
      actualArrivalDate: body.actualArrivalDate,
      status: body.status,
      notes: body.notes,
      metadata: body.metadata,
    };

    // Create the incoming shipment
    const result = await createIncomingShipment(shipmentData, adminUser.id);

    // Return the created shipment with success response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Incoming shipment created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating incoming shipment:', error);
    
    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid warehouse ID or courier ID' 
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Incoming shipment with this batch reference already exists' 
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
        message: 'Failed to create incoming shipment' 
      },
      { status: 500 }
    );
  }
}