// features/settings/db/queries/currencies/create-currency.query.ts
import { db } from '@/lib/db';
import { currencies } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';
import type { NewCurrency } from '@/features/settings/types/settings.types';
import type { Currency } from '@/features/settings/types/settings.types';

export async function createCurrency(data: NewCurrency): Promise<Currency> {
  // Check if currency code already exists
  const existingCurrency = await db
    .select()
    .from(currencies)
    .where(eq(currencies.code, data.code.toUpperCase()))
    .limit(1);

  if (existingCurrency.length > 0) {
    throw new Error('Currency with this code already exists');
  }

  const [newCurrency] = await db
    .insert(currencies)
    .values({
      ...data,
      code: data.code.toUpperCase(),
    })
    .returning();

  return newCurrency;
}