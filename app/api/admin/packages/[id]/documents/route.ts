// app/api/admin/packages/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, packageDocuments, documents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdminUser } from '@/lib/auth/admin';
import { DocumentUploadService } from '@/lib/services/documentUploadService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const adminUser = await requireAdminUser();
    
    // Await params
    const { id: packageId } = await params;
    
    const body = await request.json();
    console.log('Received payload:', body);

    // Handle different payload formats
    let documentIds: string[] = [];
    let sessionId = '';
    let documentType = 'picture';

    if (body.sessionId) {
      // New format: convert temporary documents to package documents
      sessionId = body.sessionId;
      documentType = body.documentType || 'picture';
      
      const uploadService = new DocumentUploadService();
      const result = await uploadService.convertTemporaryToPackageDocuments(
        sessionId,
        packageId,
        documentType,
        adminUser.id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Get the attached documents
      const attachedDocuments = await db
        .select({
          id: packageDocuments.id,
          documentType: packageDocuments.documentType,
          fileName: documents.fileName,
          fileUrl: documents.fileUrl,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          isPublic: documents.isPublic,
          uploadedAt: documents.uploadedAt,
        })
        .from(packageDocuments)
        .innerJoin(documents, eq(packageDocuments.documentId, documents.id))
        .where(
          and(
            eq(packageDocuments.packageId, packageId),
            eq(packageDocuments.documentType, documentType)
          )
        );

      return NextResponse.json({
        success: true,
        documents: attachedDocuments,
        message: `${result.documentCount} document(s) attached successfully`,
      });

    } else if (body.documentIds && Array.isArray(body.documentIds)) {
      // Direct document ID attachment
      documentIds = body.documentIds;
      documentType = body.documentType || 'picture';

      const uploadService = new DocumentUploadService();
      const result = await uploadService.attachDocumentsToPackage(
        packageId,
        documentIds,
        documentType,
        adminUser.id
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Get the attached documents
      const attachedDocuments = await db
        .select({
          id: packageDocuments.id,
          documentType: packageDocuments.documentType,
          fileName: documents.fileName,
          fileUrl: documents.fileUrl,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          isPublic: documents.isPublic,
          uploadedAt: documents.uploadedAt,
        })
        .from(packageDocuments)
        .innerJoin(documents, eq(packageDocuments.documentId, documents.id))
        .where(eq(packageDocuments.packageId, packageId));

      return NextResponse.json({
        success: true,
        documents: attachedDocuments,
        message: `${documentIds.length} document(s) attached successfully`,
      });

    } else {
      // Legacy format: direct document upload (deprecated but supported)
      const documentsPayload = Array.isArray(body) ? body : body.documents;
      
      if (!documentsPayload || !Array.isArray(documentsPayload)) {
        return NextResponse.json(
          { error: 'Invalid payload format. Use sessionId or documentIds.' },
          { status: 400 }
        );
      }

      // Verify package exists
      const [existingPackage] = await db
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.id, packageId))
        .limit(1);

      if (!existingPackage) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }

      // This is legacy support - create documents and attach them directly
      // In production, you should phase this out in favor of the new flow
      return NextResponse.json(
        { error: 'Legacy upload format is deprecated. Please use the new document upload flow.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing package documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage package documents',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    await requireAdminUser();

    // Await params
    const { id: packageId } = await params;
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type');

    // Build query with joins
    const baseQuery = db
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
      })
      .from(packageDocuments)
      .innerJoin(documents, eq(packageDocuments.documentId, documents.id));
      
    // Apply filters
    let packageDocs;
    if (documentType) {
      packageDocs = await baseQuery.where(
        and(
          eq(packageDocuments.packageId, packageId),
          eq(packageDocuments.documentType, documentType)
        )
      );
    } else {
      packageDocs = await baseQuery.where(eq(packageDocuments.packageId, packageId));
    }

    return NextResponse.json({
      success: true,
      documents: packageDocs
    });

  } catch (error) {
    console.error('Error fetching package documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}