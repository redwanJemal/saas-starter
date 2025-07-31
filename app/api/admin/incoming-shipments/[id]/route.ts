// app/api/admin/incoming-shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getIncomingShipmentById, 
  updateIncomingShipment, 
  deleteIncomingShipment 
} from '@/features/packages/db/queries';
import { RouteContext } from '@/lib/types/route';


export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const shipment = await getIncomingShipmentById(id);

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('Error fetching incoming shipment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch incoming shipment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Get user ID from auth context
    const updatedBy = 'your-user-id'; // Replace with actual user ID extraction

    const updatedShipment = await updateIncomingShipment(id, body, updatedBy);

    return NextResponse.json({
      success: true,
      data: updatedShipment,
      message: 'Incoming shipment updated successfully',
    });
  } catch (error) {
    console.error('Error updating incoming shipment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update incoming shipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const success = await deleteIncomingShipment(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Incoming shipment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting incoming shipment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete incoming shipment' },
      { status: 500 }
    );
  }
}