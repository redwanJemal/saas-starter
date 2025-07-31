// features/shipping/db/queries/zones/get-zones.query.ts

import { db } from '@/lib/db';
import { zones, zoneCountries } from '../../schema';
import { countries } from '@/features/settings/db/schema';
import { and, eq, desc, ilike, or, count, sql, SQL } from 'drizzle-orm';
import type { Zone, ZoneFilters } from '../../../types/shipping.types';
import { PaginatedResponse } from '@/shared/types/api.types';

export async function getZones(
  tenantId: string,
  filters: ZoneFilters = {}
): Promise<PaginatedResponse<Zone>> {
  const {
    isActive,
    search,
    page = 1,
    limit = 10
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions: SQL<unknown>[] = [];

  // Always filter by tenant
  whereConditions.push(eq(zones.tenantId, tenantId));

  if (typeof isActive === 'boolean') {
    whereConditions.push(eq(zones.isActive, isActive));
  }

  if (search) {
    whereConditions.push(
      sql`(${zones.name} ILIKE ${`%${search}%`} OR ${zones.description} ILIKE ${`%${search}%`})`
    );
  }

  // Define the base query with proper typing
  const baseQuery = db
    .select({
      id: zones.id,
      tenantId: zones.tenantId,
      name: zones.name,
      description: zones.description,
      isActive: zones.isActive,
      createdAt: zones.createdAt,
      updatedAt: zones.updatedAt,
      countryCount: sql<number>`count(${zoneCountries.id})`,
    })
    .from(zones)
    .leftJoin(zoneCountries, eq(zones.id, zoneCountries.zoneId))
    .groupBy(zones.id);

  // Filter out any undefined conditions and apply them
  const validConditions = whereConditions.filter(Boolean);
  const finalQuery = validConditions.length > 0 
    ? baseQuery.where(and(...validConditions))
    : baseQuery;

  // Execute query with ordering and pagination
  const zonesQuery = await finalQuery
    .orderBy(desc(zones.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const totalCountQuery = await (whereConditions.length > 0 
    ? db.select({ count: sql<number>`count(*)` })
        .from(zones)
        .where(and(...whereConditions))
    : db.select({ count: sql<number>`count(*)` })
        .from(zones));

  const totalItems = totalCountQuery[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Transform to Zone type
  const transformedZones: Zone[] = zonesQuery.map((zone: typeof zones.$inferSelect & { countryCount: number }) => ({
    id: zone.id,
    tenantId: zone.tenantId,
    name: zone.name,
    description: zone.description || undefined,
    isActive: zone.isActive || false,
    createdAt: zone.createdAt.toISOString(),
    updatedAt: zone.updatedAt.toISOString(),
    countryCount: zone.countryCount,
  }));

  return {
    data: transformedZones,
    pagination: {
      page,
      limit,
      total: totalItems,
      pages: totalPages
    },
  };
}