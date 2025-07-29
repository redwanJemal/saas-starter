// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, createCustomer, searchCustomers } from '@/features/customers/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const country = searchParams.get('country');

    // Use the getCustomers query function
    const result = await getCustomers({
      page,
      limit,
      status: status ? status as any : undefined,
      search: search || undefined,
      country: country || undefined
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, state, country, postalCode, status, notes } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Use the createCustomer query function
    const newCustomer = await createCustomer({
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      status: status || 'pending',
      notes
    });

    return NextResponse.json({ data: newCustomer });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
