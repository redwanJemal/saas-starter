// app/api/public/calculate-shipping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';

// For public access, we'll use a default tenant
const DEFAULT_TENANT_SLUG = 'default'; // This should match your system's default tenant

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      warehouseId,
      destinationCountry,
      serviceType = 'standard',
      totalChargeableWeightKg
    } = body;

    // Validation
    if (!warehouseId || !destinationCountry || !totalChargeableWeightKg) {
      return NextResponse.json(
        { error: 'Warehouse ID, destination country, and weight are required' },
        { status: 400 }
      );
    }

    if (totalChargeableWeightKg <= 0) {
      return NextResponse.json(
        { error: 'Weight must be greater than 0' },
        { status: 400 }
      );
    }

    if (!['economy', 'standard', 'express'].includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    // Get default tenant for public calculations
    const defaultTenant = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, DEFAULT_TENANT_SLUG))
      .limit(1);

    if (defaultTenant.length === 0) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      );
    }

    const tenantId = defaultTenant[0].id;

    // Calculate shipping rate using the existing service
    const rateResult = await ShippingRateCalculator.calculateRate({
      warehouseId,
      destinationCountry,
      serviceType: serviceType as 'standard' | 'express' | 'economy',
      totalChargeableWeightKg,
      tenantId,
    });

    if (!rateResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: rateResult.error || 'Unable to calculate shipping rate for this route' 
        },
        { status: 400 }
      );
    }

    // Add estimated delivery time based on service type
    const estimatedDays = {
      'economy': '7-14 days',
      'standard': '5-10 days', 
      'express': '2-5 days'
    }[serviceType as 'standard' | 'express' | 'economy'] || '5-10 days';

    // Format the response
    const response = {
      success: true,
      rate: {
        ...rateResult.rate,
        estimatedDays,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating shipping rate:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate shipping rate' 
      },
      { status: 500 }
    );
  }
}