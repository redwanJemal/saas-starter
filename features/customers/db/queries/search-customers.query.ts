// Add this function to features/customers/db/queries.ts

import { eq, and, or, ilike, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/features/auth/db/schema';
import { customerProfiles } from '../schema';

/**
 * Search customers for admin with minimal fields (name, email, customerId, id)
 */
export async function searchCustomersForAdmin(
  tenantId: string,
  searchQuery: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  name: string;
  email: string;
  customerId: string;
}>> {
  const customers = await db
    .select({
      id: customerProfiles.id,
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
      customerId: customerProfiles.customerId,
    })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(
      and(
        eq(customerProfiles.tenantId, tenantId),
        isNull(users.deletedAt),
        or(
          ilike(users.firstName, `%${searchQuery}%`),
          ilike(users.lastName, `%${searchQuery}%`),
          ilike(users.email, `%${searchQuery}%`),
          ilike(customerProfiles.customerId, `%${searchQuery}%`)
        )
      )
    )
    .limit(limit)
    .orderBy(users.firstName, users.lastName);

  return customers;
}