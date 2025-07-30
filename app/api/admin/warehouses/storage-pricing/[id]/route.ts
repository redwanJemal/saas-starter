import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getStoragePricingById,
  updateStoragePricing,
  deleteStoragePricing 
} from '@/features/warehouses/db/queries';
import type { 
  UpdateStoragePricingData,
  StoragePricingResponse 
} from '@/features/warehouses/db/schema';
import { RouteContext } from '@/lib/types/route';

// Helper function defined locally to avoid Next.js route export errors
function mapToStoragePricingResponse(pricing: any): StoragePricingResponse {
  if (!pricing) return {} as StoragePricingResponse;
  
  return {
    ...pricing,
    effectiveFrom: new Date(pricing.effectiveFrom),
    effectiveUntil: pricing.effectiveUntil ? new Date(pricing.effectiveUntil) : undefined,
    createdAt: new Date(pricing.createdAt),
    updatedAt: new Date(pricing.updatedAt),
    maxDuration: pricing.maxDuration ? new Date(pricing.maxDuration) : undefined,
  };
}

// GET /api/admin/warehouses/storage-pricing/[id] - Get storage pricing by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const pricingId = (await context.params).id;
    
    // Get pricing
    const pricing = await getStoragePricingById(pricingId);
    
    if (!pricing) {
      return NextResponse.json(
        { error: 'Storage pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapToStoragePricingResponse(pricing));
  } catch (error) {
    console.error('Error fetching storage pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage pricing' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/warehouses/storage-pricing/[id] - Update storage pricing
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const pricingId = (await context.params).id;
    const body: UpdateStoragePricingData = await request.json();

    // Validate numeric fields if provided
    if (body.freeDays !== undefined && body.freeDays < 0) {
      return NextResponse.json(
        { error: 'Free days must be non-negative' },
        { status: 400 }
      );
    }

    if (body.dailyRateAfterFree !== undefined && parseFloat(body.dailyRateAfterFree) < 0) {
      return NextResponse.json(
        { error: 'Daily rate must be non-negative' },
        { status: 400 }
      );
    }

    // Update pricing
    const updatedPricing = await updateStoragePricing(pricingId, body);
    
    if (!updatedPricing) {
      return NextResponse.json(
        { error: 'Storage pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapToStoragePricingResponse(updatedPricing));
  } catch (error) {
    console.error('Error updating storage pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update storage pricing' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/warehouses/storage-pricing/[id] - Delete storage pricing
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');
    
    const pricingId = (await context.params).id;
    
    // Delete pricing
    const deleted = await deleteStoragePricing(pricingId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Storage pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Storage pricing deleted successfully' });
  } catch (error) {
    console.error('Error deleting storage pricing:', error);
    return NextResponse.json(
      { error: 'Failed to delete storage pricing' },
      { status: 500 }
    );
  }
}
