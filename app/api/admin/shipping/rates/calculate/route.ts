// app/api/admin/shipping/rates/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { calculateShippingRates } from '@/features/shipping/db/queries';
import type { RateCalculationRequest } from '@/features/shipping/types/shipping.types';
import type { ApiResponse } from '@/shared/services/api/client';

// POST /api/admin/shipping/rates/calculate - Calculate shipping rates
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('shipping.read');

    const body: RateCalculationRequest = await request.json();

    // Validate required fields
    const requiredFields = ['warehouseId', 'destinationCountryCode', 'weightKg'];
    for (const field of requiredFields) {
      if (!body[field as keyof RateCalculationRequest]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate weight
    if (body.weightKg <= 0) {
      return NextResponse.json(
        { error: 'Weight must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate country code format
    if (body.destinationCountryCode.length !== 2) {
      return NextResponse.json(
        { error: 'Destination country code must be 2 characters' },
        { status: 400 }
      );
    }

    // Validate declared value if provided
    if (body.declaredValue !== undefined && body.declaredValue < 0) {
      return NextResponse.json(
        { error: 'Declared value cannot be negative' },
        { status: 400 }
      );
    }

    // Calculate shipping rates
    const rates = await calculateShippingRates(adminUser.tenantId, body);

    const response: ApiResponse<any> = {
      success: true,
      data: rates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No shipping zone found') || 
          error.message.includes('No shipping rates found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}