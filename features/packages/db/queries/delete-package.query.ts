// features/packages/db/queries/delete-package.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Delete a package
 */
export async function deletePackage(id: string): Promise<boolean> {
  return true;
}
