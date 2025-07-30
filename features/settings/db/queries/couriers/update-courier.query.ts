// features/settings/db/queries/couriers/update-courier.query.ts
import { db } from '@/lib/db';
import { couriers } from '@/features/settings/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { UpdateCourierData } from '@/features/settings/types/settings.types';
import type { Courier } from '@/features/settings/types/settings.types';

export async function updateCourier(id: string, data: UpdateCourierData): Promise<Courier | null> {
  // If updating code, check for conflicts
  if (data.code) {
    const existingCourier = await db
      .select()
      .from(couriers)
      .where(
        sql`${eq(couriers.code, data.code.toUpperCase())} AND ${sql`${couriers.id} != ${id}`}`
      )
      .limit(1);

    if (existingCourier.length > 0) {
      throw new Error('Courier with this code already exists');
    }
  }

  const [updatedCourier] = await db
    .update(couriers)
    .set({
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(couriers.id, id))
    .returning();

  return updatedCourier || null;
}