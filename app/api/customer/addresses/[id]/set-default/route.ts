// app/api/customer/addresses/[id]/set-default/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { addresses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { RouteContext } from '@/lib/utils/route';

export async function PUT(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addressId = (await RouteContext.params).id;
    const body = await request.json();
    const { addressType } = body;

    if (!addressType || (addressType !== 'shipping' && addressType !== 'billing')) {
      return NextResponse.json(
        { error: 'Valid address type is required' },
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
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
          eq(addresses.addressType, addressType)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Address not found or type mismatch' },
        { status: 404 }
      );
    }

    // First, unset all default addresses of this type for the customer
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(
        and(
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
          eq(addresses.addressType, addressType)
        )
      );

    // Then set the specified address as default
    const updatedAddress = await db
      .update(addresses)
      .set({ 
        isDefault: true,
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, addressId))
      .returning();

    return NextResponse.json(updatedAddress[0]);
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    );
  }
}