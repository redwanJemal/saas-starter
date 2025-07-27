// app/api/public/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { countries } from '@/lib/db/schema';
import { eq, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '250');
    const search = searchParams.get('search') || '';

    // Build the query with conditional where clauses
    const query = db
      .select({
        id: countries.id,
        code: countries.code,
        name: countries.name,
        region: countries.region,
        subregion: countries.subregion,
        phonePrefix: countries.phonePrefix,
        isActive: countries.isActive,
        isShippingEnabled: countries.isShippingEnabled,
      })
      .from(countries)
      .where((search
        ? or(
            ilike(countries.name, `%${search}%`),
            ilike(countries.code, `%${search}%`)
          )
        : undefined,
        eq(countries.isActive, true)
      ));

    // Execute query with ordering and limit
    const countriesList = await query
      .orderBy(countries.name)
      .limit(limit);

    return NextResponse.json({
      countries: countriesList,
      total: countriesList.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}