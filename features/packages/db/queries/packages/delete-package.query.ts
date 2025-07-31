// features/packages/db/queries/packages/delete-package.query.ts
import { db } from '@/lib/db';
import { packages, packageStatusHistory, packageDocuments } from '@/features/packages/db/schema';
import { eq } from 'drizzle-orm';

export async function deletePackage(id: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    try {
      // First, delete related status history records
      await tx
        .delete(packageStatusHistory)
        .where(eq(packageStatusHistory.packageId, id));

      // Delete package document relationships (not the documents themselves)
      await tx
        .delete(packageDocuments)
        .where(eq(packageDocuments.packageId, id));

      // Finally, delete the package
      const result = await tx
        .delete(packages)
        .where(eq(packages.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  });
}