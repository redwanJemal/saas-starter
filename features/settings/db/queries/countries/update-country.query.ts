// features/settings/db/queries/countries/update-country.query.ts
import { db } from '@/lib/db';
import { countries } from '@/features/settings/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { UpdateCountryData } from '@/features/settings/types/settings.types';
import type { Country } from '@/features/settings/types/settings.types';

export async function updateCountry(id: string, data: UpdateCountryData): Promise<Country | null> {
  // If updating code, check for conflicts
  if (data.code) {
    const existingCountry = await db
      .select()
      .from(countries)
      .where(
        sql`${eq(countries.code, data.code.toUpperCase())} AND ${sql`${countries.id} != ${id}`}`
      )
      .limit(1);

    if (existingCountry.length > 0) {
      throw new Error('Country with this code already exists');
    }
  }

  const [updatedCountry] = await db
    .update(countries)
    .set({
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(countries.id, id))
    .returning();

  return updatedCountry || null;
}