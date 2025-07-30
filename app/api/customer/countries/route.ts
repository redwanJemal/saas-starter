// app/api/customer/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserWithProfile } from '@/features/auth/db/queries';
import { getCountries } from '@/features/settings/db/queries';
import type { CountryFilters } from '@/features/settings/types/settings.types';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    const filters: CountryFilters = {
      search: searchParams.get('search') || undefined,
      region: searchParams.get('region') || undefined,
      isActive: true, // Only show active countries to customers
      isShippingEnabled: true, // Only show shipping-enabled countries
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getCountries(filters);
    
    // If no countries found in database, return common defaults
    if (result.data.length === 0) {
      const defaultCountries = [
        { id: 'us', code: 'US', name: 'United States', region: 'North America', phonePrefix: '+1', isActive: true, isShippingEnabled: true },
        { id: 'uk', code: 'GB', name: 'United Kingdom', region: 'Europe', phonePrefix: '+44', isActive: true, isShippingEnabled: true },
        { id: 'ca', code: 'CA', name: 'Canada', region: 'North America', phonePrefix: '+1', isActive: true, isShippingEnabled: true },
        { id: 'au', code: 'AU', name: 'Australia', region: 'Oceania', phonePrefix: '+61', isActive: true, isShippingEnabled: true },
        { id: 'de', code: 'DE', name: 'Germany', region: 'Europe', phonePrefix: '+49', isActive: true, isShippingEnabled: true },
        { id: 'fr', code: 'FR', name: 'France', region: 'Europe', phonePrefix: '+33', isActive: true, isShippingEnabled: true },
        { id: 'jp', code: 'JP', name: 'Japan', region: 'Asia', phonePrefix: '+81', isActive: true, isShippingEnabled: true },
        { id: 'sg', code: 'SG', name: 'Singapore', region: 'Asia', phonePrefix: '+65', isActive: true, isShippingEnabled: true },
        { id: 'ae', code: 'AE', name: 'United Arab Emirates', region: 'Middle East', phonePrefix: '+971', isActive: true, isShippingEnabled: true },
        { id: 'sa', code: 'SA', name: 'Saudi Arabia', region: 'Middle East', phonePrefix: '+966', isActive: true, isShippingEnabled: true },
      ];
      
      return NextResponse.json({
        data: defaultCountries,
        pagination: {
          page: 1,
          limit: 50,
          total: defaultCountries.length,
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
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}