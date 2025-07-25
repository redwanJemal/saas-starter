// app/api/admin/zones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { zones, zoneCountries } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.read');
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build where conditions
    let whereConditions = [
      eq(zones.tenantId, adminUser.tenantId)
    ];

    if (search) {
      whereConditions.push(
        or(
          ilike(zones.name, `%${search}%`),
          ilike(zones.description, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(zones.isActive, status === 'active'));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 1 ? 
      and(...whereConditions) : whereConditions[0];

    // Get zones with country count
    const zonesQuery = await db
      .select({
        id: zones.id,
        name: zones.name,
        description: zones.description,
        isActive: zones.isActive,
        createdAt: zones.createdAt,
        updatedAt: zones.updatedAt,
        countryCount: sql<number>`count(${zoneCountries.id})`,
      })
      .from(zones)
      .leftJoin(zoneCountries, eq(zones.id, zoneCountries.zoneId))
      .where(whereClause)
      .groupBy(zones.id)
      .orderBy(desc(zones.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(zones)
      .where(whereClause);

    const totalItems = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      zones: zonesQuery,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.create');
    
    const body = await request.json();
    const { name, description, isActive = true, countries = [] } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      );
    }

    // Check if zone name already exists for this tenant
    const existingZone = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.tenantId, adminUser.tenantId),
          eq(zones.name, name)
        )
      )
      .limit(1);

    if (existingZone.length > 0) {
      return NextResponse.json(
        { error: 'Zone with this name already exists' },
        { status: 400 }
      );
    }

    // Create zone in transaction
    const result = await db.transaction(async (tx) => {
      // Create the zone
      const [newZone] = await tx
        .insert(zones)
        .values({
          tenantId: adminUser.tenantId,
          name,
          description,
          isActive,
        })
        .returning();

      // Add countries if provided
      if (countries.length > 0) {
        const countryInserts = countries.map((countryCode: string) => ({
          zoneId: newZone.id,
          countryCode: countryCode.toUpperCase(),
        }));

        await tx
          .insert(zoneCountries)
          .values(countryInserts);
      }

      return newZone;
    });

    return NextResponse.json({
      message: 'Zone created successfully',
      zone: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}