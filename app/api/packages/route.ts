// app/api/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/features/packages/schema/package.schema';
import { customers } from '@/features/customers/schema/customer.schema';
import { eq, ilike, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');

    // Build where conditions
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(packages.status, status as any));
    }
    
    if (customerId) {
      conditions.push(eq(packages.customerId, customerId));
    }
    
    if (search) {
      conditions.push(
        sql`(${packages.trackingNumber} ILIKE ${`%${search}%`} OR ${customers.name} ILIKE ${`%${search}%`})`
      );
    }

    // Get packages with customer information
    let packagesQuery = db
      .select({
        id: packages.id,
        trackingNumber: packages.trackingNumber,
        customerId: packages.customerId,
        customerName: customers.name,
        status: packages.status,
        weight: packages.weight,
        dimensions: packages.dimensions,
        origin: packages.origin,
        destination: packages.destination,
        estimatedDelivery: packages.estimatedDelivery,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
      })
      .from(packages)
      .leftJoin(customers, eq(packages.customerId, customers.id));

    if (conditions.length > 0) {
      packagesQuery.where(and(...conditions));
    }

    const allPackages = await packagesQuery.orderBy(desc(packages.createdAt));

    // Calculate pagination
    const total = allPackages.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPackages = allPackages.slice(startIndex, endIndex);

    // Transform data to match frontend expectations
    const transformedPackages = paginatedPackages.map((pkg) => {
      // Parse dimensions if it's a string
      let dimensions;
      if (pkg.dimensions) {
        const dimString = pkg.dimensions;
        const matches = dimString.match(/(\d+\.?\d*)x(\d+\.?\d*)x(\d+\.?\d*)/);
        if (matches) {
          dimensions = {
            length: parseFloat(matches[1]),
            width: parseFloat(matches[2]),
            height: parseFloat(matches[3]),
          };
        }
      }

      // Parse weight if it's a string
      let weight;
      if (pkg.weight) {
        const weightMatch = pkg.weight.match(/(\d+\.?\d*)/);
        if (weightMatch) {
          weight = parseFloat(weightMatch[1]);
        }
      }

      return {
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        customerId: pkg.customerId,
        customerName: pkg.customerName || 'Unknown Customer',
        status: pkg.status,
        weight,
        dimensions,
        description: pkg.origin ? `Package from ${pkg.origin}` : 'Package description',
        value: 0, // TODO: Add value field to schema
        receivedAt: pkg.createdAt?.toISOString() || '',
        shippedAt: pkg.status === 'shipped' || pkg.status === 'delivered' ? pkg.updatedAt?.toISOString() : undefined,
        deliveredAt: pkg.status === 'delivered' ? pkg.updatedAt?.toISOString() : undefined,
        photos: [], // TODO: Implement photos
        notes: '', // TODO: Add notes field to schema
        createdAt: pkg.createdAt?.toISOString() || '',
        updatedAt: pkg.updatedAt?.toISOString() || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPackages,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
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

    // Validate required fields
    if (!body.trackingNumber || !body.customerId) {
      return NextResponse.json(
        { success: false, message: 'Tracking number and customer ID are required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customerExists = await db
      .select()
      .from(customers)
      .where(eq(customers.id, body.customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if tracking number already exists
    const existingPackage = await db
      .select()
      .from(packages)
      .where(eq(packages.trackingNumber, body.trackingNumber))
      .limit(1);

    if (existingPackage.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Package with this tracking number already exists' },
        { status: 409 }
      );
    }

    // Format dimensions if provided
    let dimensions = '';
    if (body.dimensions && typeof body.dimensions === 'object') {
      dimensions = `${body.dimensions.length}x${body.dimensions.width}x${body.dimensions.height}cm`;
    }

    // Format weight if provided
    let weight = '';
    if (body.weight) {
      weight = `${body.weight}kg`;
    }

    // Create new package
    const newPackageData = {
      trackingNumber: body.trackingNumber,
      customerId: body.customerId,
      status: 'pending' as const,
      weight: weight || null,
      dimensions: dimensions || null,
      origin: body.origin || null,
      destination: body.destination || null,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
    };

    const [newPackage] = await db
      .insert(packages)
      .values(newPackageData)
      .returning();

    // Get customer name for response
    const customer = customerExists[0];

    // Transform response to match frontend expectations
    const transformedPackage = {
      id: newPackage.id,
      trackingNumber: newPackage.trackingNumber,
      customerId: newPackage.customerId,
      customerName: customer.name,
      status: newPackage.status,
      weight: body.weight || null,
      dimensions: body.dimensions || null,
      description: body.description || `Package from ${newPackage.origin || 'Unknown'}`,
      value: body.value || 0,
      receivedAt: newPackage.createdAt?.toISOString() || '',
      notes: body.notes || '',
      createdAt: newPackage.createdAt?.toISOString() || '',
      updatedAt: newPackage.updatedAt?.toISOString() || '',
    };

    return NextResponse.json({
      success: true,
      data: transformedPackage,
      message: 'Package created successfully',
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create package' },
      { status: 500 }
    );
  }
}