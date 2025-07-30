import { db } from "@/lib/db";
import { countries } from "@/features/settings/db/schema";
import { eq } from "drizzle-orm";
import type { Country } from "@/features/settings/types/settings.types";

// features/settings/db/queries/countries/get-country-by-id.query.ts
export async function getCountryById(id: string): Promise<Country | null> {
    const result = await db
      .select()
      .from(countries)
      .where(eq(countries.id, id))
      .limit(1);
  
    return result[0] || null;
  }
  