// features/settings/db/queries/couriers/get-couriers.query.ts
import { couriers } from '@/features/settings/db/schema';
import type { CourierFilters, Courier } from '@/features/settings/types/settings.types';
import { PaginatedResponse } from '@/shared/types/api.types';
import { eq, ilike, or, asc, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function getCouriers(filters: CourierFilters = {}): Promise<PaginatedResponse<Courier>> {
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
    whereConditions.push(eq(couriers.isActive, isActive));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(couriers.name, `%${search}%`),
        ilike(couriers.code, `%${search}%`),
        ilike(couriers.website, `%${search}%`)
      )
    );
  }

  // Combine conditions
  const whereClause = whereConditions.length > 0
    ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
    : undefined;

  // Get couriers
  const couriersQuery = db
    .select()
    .from(couriers)
    .orderBy(asc(couriers.name))
    .limit(limit)
    .offset(offset);

  if (whereClause) {
    couriersQuery.where(whereClause);
  }

  const couriersList = await couriersQuery;

  // Get total count for pagination
  const countQuery = db
    .select({ count: count() })
    .from(couriers);

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ count: total }] = await countQuery;

  return {
    data: couriersList,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}