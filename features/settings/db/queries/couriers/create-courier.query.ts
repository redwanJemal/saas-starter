// features/settings/db/queries/couriers/create-courier.query.ts
import { db } from '@/lib/db';
import { couriers } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';
import type { NewCourier } from '@/features/settings/types/settings.types';
import type { Courier } from '@/features/settings/types/settings.types';

export async function createCourier(data: NewCourier): Promise<Courier> {
  // Check if courier code already exists
  const existingCourier = await db
    .select()
    .from(couriers)
    .where(eq(couriers.code, data.code.toUpperCase()))
    .limit(1);

  if (existingCourier.length > 0) {
    throw new Error('Courier with this code already exists');
  }

  const [newCourier] = await db
    .insert(couriers)
    .values({
      ...data,
      code: data.code.toUpperCase(),
    })
    .returning();

  return newCourier;
}