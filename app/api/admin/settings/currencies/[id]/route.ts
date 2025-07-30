// app/api/admin/settings/currencies/[id]/route.ts
import { 
    getCurrencyById, 
    updateCurrency, 
    deleteCurrency 
  } from '@/features/settings/db/queries';
  import type { UpdateCurrencyData } from '@/features/settings/types/settings.types';
  import { NextRequest, NextResponse } from 'next/server';
  import { requirePermission } from '@/lib/auth/admin';
  import { RouteContext } from '@/lib/types/route';
  
  export async function GET(
    request: NextRequest,
    context: RouteContext
  ) {
    try {
      await requirePermission('admin.manage');
      
      const { id } = await context.params;
      const currency = await getCurrencyById(id);
  
      if (!currency) {
        return NextResponse.json(
          { error: 'Currency not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ data: currency });
  
    } catch (error) {
      console.error('Error fetching currency:', error);
      return NextResponse.json(
        { error: 'Failed to fetch currency' },
        { status: 500 }
      );
    }
  }
  
  export async function PATCH(
    request: NextRequest,
    context: RouteContext
  ) {
    try {
      await requirePermission('admin.manage');
      
      const { id } = await context.params;
      const body = await request.json();
      
      const data: UpdateCurrencyData = {
        code: body.code,
        name: body.name,
        symbol: body.symbol,
        isActive: body.isActive,
        decimalPlaces: body.decimalPlaces,
        symbolPosition: body.symbolPosition,
      };
  
      const currency = await updateCurrency(id, data);
  
      if (!currency) {
        return NextResponse.json(
          { error: 'Currency not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ data: currency });
  
    } catch (error: any) {
      console.error('Error updating currency:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update currency' },
        { status: 400 }
      );
    }
  }
  
  export async function DELETE(
    request: NextRequest,
    context: RouteContext
  ) {
    try {
      await requirePermission('admin.manage');
      
      const { id } = await context.params;
      const success = await deleteCurrency(id);
  
      if (!success) {
        return NextResponse.json(
          { error: 'Currency not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ success: true });
  
    } catch (error: any) {
      console.error('Error deleting currency:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete currency' },
        { status: 400 }
      );
    }
  }