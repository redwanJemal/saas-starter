// app/api/packages/bulk-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/features/packages/schema/package.schema';
import { customers } from '@/features/customers/schema/customer.schema';
import { inArray, eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Package IDs array is required' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'returned'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if all packages exist
    const existingPackages = await db
      .select({ id: packages.id })
      .from(packages)
      .where(inArray(packages.id, body.ids));

    if (existingPackages.length !== body.ids.length) {
      return NextResponse.json(
        { success: false, message: 'One or more packages not found' },
        { status: 404 }
      );
    }

    // Update package statuses
    const updatedPackages = await db
      .update(packages)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(inArray(packages.id, body.ids))
      .returning();

    // Get updated packages with customer information
    const packagesWithCustomers = await db
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
      .leftJoin(customers, eq(packages.customerId, customers.id))
      .where(inArray(packages.id, body.ids));

    // Transform data to match frontend expectations
    const transformedPackages = packagesWithCustomers.map((pkg) => {
      // Parse dimensions if it's a string
      let dimensions;
      if (pkg.dimensions) {
        const matches = pkg.dimensions.match(/(\d+\.?\d*)x(\d+\.?\d*)x(\d+\.?\d*)/);
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
      message: `Successfully updated ${updatedPackages.length} packages to ${body.status}`,
    });
  } catch (error) {
    console.error('Error bulk updating package status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update package status' },
      { status: 500 }
    );
  }
}