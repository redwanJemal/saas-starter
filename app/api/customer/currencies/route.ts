// app/api/customer/currencies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrencies } from '@/features/settings/db/queries';
import type { CurrencyFilters } from '@/features/settings/types/settings.types';
import { getUserWithProfile } from '@/features/auth/db/queries';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    const filters: CurrencyFilters = {
      search: searchParams.get('search') || undefined,
      isActive: true, // Only show active currencies to customers
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getCurrencies(filters);
    
    // If no currencies found in database, return common defaults
    if (result.data.length === 0) {
      const defaultCurrencies = [
        { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
        { id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
        { id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
        { id: 'cad', code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
        { id: 'aud', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
        { id: 'aed', code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, symbolPosition: 'after', isActive: true },
        { id: 'sar', code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimalPlaces: 2, symbolPosition: 'after', isActive: true },
        { id: 'jpy', code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, symbolPosition: 'before', isActive: true },
        { id: 'sgd', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, symbolPosition: 'before', isActive: true },
      ];
      
      return NextResponse.json({
        data: defaultCurrencies,
        pagination: {
          page: 1,
          limit: 50,
          total: defaultCurrencies.length,
          pages: 1,
        },
        source: 'default'
      });
    }

    return NextResponse.json({
      ...result,
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