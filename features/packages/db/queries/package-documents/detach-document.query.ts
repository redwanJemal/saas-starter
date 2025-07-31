// features/packages/db/queries/package-documents/detach-document.query.ts

import { db } from '@/lib/db';
import { packageDocuments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function detachDocument(
  packageId: string,
  documentId: string
): Promise<boolean> {
  try {
    // Check if the document is attached to the package
    const [existingAttachment] = await db
      .select()
      .from(packageDocuments)
      .where(
        and(
          eq(packageDocuments.packageId, packageId),
          eq(packageDocuments.documentId, documentId)
        )
      )
      .limit(1);

    if (!existingAttachment) {
      throw new Error('Document is not attached to this package');
    }

    // Delete the package document relationship
    await db
      .delete(packageDocuments)
      .where(
        and(
          eq(packageDocuments.packageId, packageId),
          eq(packageDocuments.documentId, documentId)
        )
      );

    return true;
  } catch (error) {
    console.error('Error detaching document:', error);
    throw error;
  }
}

/**
 * Detach document by package document relationship ID
 */
export async function detachDocumentById(
  packageDocumentId: string
): Promise<boolean> {
  try {
    // Check if the package document relationship exists
    const [existingAttachment] = await db
      .select()
      .from(packageDocuments)
      .where(eq(packageDocuments.id, packageDocumentId))
      .limit(1);

    if (!existingAttachment) {
      throw new Error('Package document relationship not found');
    }

    // Delete the package document relationship
    await db
      .delete(packageDocuments)
      .where(eq(packageDocuments.id, packageDocumentId));

    return true;
  } catch (error) {
    console.error('Error detaching document by ID:', error);
    throw error;
  }
}

/**
 * Detach all documents from a package
 */
export async function detachAllDocuments(packageId: string): Promise<number> {
  try {
    // Get count of documents to be detached
    const existingDocs = await db
      .select()
      .from(packageDocuments)
      .where(eq(packageDocuments.packageId, packageId));

    // Delete all package document relationships for this package
    await db
      .delete(packageDocuments)
      .where(eq(packageDocuments.packageId, packageId));

    return existingDocs.length;
  } catch (error) {
    console.error('Error detaching all documents:', error);
    throw error;
  }
}