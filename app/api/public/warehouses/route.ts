// app/api/public/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { warehouses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get all active warehouses for public access
    const warehousesQuery = await db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
        countryCode: warehouses.countryCode,
        city: warehouses.city,
        addressLine1: warehouses.addressLine1,
        addressLine2: warehouses.addressLine2,
        postalCode: warehouses.postalCode,
        stateProvince: warehouses.stateProvince,
        currencyCode: warehouses.currencyCode,
      })
      .from(warehouses)
      .orderBy(warehouses.name);

    return NextResponse.json({
      warehouses: warehousesQuery,
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}