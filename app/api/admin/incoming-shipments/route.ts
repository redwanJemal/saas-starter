// app/api/admin/incoming-shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  createIncomingShipmentWithItems, 
  getIncomingShipments 
} from '@/features/packages/db/queries';
import type { 
  CreateIncomingShipmentData, 
  IncomingShipmentFilters,
  CreateIncomingShipmentItemData 
} from '@/features/packages/types/package.types';


// GET /api/admin/incoming-shipments - Get incoming shipments with filtering
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.read');
    const { searchParams } = new URL(request.url);

    // Parse status array correctly from query params like status[]=pending&status[]=scanning
    const statusParams = searchParams.getAll('status[]');
    const status = statusParams.length > 0 ? statusParams : 
      (searchParams.get('status') ? [searchParams.get('status')!] : undefined);

    const filters: IncomingShipmentFilters = {
      status: status as any,
      warehouseId: searchParams.get('warehouseId') || undefined,
      courierName: searchParams.get('courierName') || undefined,
      batchReference: searchParams.get('batchReference') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    console.log('🔍 Incoming shipments filters:', filters);

    const result = await getIncomingShipments(adminUser.tenantId, filters);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fetch incoming shipments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('❌ Error fetching incoming shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incoming shipments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/incoming-shipments - Create a new incoming shipment
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.write');
    const body = await request.json();

    console.log('📨 Received request body:', JSON.stringify(body, null, 2));

    // Generate batch reference if not provided
    const generateBatchReference = (): string => {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = date.toTimeString().slice(0, 5).replace(':', '');
      return `BATCH-${dateStr}-${timeStr}`;
    };

    // Validate required fields
    if (!body.warehouseId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'warehouseId is required' 
        },
        { status: 400 }
      );
    }

    // Prepare shipment data
    const shipmentData: CreateIncomingShipmentData = {
      tenantId: adminUser.tenantId,
      warehouseId: body.warehouseId,
      batchReference: body.batchReference || generateBatchReference(),
      courierId: body.courierId,
      courierName: body.courierName,
      arrivalDate: body.arrivalDate,
      expectedArrivalDate: body.expectedArrivalDate,
      actualArrivalDate: body.actualArrivalDate,
      status: body.status || 'pending',
      notes: body.notes,
    };

    console.log('📦 Prepared shipment data:', JSON.stringify(shipmentData, null, 2));

    // Process tracking numbers from the request
    const trackingNumbers = body.trackingNumbers || [];
    console.log('📋 Raw tracking numbers:', trackingNumbers);
    console.log('📋 Tracking numbers type:', typeof trackingNumbers);
    console.log('📋 Is array:', Array.isArray(trackingNumbers));

    // Prepare tracking numbers as items
    const itemsData: Omit<CreateIncomingShipmentItemData, 'incomingShipmentId'>[] = [];

    if (Array.isArray(trackingNumbers) && trackingNumbers.length > 0) {
      console.log('✅ Processing tracking numbers array...');
      
      for (const trackingNumber of trackingNumbers) {
        if (trackingNumber && trackingNumber.trim()) {
          console.log('📦 Adding tracking number:', trackingNumber.trim());
          
          itemsData.push({
            tenantId: adminUser.tenantId,
            warehouseId: body.warehouseId,
            trackingNumber: trackingNumber.trim(),
            courierName: body.courierName,
            scannedBy: adminUser.id,
            scannedAt: new Date(),
            assignmentStatus: 'unassigned',
          });
        }
      }
    } else {
      console.log('⚠️ No valid tracking numbers array found');
    }

    console.log('📦 Prepared items data:', JSON.stringify(itemsData, null, 2));
    console.log('📊 Items count:', itemsData.length);

    // Create shipment with items in a single transaction
    const result = await createIncomingShipmentWithItems(shipmentData, itemsData);

    console.log('✅ Created shipment:', result.shipment.id);
    console.log('✅ Created items count:', result.items.length);

    return NextResponse.json({
      success: true,
      data: {
        ...result.shipment,
        items: result.items,
        itemCount: result.items.length,
      },
      message: `Incoming shipment created successfully with ${result.items.length} items`,
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating incoming shipment:', error);
    
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
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
            message: 'Batch reference already exists' 
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