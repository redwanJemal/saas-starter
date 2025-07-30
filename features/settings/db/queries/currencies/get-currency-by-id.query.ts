import { db } from '@/lib/db';
import { currencies } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';
import type { Currency } from '@/features/settings/types/settings.types';

export async function getCurrencyById(id: string): Promise<Currency | null> {
    const result = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, id))
      .limit(1);
  
    return result[0] || null;
  }