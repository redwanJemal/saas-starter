// features/packages/db/queries/package-documents/attach-document.query.ts

import { db } from '@/lib/db';
import { packageDocuments, documents, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { AttachDocumentData, PackageDocumentResponse } from '@/features/packages/types/package.types';

export async function attachDocument(
  packageId: string,
  data: AttachDocumentData,
  attachedBy?: string
): Promise<PackageDocumentResponse> {
  return await db.transaction(async (tx) => {
    // Create the package document relationship
    const [packageDoc] = await tx
      .insert(packageDocuments)
      .values({
        packageId: packageId,
        documentId: data.documentId,
        documentType: data.documentType,
        isPrimary: data.isPrimary || false,
        displayOrder: data.displayOrder || 0,
        attachedAt: new Date(),
      })
      .returning();

    // Get the document details with uploader info
    const [documentDetails] = await tx
      .select({
        id: documents.id,
        fileName: documents.fileName,
        originalFileName: documents.originalFileName,
        fileUrl: documents.fileUrl,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        isPublic: documents.isPublic,
        uploadedAt: documents.uploadedAt,
        uploadedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        uploadedByEmail: users.email,
      })
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(eq(documents.id, data.documentId))
      .limit(1);

    if (!documentDetails) {
      throw new Error('Document not found');
    }

    // Return the complete package document response
    const response: PackageDocumentResponse = {
      id: packageDoc.id,
      documentType: packageDoc.documentType,
      isPrimary: packageDoc.isPrimary,
      displayOrder: packageDoc.displayOrder,
      attachedAt: packageDoc.attachedAt,
      document: {
        id: documentDetails.id,
        fileName: documentDetails.fileName,
        originalFileName: documentDetails.originalFileName,
        fileUrl: documentDetails.fileUrl,
        fileSize: documentDetails.fileSize,
        mimeType: documentDetails.mimeType,
        isPublic: documentDetails.isPublic,
        uploadedAt: documentDetails.uploadedAt,
        uploadedBy: documentDetails.uploadedByName && documentDetails.uploadedByEmail ? {
          name: documentDetails.uploadedByName,
          email: documentDetails.uploadedByEmail,
        } : undefined,
      },
    };

    return response;
  });
}