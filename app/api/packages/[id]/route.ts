// app/api/packages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages } from '@/features/packages/schema/package.schema';
import { customers } from '@/features/customers/schema/customer.schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get package with customer information
    const packageResult = await db
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
      .where(eq(packages.id, id))
      .limit(1);

    if (packageResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    const pkg = packageResult[0];

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

    // Transform data to match frontend expectations
    const transformedPackage = {
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

    return NextResponse.json({
      success: true,
      data: transformedPackage,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if package exists
    const existingPackage = await db
      .select()
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    if (existingPackage.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.weight !== undefined) {
      updateData.weight = body.weight ? `${body.weight}kg` : null;
    }

    if (body.dimensions !== undefined && typeof body.dimensions === 'object') {
      updateData.dimensions = `${body.dimensions.length}x${body.dimensions.width}x${body.dimensions.height}cm`;
    }

    if (body.origin !== undefined) {
      updateData.origin = body.origin;
    }

    if (body.destination !== undefined) {
      updateData.destination = body.destination;
    }

    if (body.estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null;
    }

    // Update package
    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, id))
      .returning();

    // Get customer name for response
    const customerResult = await db
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.id, updatedPackage.customerId))
      .limit(1);

    const customerName = customerResult.length > 0 ? customerResult[0].name : 'Unknown Customer';

    // Parse dimensions for response
    let dimensions;
    if (updatedPackage.dimensions) {
      const matches = updatedPackage.dimensions.match(/(\d+\.?\d*)x(\d+\.?\d*)x(\d+\.?\d*)/);
      if (matches) {
        dimensions = {
          length: parseFloat(matches[1]),
          width: parseFloat(matches[2]),
          height: parseFloat(matches[3]),
        };
      }
    }

    // Parse weight for response
    let weight;
    if (updatedPackage.weight) {
      const weightMatch = updatedPackage.weight.match(/(\d+\.?\d*)/);
      if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
      }
    }

    // Transform response to match frontend expectations
    const transformedPackage = {
      id: updatedPackage.id,
      trackingNumber: updatedPackage.trackingNumber,
      customerId: updatedPackage.customerId,
      customerName,
      status: updatedPackage.status,
      weight,
      dimensions,
      description: updatedPackage.origin ? `Package from ${updatedPackage.origin}` : 'Package description',
      value: 0, // TODO: Add value field to schema
      receivedAt: existingPackage[0].createdAt?.toISOString() || '',
      shippedAt: updatedPackage.status === 'shipped' || updatedPackage.status === 'delivered' ? updatedPackage.updatedAt?.toISOString() : undefined,
      deliveredAt: updatedPackage.status === 'delivered' ? updatedPackage.updatedAt?.toISOString() : undefined,
      photos: [], // TODO: Implement photos
      notes: '', // TODO: Add notes field to schema
      createdAt: existingPackage[0].createdAt?.toISOString() || '',
      updatedAt: updatedPackage.updatedAt?.toISOString() || '',
    };

    return NextResponse.json({
      success: true,
      data: transformedPackage,
      message: 'Package updated successfully',
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if package exists
    const existingPackage = await db
      .select()
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    if (existingPackage.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Package not found' },
        { status: 404 }
      );
    }

    // Delete package
    await db.delete(packages).where(eq(packages.id, id));

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete package' },
      { status: 500 }
    );
  }
}