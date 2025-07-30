// features/settings/db/queries/currencies/update-currency.query.ts
import { db } from '@/lib/db';
import { currencies } from '@/features/settings/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { UpdateCurrencyData } from '@/features/settings/types/settings.types';
import type { Currency } from '@/features/settings/types/settings.types';

export async function updateCurrency(id: string, data: UpdateCurrencyData): Promise<Currency | null> {
  // If updating code, check for conflicts
  if (data.code) {
    const existingCurrency = await db
      .select()
      .from(currencies)
      .where(
        sql`${eq(currencies.code, data.code.toUpperCase())} AND ${sql`${currencies.id} != ${id}`}`
      )
      .limit(1);

    if (existingCurrency.length > 0) {
      throw new Error('Currency with this code already exists');
    }
  }

  const [updatedCurrency] = await db
    .update(currencies)
    .set({
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(currencies.id, id))
    .returning();

  return updatedCurrency || null;
}
