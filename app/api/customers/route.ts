// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/features/customers/schema/customer.schema';
import { packages } from '@/features/packages/schema/package.schema';
import { eq, ilike, and, desc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const country = searchParams.get('country');

    // Build where conditions
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(customers.status, status as any));
    }
    
    if (country) {
      conditions.push(eq(customers.country, country));
    }
    
    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.email} ILIKE ${`%${search}%`})`
      );
    }

    // Get customers with package counts and total spent calculation
    const customersQuery = db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        country: customers.country,
        postalCode: customers.postalCode,
        status: customers.status,
        notes: customers.notes,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        packageCount: count(packages.id),
      })
      .from(customers)
      .leftJoin(packages, eq(customers.id, packages.customerId))
      .groupBy(customers.id);

    if (conditions.length > 0) {
      customersQuery.where(and(...conditions));
    }

    const allCustomers = await customersQuery.orderBy(desc(customers.createdAt));

    // Calculate pagination
    const total = allCustomers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = allCustomers.slice(startIndex, endIndex);

    // Transform data to match frontend expectations
    const transformedCustomers = paginatedCustomers.map((customer) => ({
      id: customer.id,
      email: customer.email,
      firstName: customer.name.split(' ')[0] || '',
      lastName: customer.name.split(' ').slice(1).join(' ') || '',
      phone: customer.phone,
      address: {
        street: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.postalCode || '',
        country: customer.country || '',
      },
      status: customer.status,
      packageCount: customer.packageCount || 0,
      totalSpent: 0, // TODO: Calculate from actual orders/shipments
      joinedAt: customer.createdAt?.toISOString() || '',
      lastActivityAt: customer.updatedAt?.toISOString() || '',
      createdAt: customer.createdAt?.toISOString() || '',
      updatedAt: customer.updatedAt?.toISOString() || '',
    }));

    return NextResponse.json({
      success: true,
      data: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.firstName || !body.lastName || !body.address) {
      return NextResponse.json(
        { success: false, message: 'Email, first name, last name, and address are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.email, body.email))
      .limit(1);

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create new customer
    const newCustomerData = {
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      phone: body.phone || null,
      address: body.address.street || '',
      city: body.address.city || '',
      state: body.address.state || '',
      country: body.address.country || '',
      postalCode: body.address.zipCode || '',
      status: 'active' as const,
      notes: null,
    };

    const [newCustomer] = await db
      .insert(customers)
      .values(newCustomerData)
      .returning();

    // Transform response to match frontend expectations
    const transformedCustomer = {
      id: newCustomer.id,
      email: newCustomer.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: newCustomer.phone,
      address: body.address,
      status: newCustomer.status,
      packageCount: 0,
      totalSpent: 0,
      joinedAt: newCustomer.createdAt?.toISOString() || '',
      lastActivityAt: newCustomer.updatedAt?.toISOString() || '',
      createdAt: newCustomer.createdAt?.toISOString() || '',
      updatedAt: newCustomer.updatedAt?.toISOString() || '',
    };

    return NextResponse.json({
      success: true,
      data: transformedCustomer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create customer' },
      { status: 500 }
    );
  }
}