// app/api/admin/settings/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getCountries, 
  createCountry 
} from '@/features/settings/db/queries';
import type { CountryFilters, NewCountry } from '@/features/settings/types/settings.types';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('admin.manage');

    const searchParams = request.nextUrl.searchParams;
    
    const filters: CountryFilters = {
      search: searchParams.get('search') || undefined,
      region: searchParams.get('region') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      isShippingEnabled: searchParams.get('isShippingEnabled') ? searchParams.get('isShippingEnabled') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getCountries(filters);
    return NextResponse.json(result);

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
    await requirePermission('admin.manage');

    const body = await request.json();
    const data: NewCountry = {
      code: body.code,
      name: body.name,
      region: body.region,
      subregion: body.subregion,
      isActive: body.isActive ?? true,
      isShippingEnabled: body.isShippingEnabled ?? true,
      requiresPostalCode: body.requiresPostalCode ?? true,
      requiresStateProvince: body.requiresStateProvince ?? false,
      euMember: body.euMember ?? false,
      customsFormType: body.customsFormType,
      flagEmoji: body.flagEmoji,
      phonePrefix: body.phonePrefix,
    };

    const country = await createCountry(data);
    return NextResponse.json({ data: country }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create country' },
      { status: 400 }
    );
  }
}