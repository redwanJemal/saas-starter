// lib/services/documentUploadService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/drizzle';
import { documents, temporaryDocuments, packageDocuments } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

// Create a function to get the Supabase client only when needed
let supabaseServiceInstance: SupabaseClient | null = null;

function getSupabaseService(): SupabaseClient {
  if (!supabaseServiceInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    supabaseServiceInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  
  return supabaseServiceInstance;
}

export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export interface DocumentUploadOptions {
  bucket?: string;
  path?: string;
  isPublic?: boolean;
  description?: string;
  tags?: string[];
  sessionId?: string; // For temporary storage
  purpose?: string; // For temporary storage
}

export class DocumentUploadService {
  private readonly publicBucket = 'uktoeast-public';
  private readonly privateBucket = 'uktoeast-private';

  /**
   * Upload a document to global document storage
   */
  async uploadDocument(
    file: File,
    tenantId: string,
    uploadedBy: string,
    options: DocumentUploadOptions = {}
  ): Promise<DocumentUploadResult> {
    try {
      const {
        bucket = this.publicBucket,
        path = 'documents',
        isPublic = true,
        description,
        tags = [],
        sessionId,
        purpose
      } = options;

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileName = this.generateFileName(file);
      const filePath = `${path}/${fileName}`;

      // Ensure bucket exists
      await this.ensureBucketExists(bucket, isPublic);

      // Upload to Supabase storage
      const supabaseService = getSupabaseService();
      const { data, error } = await supabaseService.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      // Get file URL
      let fileUrl: string;
      if (isPublic && bucket === this.publicBucket) {
        const { data: publicData } = getSupabaseService().storage
          .from(bucket)
          .getPublicUrl(filePath);
        fileUrl = publicData.publicUrl;
      } else {
        fileUrl = filePath; // Store path for private files
      }

      // Insert into documents table
      const [document] = await db
        .insert(documents)
        .values({
          tenantId,
          originalFileName: file.name,
          fileName,
          fileSize: file.size,
          mimeType: file.type,
          fileUrl,
          bucket,
          filePath,
          isPublic,
          description,
          tags: tags.length > 0 ? JSON.stringify(tags) : null,
          uploadedBy,
          processingStatus: 'completed'
        })
        .returning({ 
          id: documents.id,
          fileUrl: documents.fileUrl,
          fileName: documents.fileName 
        });

      // If sessionId provided, store as temporary document
      if (sessionId && purpose) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

        await db
          .insert(temporaryDocuments)
          .values({
            documentId: document.id,
            sessionId,
            purpose,
            expiresAt
          });
      }

      return {
        success: true,
        documentId: document.id,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: file.size,
        mimeType: file.type
      };

    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(
    files: File[],
    tenantId: string,
    uploadedBy: string,
    options: DocumentUploadOptions = {}
  ): Promise<DocumentUploadResult[]> {
    const results: DocumentUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadDocument(file, tenantId, uploadedBy, {
        ...options,
        path: `${options.path || 'documents'}/${this.generateTimestamp()}`
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Attach documents to a package
   */
  async attachDocumentsToPackage(
    packageId: string,
    documentIds: string[],
    documentType: string,
    attachedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const packageDocumentsToInsert = documentIds.map((documentId, index) => ({
        packageId,
        documentId,
        documentType,
        displayOrder: index,
        attachedBy
      }));

      await db
        .insert(packageDocuments)
        .values(packageDocumentsToInsert);

      return { success: true };
    } catch (error) {
      console.error('Error attaching documents to package:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to attach documents'
      };
    }
  }

  /**
   * Get temporary documents for a session
   */
  async getTemporaryDocuments(sessionId: string, purpose: string) {
    try {
      const tempDocs = await db
        .select({
          documentId: temporaryDocuments.documentId,
          document: {
            id: documents.id,
            originalFileName: documents.originalFileName,
            fileName: documents.fileName,
            fileSize: documents.fileSize,
            mimeType: documents.mimeType,
            fileUrl: documents.fileUrl,
            isPublic: documents.isPublic,
            uploadedAt: documents.uploadedAt
          }
        })
        .from(temporaryDocuments)
        .innerJoin(documents, eq(temporaryDocuments.documentId, documents.id))
        .where(
          and(
            eq(temporaryDocuments.sessionId, sessionId),
            eq(temporaryDocuments.purpose, purpose)
          )
        );

      return {
        success: true,
        documents: tempDocs.map(td => ({
          documentId: td.documentId,
          ...td.document
        }))
      };
    } catch (error) {
      console.error('Error fetching temporary documents:', error);
      return { success: false, error: 'Failed to fetch documents' };
    }
  }

  /**
   * Convert temporary documents to package documents
   */
  async convertTemporaryToPackageDocuments(
    sessionId: string,
    packageId: string,
    documentType: string,
    attachedBy: string
  ): Promise<{ success: boolean; documentCount?: number; error?: string }> {
    try {
      // Get temporary documents
      const tempDocs = await db
        .select({ documentId: temporaryDocuments.documentId })
        .from(temporaryDocuments)
        .where(eq(temporaryDocuments.sessionId, sessionId));

      if (tempDocs.length === 0) {
        return { success: true, documentCount: 0 };
      }

      // Create package document relationships
      const packageDocumentsToInsert = tempDocs.map((doc, index) => ({
        packageId,
        documentId: doc.documentId,
        documentType,
        displayOrder: index,
        attachedBy
      }));

      await db
        .insert(packageDocuments)
        .values(packageDocumentsToInsert);

      // Clean up temporary documents
      await db
        .delete(temporaryDocuments)
        .where(eq(temporaryDocuments.sessionId, sessionId));

      return { success: true, documentCount: tempDocs.length };
    } catch (error) {
      console.error('Error converting temporary documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert documents'
      };
    }
  }

  /**
   * Clean up expired temporary documents
   */
  async cleanupExpiredTemporaryDocuments(): Promise<void> {
    try {
      const now = new Date();
      
      // Get expired document IDs
      const expiredDocs = await db
        .select({ documentId: temporaryDocuments.documentId })
        .from(temporaryDocuments)
        .where(lt(temporaryDocuments.expiresAt, now));

      if (expiredDocs.length === 0) return;

      // Delete from storage and database
      for (const doc of expiredDocs) {
        await this.deleteDocument(doc.documentId);
      }

      // Clean up temporary document records
      await db
        .delete(temporaryDocuments)
        .where(lt(temporaryDocuments.expiresAt, now));

      console.log(`Cleaned up ${expiredDocs.length} expired temporary documents`);
    } catch (error) {
      console.error('Error cleaning up expired documents:', error);
    }
  }

  /**
   * Delete a document completely
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get document info
      const [document] = await db
        .select({
          bucket: documents.bucket,
          filePath: documents.filePath
        })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!document) {
        return { success: false, error: 'Document not found' };
      }

      // Delete from storage
      const { error: storageError } = await getSupabaseService().storage
        .from(document.bucket)
        .remove([document.filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database (cascades to package_documents and temporary_documents)
      await db
        .delete(documents)
        .where(eq(documents.id, documentId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document'
      };
    }
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 10MB)' };
    }

    return { valid: true };
  }

  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${timestamp}-${randomString}.${extension}`;
  }

  private generateTimestamp(): string {
    return Date.now().toString();
  }

  private async ensureBucketExists(bucketName: string, isPublic: boolean = true): Promise<boolean> {
    try {
      const supabaseService = getSupabaseService();
      const { data: buckets, error: listError } = await supabaseService.storage.listBuckets();
      if (listError) return false;

      const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
      if (!bucketExists) {
        const { error: createError } = await supabaseService.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }
}