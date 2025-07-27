// app/api/admin/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DocumentUploadService } from '@/lib/services/documentUploadService';
import { requireAdminUser } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await requireAdminUser();
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sessionId = formData.get('sessionId') as string;
    const purpose = formData.get('purpose') as string || 'package_creation';
    const documentType = formData.get('documentType') as string || 'picture';
    const path = formData.get('path') as string || `documents/${documentType}`;
    const isPublic = formData.get('isPublic') === 'true';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const uploadSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const uploadService = new DocumentUploadService();
    
    // Upload documents
    const uploadResults = await uploadService.uploadMultipleDocuments(
      files,
      adminUser.tenantId, // Get tenant from admin user
      adminUser.id,
      {
        path,
        isPublic,
        sessionId: uploadSessionId,
        purpose,
        tags: [documentType]
      }
    );

    // Filter successful uploads
    const successfulUploads = uploadResults.filter(result => result.success);
    const failedUploads = uploadResults.filter(result => !result.success);

    return NextResponse.json({
      success: true,
      sessionId: uploadSessionId,
      uploaded: successfulUploads.length,
      failed: failedUploads.length,
      documents: successfulUploads.map(result => ({
        documentId: result.documentId,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        fileSize: result.fileSize,
        mimeType: result.mimeType
      })),
      errors: failedUploads.map(result => result.error)
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload documents',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}