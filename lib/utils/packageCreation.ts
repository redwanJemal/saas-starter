// lib/utils/packageCreation.ts
import { db } from '@/lib/db/drizzle';
import { packages } from '@/lib/db/schema';
import { DocumentUploadService } from '@/lib/services/documentUploadService';

interface CreatePackageWithDocumentsParams {
  packageData: {
    tenantId: string;
    customerProfileId: string;
    warehouseId: string;
    internalId: string;
    suiteCodeCaptured?: string;
    trackingNumberInbound?: string;
    senderName?: string;
    senderCompany?: string;
    description?: string;
    // ... other package fields
  };
  sessionId?: string; // Session ID for temporary documents
  createdBy: string;
}

export async function createPackageWithDocuments({
  packageData,
  sessionId,
  createdBy
}: CreatePackageWithDocumentsParams) {
  const uploadService = new DocumentUploadService();

  try {
    // Create the package first
    const [newPackage] = await db
      .insert(packages)
      .values({
        ...packageData,
        status: 'expected'
      })
      .returning({ id: packages.id });

    console.log('Package created with ID:', newPackage.id);

    // If sessionId provided, convert temporary documents to package documents
    if (sessionId) {
      console.log('Converting temporary documents for session:', sessionId);
      
      const conversionResult = await uploadService.convertTemporaryToPackageDocuments(
        sessionId,
        newPackage.id,
        'picture', // Default to pictures, but you can make this configurable
        createdBy
      );

      if (conversionResult.success) {
        console.log(`Attached ${conversionResult.documentCount} document(s) to package`);
      } else {
        console.error('Failed to convert temporary documents:', conversionResult.error);
        // Don't fail package creation, just log the error
      }
    }

    return {
      success: true,
      packageId: newPackage.id,
      documentsAttached: sessionId ? true : false
    };

  } catch (error) {
    console.error('Error creating package with documents:', error);
    throw error;
  }
}

// Example usage in your package creation API route:
/*
// app/api/admin/packages/route.ts (POST method update)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminUser();
    const body = await request.json();
    
    const { sessionId, ...packageData } = body;

    const result = await createPackageWithDocuments({
      packageData: {
        ...packageData,
        tenantId: adminUser.tenantId
      },
      sessionId,
      createdBy: adminUser.id
    });

    return NextResponse.json({
      success: true,
      packageId: result.packageId,
      documentsAttached: result.documentsAttached
    });

  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}
*/