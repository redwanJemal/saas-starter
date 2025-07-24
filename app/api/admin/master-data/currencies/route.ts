// app/api/admin/master-data/currencies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { currencies } from '@/lib/db/schema';
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
          ilike(currencies.name, `%${search}%`),
          ilike(currencies.code, `%${search}%`),
          ilike(currencies.symbol, `%${search}%`)
        )
      );
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) 
      : undefined;

    // Get currencies
    const currenciesQuery = db
      .select()
      .from(currencies)
      .orderBy(currencies.name)
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      currenciesQuery.where(whereClause);
    }

    const currenciesList = await currenciesQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(currencies)
      .where(whereClause);

    return NextResponse.json({
      currencies: currenciesList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('admin.manage');

    const body = await request.json();
    const { code, name, symbol, decimalPlaces, isActive } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Insert new currency
    const [newCurrency] = await db
      .insert(currencies)
      .values({
        code: code.toUpperCase(),
        name,
        symbol,
        decimalPlaces: decimalPlaces ?? 2,
        isActive: isActive ?? true,
      })
      .returning();

    return NextResponse.json(newCurrency, { status: 201 });
  } catch (error) {
    console.error('Error creating currency:', error);
    return NextResponse.json(
      { error: 'Failed to create currency' },
      { status: 500 }
    );
  }
}