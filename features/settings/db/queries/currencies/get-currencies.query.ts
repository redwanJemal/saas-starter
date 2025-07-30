// features/settings/db/queries/currencies/get-currencies.query.ts
import { currencies } from '@/features/settings/db/schema';
import type { CurrencyFilters, Currency } from '@/features/settings/types/settings.types';
import { PaginatedResponse } from '@/shared/types/api.types';
import { eq, ilike, or, asc, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function getCurrencies(filters: CurrencyFilters = {}): Promise<PaginatedResponse<Currency>> {
  const {
    isActive,
    search,
    page = 1,
    limit = 50
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = [];

  if (typeof isActive === 'boolean') {
    whereConditions.push(eq(currencies.isActive, isActive));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(currencies.name, `%${search}%`),
        ilike(currencies.code, `%${search}%`),
        ilike(currencies.symbol, `%${search}%`)
      )
    );
  }

  // Combine conditions
  const whereClause = whereConditions.length > 0
    ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
    : undefined;

  // Get currencies
  const currenciesQuery = db
    .select()
    .from(currencies)
    .orderBy(asc(currencies.name))
    .limit(limit)
    .offset(offset);

  if (whereClause) {
    currenciesQuery.where(whereClause);
  }

  const currenciesList = await currenciesQuery;

  // Get total count for pagination
  const countQuery = db
    .select({ count: count() })
    .from(currencies);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ count: total }] = await countQuery;

  return {
    data: currenciesList,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}