// features/packages/db/queries/package-documents/get-package-documents.query.ts
import { db } from '@/lib/db';
import { packageDocuments } from '@/features/packages/db/schema';
import { documents } from '@/features/settings/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { PackageDocumentResponse } from '@/features/packages/types/package.types';
import { users } from '@/lib/db/schema';

export async function getPackageDocuments(packageId: string): Promise<PackageDocumentResponse[]> {
  const packageDocs = await db
    .select({
      id: packageDocuments.id,
      documentType: packageDocuments.documentType,
      isPrimary: packageDocuments.isPrimary,
      displayOrder: packageDocuments.displayOrder,
      attachedAt: packageDocuments.attachedAt,
      // Document details
      documentId: documents.id,
      fileName: documents.fileName,
      originalFileName: documents.originalFileName,
      fileUrl: documents.fileUrl,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      isPublic: documents.isPublic,
      uploadedAt: documents.uploadedAt,
      // Uploader details
      uploadedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      uploadedByEmail: users.email,
    })
    .from(packageDocuments)
    .innerJoin(documents, eq(packageDocuments.documentId, documents.id))
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(eq(packageDocuments.packageId, packageId))
    .orderBy(desc(packageDocuments.displayOrder), desc(packageDocuments.attachedAt));

  return packageDocs.map(doc => ({
    id: doc.id,
    documentType: doc.documentType,
    isPrimary: doc.isPrimary || false,
    displayOrder: doc.displayOrder || 0,
    attachedAt: doc.attachedAt.toISOString(),
    document: {
      id: doc.documentId,
      fileName: doc.fileName,
      originalFileName: doc.originalFileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize || 0,
      mimeType: doc.mimeType || 'application/octet-stream',
      isPublic: doc.isPublic || false,
      uploadedAt: doc.uploadedAt.toISOString(),
      uploadedBy: doc.uploadedByName && doc.uploadedByEmail ? {
        name: doc.uploadedByName,
        email: doc.uploadedByEmail,
      } : undefined,
    },
  }));
}