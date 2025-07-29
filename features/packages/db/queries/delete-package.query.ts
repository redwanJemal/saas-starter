// features/packages/db/queries/delete-package.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { eq } from 'drizzle-orm';

/**
 * Delete a package
 */
export async function deletePackage(id: string): Promise<boolean> {
  // Check if package exists
  const existingPackage = await db
    .select()
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  if (existingPackage.length === 0) {
    return false;
  }

  // Delete package
  await db.delete(packages).where(eq(packages.id, id));
  return true;
}
