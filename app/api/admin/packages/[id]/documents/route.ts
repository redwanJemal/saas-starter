// app/api/admin/packages/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packageDocuments, packages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdminUser } from '@/lib/auth/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Define documentsToInsert in outer scope so it's accessible in catch block
  let documentsToInsert: any[] = [];

  try {
    // Check authentication and admin role
    const adminUser = await requireAdminUser();
    console.log('Admin user authenticated:', adminUser.id);

    // Await params
    const { id: packageId } = await params;
    console.log('Package ID:', packageId);

    const body = await request.json();
    console.log('Received documents payload:', body);

    // Extract documents array from payload
    // Handle both formats: direct array or { documents: [] }
    const documents = Array.isArray(body) ? body : body.documents;

    // Validate payload structure
    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documents array is required' },
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

    // Prepare documents for insertion
    documentsToInsert = documents.map((doc: any) => ({
      packageId: packageId,
      documentType: doc.documentType || 'picture',
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize || null,
      mimeType: doc.mimeType || null,
      isPublic: doc.isPublic ?? true,
      uploadedBy: adminUser.id,
      uploadedAt: new Date(),
    }));

    // Validate required fields
    for (const doc of documentsToInsert) {
      if (!doc.fileName || !doc.fileUrl) {
        return NextResponse.json(
          { error: 'fileName and fileUrl are required for each document' },
          { status: 400 }
        );
      }
    }

    // Insert documents into database
    const insertedDocuments = await db
      .insert(packageDocuments)
      .values(documentsToInsert)
      .returning({
        id: packageDocuments.id,
        packageId: packageDocuments.packageId,
        documentType: packageDocuments.documentType,
        fileName: packageDocuments.fileName,
        fileUrl: packageDocuments.fileUrl,
        fileSize: packageDocuments.fileSize,
        mimeType: packageDocuments.mimeType,
        isPublic: packageDocuments.isPublic,
        uploadedAt: packageDocuments.uploadedAt,
      });

    console.log('Documents inserted successfully:', insertedDocuments);

    return NextResponse.json({
      success: true,
      documents: insertedDocuments,
      message: `${insertedDocuments.length} document(s) added successfully`,
    });

  } catch (error) {
    console.error('Error creating package documents:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create package documents',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : undefined 
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
    const adminUser = await requireAdminUser();

    // Await params
    const { id: packageId } = await params;
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type');

    // Build the base query
    const query = db
      .select({
        id: packageDocuments.id,
        documentType: packageDocuments.documentType,
        fileName: packageDocuments.fileName,
        fileUrl: packageDocuments.fileUrl,
        fileSize: packageDocuments.fileSize,
        mimeType: packageDocuments.mimeType,
        isPublic: packageDocuments.isPublic,
        uploadedAt: packageDocuments.uploadedAt
      })
      .from(packageDocuments);

    // Apply filters
    const conditions = [eq(packageDocuments.packageId, packageId)];
    
    if (documentType) {
      conditions.push(eq(packageDocuments.documentType, documentType));
    }

    // Apply the where clause with all conditions
    const filteredQuery = query.where(and(...conditions));
    const documents = await filteredQuery;

    return NextResponse.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Error fetching package documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}