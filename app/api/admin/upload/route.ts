// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminUser } from '@/lib/auth/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminUser();

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = `${path}/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabaseService.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.id === bucket);

    if (!bucketExists) {
      const { error: createError } = await supabaseService.storage.createBucket(bucket, {
        public: isPublic,
        fileSizeLimit: 52428800,
        allowedMimeTypes: allowedTypes
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json(
          { error: 'Failed to create storage bucket' },
          { status: 500 }
        );
      }
    }

    // Upload file
    const { data, error } = await supabaseService.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message },
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
      fileUrl = filePath; // Return path for private files
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: data.path
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}