// app/api/admin/settings/tenant-currencies/[id]/route.ts
import { RouteContext } from '@/lib/types/route';
import type { UpdateTenantCurrencyData } from '@/features/settings/types/settings.types';
import { requirePermission } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { tenantCurrencies, currencies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;

    const tenantCurrency = await db
      .select({
        id: tenantCurrencies.id,
        tenantId: tenantCurrencies.tenantId,
        currencyId: tenantCurrencies.currencyId,
        isDefault: tenantCurrencies.isDefault,
        exchangeRate: tenantCurrencies.exchangeRate,
        updatedAt: tenantCurrencies.updatedAt,
        currency: {
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol,
          decimalPlaces: currencies.decimalPlaces,
          symbolPosition: currencies.symbolPosition,
        }
      })
      .from(tenantCurrencies)
      .innerJoin(currencies, eq(tenantCurrencies.currencyId, currencies.id))
      .where(
        and(
          eq(tenantCurrencies.id, id),
          eq(tenantCurrencies.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (tenantCurrency.length === 0) {
      return NextResponse.json(
        { error: 'Tenant currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: tenantCurrency[0] });

  } catch (error) {
    console.error('Error fetching tenant currency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant currency' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;
    const body = await request.json();
    
    const data: UpdateTenantCurrencyData = {
      isDefault: body.isDefault,
      exchangeRate: body.exchangeRate,
    };

    // If setting as default, remove default from other currencies
    if (data.isDefault) {
      await db
        .update(tenantCurrencies)
        .set({ isDefault: false })
        .where(
          and(
            eq(tenantCurrencies.tenantId, adminUser.tenantId),
            eq(tenantCurrencies.id, id) // Don't update the current record
          )
        );
    }

    const [updatedTenantCurrency] = await db
      .update(tenantCurrencies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantCurrencies.id, id),
          eq(tenantCurrencies.tenantId, adminUser.tenantId)
        )
      )
      .returning();

    if (!updatedTenantCurrency) {
      return NextResponse.json(
        { error: 'Tenant currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedTenantCurrency });

  } catch (error: any) {
    console.error('Error updating tenant currency:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tenant currency' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;

    const result = await db
      .delete(tenantCurrencies)
      .where(
        and(
          eq(tenantCurrencies.id, id),
          eq(tenantCurrencies.tenantId, adminUser.tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Tenant currency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting tenant currency:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tenant currency' },
      { status: 400 }
    );
  }
}
