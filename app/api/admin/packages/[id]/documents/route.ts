// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/admin';
import { isSupabaseConfigured, getSupabaseService } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminUser();

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'File upload service not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'uktoeast-public';
    const path = formData.get('path') as string || 'packages';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp', 
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = `${path}/${fileName}`;

    // Get Supabase service client
    const supabaseService = getSupabaseService();

    // Ensure bucket exists
    const { data: buckets, error: listError } = await supabaseService.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      const bucketExists = buckets?.some(b => b.id === bucket);
      if (!bucketExists) {
        const { error: createError } = await supabaseService.storage.createBucket(bucket, {
          public: isPublic,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: allowedTypes
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        }
      }
    }

    // Upload file
    const { data, error } = await supabaseService.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get file URL
    let fileUrl: string;
    if (isPublic) {
      const { data: publicData } = supabaseService.storage
        .from(bucket)
        .getPublicUrl(filePath);
      fileUrl = publicData.publicUrl;
    } else {
      // For private files, return path - will need signed URL later
      fileUrl = filePath;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: data.path,
      fileSize: file.size,
      mimeType: file.type,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}