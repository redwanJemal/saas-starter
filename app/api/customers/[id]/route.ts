// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/features/customers/schema/customer.schema';
import { packages } from '@/features/packages/schema/package.schema';
import { eq, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get customer with package count
    const customerResult = await db
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
      .where(eq(customers.id, id))
      .groupBy(customers.id)
      .limit(1);

    if (customerResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult[0];

    // Transform data to match frontend expectations
    const transformedCustomer = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedCustomer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer' },
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

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.firstName || body.lastName) {
      const firstName = body.firstName || existingCustomer[0].name.split(' ')[0];
      const lastName = body.lastName || existingCustomer[0].name.split(' ').slice(1).join(' ');
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    if (body.address) {
      if (body.address.street !== undefined) updateData.address = body.address.street;
      if (body.address.city !== undefined) updateData.city = body.address.city;
      if (body.address.state !== undefined) updateData.state = body.address.state;
      if (body.address.country !== undefined) updateData.country = body.address.country;
      if (body.address.zipCode !== undefined) updateData.postalCode = body.address.zipCode;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();

    // Transform response to match frontend expectations
    const transformedCustomer = {
      id: updatedCustomer.id,
      email: updatedCustomer.email,
      firstName: updatedCustomer.name.split(' ')[0] || '',
      lastName: updatedCustomer.name.split(' ').slice(1).join(' ') || '',
      phone: updatedCustomer.phone,
      address: {
        street: updatedCustomer.address || '',
        city: updatedCustomer.city || '',
        state: updatedCustomer.state || '',
        zipCode: updatedCustomer.postalCode || '',
        country: updatedCustomer.country || '',
      },
      status: updatedCustomer.status,
      packageCount: 0, // TODO: Calculate actual package count
      totalSpent: 0, // TODO: Calculate from actual orders/shipments
      joinedAt: existingCustomer[0].createdAt?.toISOString() || '',
      lastActivityAt: updatedCustomer.updatedAt?.toISOString() || '',
      createdAt: existingCustomer[0].createdAt?.toISOString() || '',
      updatedAt: updatedCustomer.updatedAt?.toISOString() || '',
    };

    return NextResponse.json({
      success: true,
      data: transformedCustomer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
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

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Delete customer (packages will be handled by foreign key constraints)
    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}