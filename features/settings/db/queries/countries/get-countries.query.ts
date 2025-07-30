// features/settings/db/queries/countries/get-countries.query.ts
import { db } from '@/lib/db';
import { countries } from '@/features/settings/db/schema';
import { eq, ilike, or, asc, desc, count, sql } from 'drizzle-orm';
import type { CountryFilters, Country } from '@/features/settings/types/settings.types';
import { PaginatedResponse } from '@/shared/types/api.types';

export async function getCountries(filters: CountryFilters = {}): Promise<PaginatedResponse<Country>> {
  const {
    isActive,
    isShippingEnabled,
    region,
    search,
    page = 1,
    limit = 50
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = [];

  if (typeof isActive === 'boolean') {
    whereConditions.push(eq(countries.isActive, isActive));
  }

  if (typeof isShippingEnabled === 'boolean') {
    whereConditions.push(eq(countries.isShippingEnabled, isShippingEnabled));
  }

  if (region) {
    whereConditions.push(eq(countries.region, region));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(countries.name, `%${search}%`),
        ilike(countries.code, `%${search}%`),
        ilike(countries.region, `%${search}%`)
      )
    );
  }

  // Combine conditions
  const whereClause = whereConditions.length > 0
    ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
    : undefined;

  // Get countries
  const countriesQuery = db
    .select()
    .from(countries)
    .orderBy(asc(countries.name))
    .limit(limit)
    .offset(offset);

  if (whereClause) {
    countriesQuery.where(whereClause);
  }

  const countriesList = await countriesQuery;

  // Get total count for pagination
  const countQuery = db
    .select({ count: count() })
    .from(countries);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ count: total }] = await countQuery;

  return {
    data: countriesList,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
