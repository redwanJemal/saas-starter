// app/api/customer/currencies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { currencies } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    let currenciesQuery = db
      .select({
        id: currencies.id,
        code: currencies.code,
        name: currencies.name,
        symbol: currencies.symbol,
        decimalPlaces: currencies.decimalPlaces,
        isActive: currencies.isActive,
      })
      .from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(currencies.name)
      .limit(limit);

    // Add search filter if provided
    if (search) {
      currenciesQuery = currenciesQuery.where(
        sql`${currencies.name} ILIKE ${`%${search}%`} OR ${currencies.code} ILIKE ${`%${search}%`}`
      );
    }

    const currenciesList = await currenciesQuery;

    // If no currencies found in database, return common defaults
    if (currenciesList.length === 0) {
      const defaultCurrencies = [
        { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true },
        { id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true },
        { id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true },
        { id: 'cad', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, isActive: true },
        { id: 'aud', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isActive: true },
        { id: 'aed', code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, isActive: true },
        { id: 'sar', code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimalPlaces: 2, isActive: true },
      ];
      
      return NextResponse.json({
        currencies: defaultCurrencies,
        total: defaultCurrencies.length,
        source: 'default'
      });
    }

    return NextResponse.json({
      currencies: currenciesList,
      total: currenciesList.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}