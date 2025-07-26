// app/api/admin/packages/[packageId]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { packageDocuments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SupabaseUploadService } from '@/lib/services/s3UploadService';
import { requireAdminUser } from '@/lib/auth/admin';
import { db } from '@/lib/db/drizzle';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { packageId: string; documentId: string } }
) {
  try {
    // Check authentication and admin role
    const adminUser = await requireAdminUser();

    const { packageId, documentId } = params;

    // Get document details before deletion
    const document = await db
      .select({
        id: packageDocuments.id,
        fileUrl: packageDocuments.fileUrl,
        isPublic: packageDocuments.isPublic
      })
      .from(packageDocuments)
      .where(
        and(
          eq(packageDocuments.id, documentId),
          eq(packageDocuments.packageId, packageId)
        )
      )
      .limit(1);

    if (document.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      );
    }

    const docData = document[0];

    // Delete from database first
    await db
      .delete(packageDocuments)
      .where(
        and(
          eq(packageDocuments.id, documentId),
          eq(packageDocuments.packageId, packageId)
        )
      );

    // Delete from Supabase storage
    try {
      const uploadService = new SupabaseUploadService();
      
      // Determine bucket and extract file path from URL
      const bucket = docData.isPublic ? 'uktoeast-public' : 'uktoeast-private';
      
      // Extract file path from URL
      // For public URLs: https://xnznuaeoswjnmqrztfnd.supabase.co/storage/v1/object/public/uktoeast-public/packages/...
      // For private URLs: just the path
      let filePath = docData.fileUrl;
      if (docData.isPublic && docData.fileUrl && docData.fileUrl.includes('/storage/v1/object/public/')) {
        const parts = docData.fileUrl.split('/storage/v1/object/public/' + bucket + '/');
        filePath = parts[1] || docData.fileUrl;
      }
      
      const deleted = await uploadService.deleteFile(bucket, filePath || '');
      
      if (!deleted) {
        console.warn(`Failed to delete file from storage: ${filePath}`);
        // Continue anyway as database deletion succeeded
      }
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Don't fail the request if storage deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting package document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { packageId: string; documentId: string } }
) {
  try {
    // Check authentication
    const adminUser = await requireAdminUser();

    const { packageId, documentId } = params;

    // Get document details
    const document = await db
      .select()
      .from(packageDocuments)
      .where(
        and(
          eq(packageDocuments.id, documentId),
          eq(packageDocuments.packageId, packageId)
        )
      )
      .limit(1);

    if (document.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: document[0]
    });

  } catch (error) {
    console.error('Error fetching package document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}