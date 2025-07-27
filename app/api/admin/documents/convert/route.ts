// app/api/admin/documents/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DocumentUploadService } from '@/lib/services/documentUploadService';
import { requireAdminUser } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await requireAdminUser();
    
    const body = await request.json();
    const { sessionId, packageId, documentType = 'picture' } = body;

    if (!sessionId || !packageId) {
      return NextResponse.json(
        { error: 'sessionId and packageId are required' },
        { status: 400 }
      );
    }

    const uploadService = new DocumentUploadService();
    
    // Convert temporary documents to package documents
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

    return NextResponse.json({
      success: true,
      documentCount: result.documentCount,
      message: `${result.documentCount} document(s) attached to package successfully`
    });

  } catch (error) {
    console.error('Document conversion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert temporary documents',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}