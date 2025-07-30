// features/auth/db/queries/getUserWithProfile.ts
import { desc, and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { users } from '../schema';
import { customerProfiles } from '@/features/customers/db/schema';

/**
 * Get current authenticated user with their customer profile
 * Used for customer-facing routes that need profile data
 */
export async function getUserWithProfile() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  // Get user and join with customer profile
  const result = await db
    .select({
      user: users,
      profile: customerProfiles,
    })
    .from(users)
    .leftJoin(
      customerProfiles,
      eq(users.id, customerProfiles.userId)
    )
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}
