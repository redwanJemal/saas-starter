// app/api/customer/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { countries } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, ilike, or, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '250');
    const search = searchParams.get('search') || '';

    // Build the base query with all conditions first
    const query = db
      .select({
        id: countries.id,
        code: countries.code,
        name: countries.name,
        region: countries.region,
        callingCode: countries.phonePrefix,
        phonePrefix: countries.phonePrefix,
        isActive: countries.isActive,
      })
      .from(countries)
      .where(eq(countries.isActive, true))
      .$dynamic();

    // Add search condition if provided
    if (search) {
      query.where(
        or(
          ilike(countries.name, `%${search}%`),
          ilike(countries.code, `%${search}%`)
        )
      );
    }

    // Execute the query with ordering and limit
    const countriesList = await query
      .orderBy(countries.name)
      .limit(limit);

    // If no countries found in database, return common defaults
    if (countriesList.length === 0) {
      const defaultCountries = [
        { id: 'us', code: 'US', name: 'United States', region: 'North America', callingCode: '+1', isActive: true },
        { id: 'ca', code: 'CA', name: 'Canada', region: 'North America', callingCode: '+1', isActive: true },
        { id: 'gb', code: 'GB', name: 'United Kingdom', region: 'Europe', callingCode: '+44', isActive: true },
        { id: 'de', code: 'DE', name: 'Germany', region: 'Europe', callingCode: '+49', isActive: true },
        { id: 'fr', code: 'FR', name: 'France', region: 'Europe', callingCode: '+33', isActive: true },
        { id: 'au', code: 'AU', name: 'Australia', region: 'Oceania', callingCode: '+61', isActive: true },
        { id: 'ae', code: 'AE', name: 'United Arab Emirates', region: 'Middle East', callingCode: '+971', isActive: true },
        { id: 'sa', code: 'SA', name: 'Saudi Arabia', region: 'Middle East', callingCode: '+966', isActive: true },
        { id: 'in', code: 'IN', name: 'India', region: 'Asia', callingCode: '+91', isActive: true },
        { id: 'cn', code: 'CN', name: 'China', region: 'Asia', callingCode: '+86', isActive: true },
        { id: 'jp', code: 'JP', name: 'Japan', region: 'Asia', callingCode: '+81', isActive: true },
        { id: 'sg', code: 'SG', name: 'Singapore', region: 'Asia', callingCode: '+65', isActive: true },
      ];
      
      return NextResponse.json({
        countries: defaultCountries,
        total: defaultCountries.length,
        source: 'default'
      });
    }

    return NextResponse.json({
      countries: countriesList,
      total: countriesList.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}