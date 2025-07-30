// features/settings/db/queries/couriers/get-courier-by-id.query.ts
import { db } from '@/lib/db';
import { couriers } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';
import type { Courier } from '@/features/settings/types/settings.types';

export async function getCourierById(id: string): Promise<Courier | null> {
    const result = await db
      .select()
      .from(couriers)
      .where(eq(couriers.id, id))
      .limit(1);
  
    return result[0] || null;
  }