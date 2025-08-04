// app/api/admin/packages/[packageId]/documents/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { packageDocuments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdminUser } from '@/lib/auth/admin';
import { db } from '@/lib/db/drizzle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string; documentId: string }> }
) {
  try {
    // Check authentication
    const adminUser = await requireAdminUser();

    const { packageId, documentId } = await params;

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