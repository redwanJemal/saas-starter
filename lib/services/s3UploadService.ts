// lib/services/s3UploadService.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xnznuaeoswjnmqrztfnd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuem51YWVvc3dqbm1xcnp0Zm5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI2NDI5MiwiZXhwIjoyMDY4ODQwMjkyfQ.xupU_9dwZ6XOSLqX-mHmdvS6hmUoKJZyTtD0uD5Uero';

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export interface UploadOptions {
  bucket?: string;
  path?: string;
  fileName?: string;
  isPublic?: boolean;
}

// Create service client that bypasses RLS
let supabaseService: ReturnType<typeof createClient> | null = null;

if (supabaseServiceKey) {
  supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export class SupabaseUploadService {
  private readonly publicBucket = 'uktoeast-public';
  private readonly privateBucket = 'uktoeast-private';

  /**
   * Check if Supabase service client is available
   */
  private checkServiceClient(): { valid: boolean; error?: string } {
    if (!supabaseServiceKey) {
      return {
        valid: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY environment variable is required for file uploads.'
      };
    }

    if (!supabaseService) {
      return {
        valid: false,
        error: 'Supabase service client not initialized.'
      };
    }

    return { valid: true };
  }

  /**
   * Ensure bucket exists
   */
  private async ensureBucketExists(bucketName: string, isPublic: boolean = true): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseService!.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabaseService!.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }

        console.log(`Created bucket: ${bucketName}`);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }

  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Check service client
      const clientCheck = this.checkServiceClient();
      if (!clientCheck.valid) {
        return {
          success: false,
          error: clientCheck.error
        };
      }

      const {
        bucket = this.publicBucket,
        path = 'packages',
        fileName = this.generateFileName(file),
        isPublic = true
      } = options;

      // Ensure bucket exists
      await this.ensureBucketExists(bucket, isPublic);

      const filePath = `${path}/${fileName}`;

      // Upload file using service role (bypasses RLS)
      const { data, error } = await supabaseService!.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL for public bucket files
      let fileUrl: string;
      if (isPublic && bucket === this.publicBucket) {
        const { data: publicData } = supabaseService!.storage
          .from(bucket)
          .getPublicUrl(filePath);
        fileUrl = publicData.publicUrl;
      } else {
        // For private files, store the path and generate signed URLs when needed
        fileUrl = filePath;
      }

      return {
        success: true,
        fileUrl,
        fileName: data.path,
        fileSize: file.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Upload service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, {
        ...options,
        fileName: this.generateFileName(file)
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Upload package pictures specifically
   */
  async uploadPackagePictures(
    files: File[],
    packageId: string
  ): Promise<UploadResult[]> {
    return this.uploadMultipleFiles(files, {
      bucket: this.publicBucket,
      path: `packages/${packageId}/pictures`,
      isPublic: true
    });
  }

  /**
   * Generate a unique file name
   */
  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const clientCheck = this.checkServiceClient();
      if (!clientCheck.valid) {
        console.error('Service client error:', clientCheck.error);
        return null;
      }

      const { data, error } = await supabaseService!.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      const clientCheck = this.checkServiceClient();
      if (!clientCheck.valid) {
        console.error('Service client error:', clientCheck.error);
        return false;
      }

      const { error } = await supabaseService!.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  /**
   * Validate file for package pictures
   */
  validatePackagePicture(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { valid: true };
  }
}