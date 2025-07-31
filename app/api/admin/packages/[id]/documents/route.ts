// app/api/admin/packages/[id]/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { 
  getPackageDocuments, 
  attachDocument 
} from '@/features/packages/db/queries';
import type { AttachDocumentData } from '@/features/packages/types/package.types';
import { RouteContext } from '@/lib/types/route';

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const { id } = await context.params;

    // Validate package ID
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package ID is required' 
        },
        { status: 400 }
      );
    }

    // Get package documents
    const documents = await getPackageDocuments(id);

    return NextResponse.json({
      success: true,
      data: documents,
    });

  } catch (error) {
    console.error('Error fetching package documents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch package documents' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const { id } = await context.params;

    // Validate package ID
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Package ID is required' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.documentId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Document ID is required' 
        },
        { status: 400 }
      );
    }

    if (!body.documentType) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Document type is required' 
        },
        { status: 400 }
      );
    }

    const attachData: AttachDocumentData = {
      documentId: body.documentId,
      documentType: body.documentType,
      isPrimary: Boolean(body.isPrimary),
      displayOrder: body.displayOrder || 0,
    };

    // Attach document to package
    const result = await attachDocument(id, attachData, adminUser.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Document attached successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error attaching document:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid package ID or document ID' 
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Document is already attached to this package' 
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to attach document' 
      },
      { status: 500 }
    );
  }
}