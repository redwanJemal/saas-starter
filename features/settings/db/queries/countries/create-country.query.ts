
  // features/settings/db/queries/countries/create-country.query.ts
  import { db } from '@/lib/db';
  import { countries } from '@/features/settings/db/schema';
  import { eq } from 'drizzle-orm';
  import type { NewCountry } from '@/features/settings/types/settings.types';
  import type { Country } from '@/features/settings/types/settings.types';
  
  export async function createCountry(data: NewCountry): Promise<Country> {
    // Check if country code already exists
    const existingCountry = await db
      .select()
      .from(countries)
      .where(eq(countries.code, data.code.toUpperCase()))
      .limit(1);
  
    if (existingCountry.length > 0) {
      throw new Error('Country with this code already exists');
    }
  
    const [newCountry] = await db
      .insert(countries)
      .values({
        ...data,
        code: data.code.toUpperCase(),
      })
      .returning();
  
    return newCountry;
  }