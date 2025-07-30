// app/api/admin/settings/currencies/route.ts
import { 
    getCurrencies, 
    createCurrency 
  } from '@/features/settings/db/queries';
  import type { CurrencyFilters, NewCurrency } from '@/features/settings/types/settings.types';
  import { NextRequest, NextResponse } from 'next/server';
  import { requirePermission } from '@/lib/auth/admin';
  
  export async function GET(request: NextRequest) {
    try {
      await requirePermission('admin.manage');
  
      const searchParams = request.nextUrl.searchParams;
      
      const filters: CurrencyFilters = {
        search: searchParams.get('search') || undefined,
        isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
      };
  
      const result = await getCurrencies(filters);
      return NextResponse.json(result);
  
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
      await requirePermission('admin.manage');
  
      const body = await request.json();
      const data: NewCurrency = {
        code: body.code,
        name: body.name,
        symbol: body.symbol,
        isActive: body.isActive ?? true,
        decimalPlaces: body.decimalPlaces ?? 2,
        symbolPosition: body.symbolPosition ?? 'before',
      };
  
      const currency = await createCurrency(data);
      return NextResponse.json({ data: currency }, { status: 201 });
  
    } catch (error: any) {
      console.error('Error creating currency:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create currency' },
        { status: 400 }
      );
    }
  }