// app/api/admin/master-data/couriers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { couriers } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('admin.manage');

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(couriers.name, `%${search}%`),
          ilike(couriers.code, `%${search}%`)
        )
      );
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
      : undefined;

    // Get couriers
    const couriersQuery = db
      .select()
      .from(couriers)
      .orderBy(couriers.name)
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      couriersQuery.where(whereClause);
    }

    const couriersList = await couriersQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(couriers)
      .where(whereClause);

    return NextResponse.json({
      couriers: couriersList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching couriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch couriers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('admin.manage');

    const body = await request.json();
    const { 
      name, 
      code, 
      websiteUrl, 
      trackingUrlTemplate, 
      supportedCountries, 
      isActive 
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Insert new courier
    const [newCourier] = await db
      .insert(couriers)
      .values({
        name,
        code: code.toUpperCase(),
        websiteUrl,
        trackingUrlTemplate,
        supportedCountries: supportedCountries || [],
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(newCourier, { status: 201 });
  } catch (error) {
    console.error('Error creating courier:', error);
    return NextResponse.json(
      { error: 'Failed to create courier' },
      { status: 500 }
    );
  }
}