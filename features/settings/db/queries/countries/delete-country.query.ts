// features/settings/db/queries/countries/delete-country.query.ts
import { db } from '@/lib/db';
import { countries } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCountry(id: string): Promise<boolean> {
    // Check if country is used in zones, warehouses, or addresses
    // Add checks here as needed
  
    const result = await db
      .delete(countries)
      .where(eq(countries.id, id))
      .returning();
  
    return result.length > 0;
  }