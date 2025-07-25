// app/api/admin/master-data/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { countries } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
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
          ilike(countries.name, `%${search}%`),
          ilike(countries.code, `%${search}%`),
          ilike(countries.region, `%${search}%`)
        )
      );
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
      : undefined;

    // Get countries
    const countriesQuery = db
      .select()
      .from(countries)
      .orderBy(countries.name)
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      countriesQuery.where(whereClause);
    }

    const countriesList = await countriesQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(countries)
      .where(whereClause);

    return NextResponse.json({
      countries: countriesList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('admin.manage');

    const body = await request.json();
    const { code, name, region, callingCode, isActive } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Insert new country
    const [newCountry] = await db
      .insert(countries)
      .values({
        code: code.toUpperCase(),
        name,
        region,
        isActive: isActive ?? true,
        phonePrefix: callingCode,
      })
      .returning();

    return NextResponse.json(newCountry, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { error: 'Failed to create country' },
      { status: 500 }
    );
  }
}