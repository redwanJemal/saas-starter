// app/api/customer/addresses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { addresses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addressId = params.id;
    const body = await request.json();
    const {
      addressType,
      name,
      companyName,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      countryCode,
      phone,
      email,
      deliveryInstructions,
      isDefault,
    } = body;

    // Validate required fields
    if (!addressType || !name || !addressLine1 || !city || !postalCode || !countryCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if address belongs to current customer
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults of the same type
    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
            eq(addresses.addressType, addressType)
          )
        );
    }

    const updatedAddress = await db
      .update(addresses)
      .set({
        addressType,
        name,
        companyName: companyName || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        stateProvince: stateProvince || null,
        postalCode,
        countryCode,
        phone: phone || null,
        email: email || null,
        deliveryInstructions: deliveryInstructions || null,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, addressId))
      .returning();

    return NextResponse.json(updatedAddress[0]);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addressId = params.id;

    // Check if address belongs to current customer
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check if this address is being used in any active shipments
    // Note: You might want to add this check based on your business logic
    // const activeShipments = await db.select().from(shipments).where(
    //   or(
    //     eq(shipments.shippingAddressId, addressId),
    //     eq(shipments.billingAddressId, addressId)
    //   )
    // );
    // if (activeShipments.length > 0) {
    //   return NextResponse.json(
    //     { error: 'Cannot delete address that is being used in active shipments' },
    //     { status: 409 }
    //   );
    // }

    await db.delete(addresses).where(eq(addresses.id, addressId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}