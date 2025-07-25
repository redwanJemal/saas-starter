// app/api/customer/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { addresses, customerProfiles } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerProfileId, userWithProfile.customerProfile.id))
      .orderBy(addresses.isDefault, addresses.createdAt);

    return NextResponse.json(customerAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const newAddress = await db
      .insert(addresses)
      .values({
        customerProfileId: userWithProfile.customerProfile.id,
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
      })
      .returning();

    return NextResponse.json(newAddress[0], { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}