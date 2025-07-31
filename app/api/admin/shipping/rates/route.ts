// app/api/admin/shipping/rates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getShippingRates, createShippingRate } from '@/features/shipping/db/queries';
import type { CreateShippingRateData, ShippingRateFilters } from '@/features/shipping/types/shipping.types';
import type { ApiResponse, PaginatedResponse } from '@/shared/services/api/client';

// GET /api/admin/shipping/rates - Get shipping rates with pagination
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.read');

    const searchParams = request.nextUrl.searchParams;
    
    const filters: ShippingRateFilters = {
      warehouseId: searchParams.get('warehouseId') || undefined,
      zoneId: searchParams.get('zoneId') || undefined,
      serviceType: searchParams.get('serviceType') as any || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                 searchParams.get('isActive') === 'false' ? false : undefined,
      effectiveDate: searchParams.get('effectiveDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    // Get shipping rates with pagination
    const result = await getShippingRates(adminUser.tenantId, filters);

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shipping/rates - Create shipping rate
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.write');

    const body: CreateShippingRateData = await request.json();

    // Validate required fields
    const requiredFields = ['warehouseId', 'zoneId', 'serviceType', 'baseRate', 'perKgRate', 'minCharge', 'effectiveFrom'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateShippingRateData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields
    const numericFields = ['baseRate', 'perKgRate', 'minCharge'];
    for (const field of numericFields) {
      const value = body[field as keyof CreateShippingRateData];
      if (value && (isNaN(parseFloat(value as string)) || parseFloat(value as string) < 0)) {
        return NextResponse.json(
          { error: `${field} must be a valid positive number` },
          { status: 400 }
        );
      }
    }

    // Validate maxWeightKg if provided
    if (body.maxWeightKg && (isNaN(parseFloat(body.maxWeightKg)) || parseFloat(body.maxWeightKg) <= 0)) {
      return NextResponse.json(
        { error: 'maxWeightKg must be a valid positive number' },
        { status: 400 }
      );
    }

    // Validate service type
    const validServiceTypes = ['standard', 'express', 'economy'];
    if (!validServiceTypes.includes(body.serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    // Create shipping rate
    const newRate = await createShippingRate(adminUser.tenantId, body);

    const response: ApiResponse<any> = {
      success: true,
      data: newRate,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('overlapping')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create shipping rate' },
      { status: 500 }
    );
  }
}