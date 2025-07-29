// app/api/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPackages, createPackage } from '@/features/packages/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');

    // Use the getPackages query function
    const result = await getPackages({
      page,
      limit,
      status: status ? status as any : undefined,
      search: search || undefined,
      customerId: customerId || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber, customerId, status, weight, dimensions, origin, destination, estimatedDelivery } = body;

    // Validate required fields
    if (!trackingNumber || !customerId) {
      return NextResponse.json(
        { error: 'Tracking number and customer ID are required' },
        { status: 400 }
      );
    }

    // Use the createPackage query function
    const newPackage = await createPackage({
      trackingNumber,
      customerId,
      status,
      weight,
      dimensions,
      origin,
      destination,
      estimatedDelivery
    });

    return NextResponse.json({ data: newPackage });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create package' },
      { status: 500 }
    );
  }
}