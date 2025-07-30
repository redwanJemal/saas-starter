// app/api/admin/settings/tenant-currencies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { tenantCurrencies, currencies } from '@/features/settings/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateTenantCurrencyData } from '@/features/settings/types/settings.types';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('admin.manage');

    // Get tenant currencies with currency details
    const tenantCurrenciesList = await db
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
      .where(eq(tenantCurrencies.tenantId, adminUser.tenantId))
      .orderBy(tenantCurrencies.isDefault, currencies.name);

    return NextResponse.json({ data: tenantCurrenciesList });

  } catch (error) {
    console.error('Error fetching tenant currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant currencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('admin.manage');

    const body = await request.json();
    const data: CreateTenantCurrencyData = {
      currencyId: body.currencyId,
      isDefault: body.isDefault ?? false,
      exchangeRate: body.exchangeRate ?? '1.0',
    };

    // Check if currency already exists for this tenant
    const existingTenantCurrency = await db
      .select()
      .from(tenantCurrencies)
      .where(
        and(
          eq(tenantCurrencies.tenantId, adminUser.tenantId),
          eq(tenantCurrencies.currencyId, data.currencyId)
        )
      )
      .limit(1);

    if (existingTenantCurrency.length > 0) {
      return NextResponse.json(
        { error: 'Currency already configured for this tenant' },
        { status: 400 }
      );
    }

    // If setting as default, remove default from other currencies
    if (data.isDefault) {
      await db
        .update(tenantCurrencies)
        .set({ isDefault: false })
        .where(eq(tenantCurrencies.tenantId, adminUser.tenantId));
    }

    const [newTenantCurrency] = await db
      .insert(tenantCurrencies)
      .values({
        tenantId: adminUser.tenantId,
        currencyId: data.currencyId,
        isDefault: data.isDefault,
        exchangeRate: data.exchangeRate,
      })
      .returning();

    return NextResponse.json({ data: newTenantCurrency }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating tenant currency:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant currency' },
      { status: 400 }
    );
  }
}