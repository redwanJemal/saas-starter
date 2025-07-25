// app/api/admin/zones/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { zones, zoneCountries } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.read');
    const zoneId = params.id;

    // Get zone details with countries
    const zoneQuery = await db
      .select({
        id: zones.id,
        name: zones.name,
        description: zones.description,
        isActive: zones.isActive,
        createdAt: zones.createdAt,
        updatedAt: zones.updatedAt,
      })
      .from(zones)
      .where(
        and(
          eq(zones.id, zoneId),
          eq(zones.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (zoneQuery.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    const zone = zoneQuery[0];

    // Get countries for this zone
    const countriesQuery = await db
      .select({
        id: zoneCountries.id,
        countryCode: zoneCountries.countryCode,
        createdAt: zoneCountries.createdAt,
      })
      .from(zoneCountries)
      .where(eq(zoneCountries.zoneId, zoneId))
      .orderBy(zoneCountries.countryCode);

    return NextResponse.json({
      zone: {
        ...zone,
        countries: countriesQuery,
      },
    });
  } catch (error) {
    console.error('Error fetching zone details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.update');
    const zoneId = params.id;

    const body = await request.json();
    const { name, description, isActive, countries = [] } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      );
    }

    // Check if zone exists and belongs to tenant
    const existingZone = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.id, zoneId),
          eq(zones.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingZone.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // Check if another zone with same name exists
    const duplicateZone = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.tenantId, adminUser.tenantId),
          eq(zones.name, name),
          // Exclude current zone
          sql`${zones.id} != ${zoneId}`
        )
      )
      .limit(1);

    if (duplicateZone.length > 0) {
      return NextResponse.json(
        { error: 'Zone with this name already exists' },
        { status: 400 }
      );
    }

    // Update zone and countries in transaction
    const result = await db.transaction(async (tx) => {
      // Update the zone
      const [updatedZone] = await tx
        .update(zones)
        .set({
          name,
          description,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(zones.id, zoneId))
        .returning();

      // Delete existing countries
      await tx
        .delete(zoneCountries)
        .where(eq(zoneCountries.zoneId, zoneId));

      // Add new countries if provided
      if (countries.length > 0) {
        const countryInserts = countries.map((countryCode: string) => ({
          zoneId: zoneId,
          countryCode: countryCode.toUpperCase(),
        }));

        await tx
          .insert(zoneCountries)
          .values(countryInserts);
      }

      return updatedZone;
    });

    return NextResponse.json({
      message: 'Zone updated successfully',
      zone: result,
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.delete');
    const zoneId = params.id;

    // Check if zone exists and belongs to tenant
    const existingZone = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.id, zoneId),
          eq(zones.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingZone.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // TODO: Check if zone is being used in shipping rates or shipments
    // For now, we'll allow deletion

    // Delete zone (cascade will handle zone_countries)
    await db
      .delete(zones)
      .where(eq(zones.id, zoneId));

    return NextResponse.json({
      message: 'Zone deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
}