// features/settings/db/queries/currencies/delete-currency.query.ts
import { db } from '@/lib/db';
import { currencies } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCurrency(id: string): Promise<boolean> {
    // Check if currency is used in tenant configurations, pricing, etc.
    // Add checks here as needed
  
    const result = await db
      .delete(currencies)
      .where(eq(currencies.id, id))
      .returning();
  
    return result.length > 0;
  }