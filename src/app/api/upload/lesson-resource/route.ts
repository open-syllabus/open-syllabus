import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `lesson-resources/${user.id}/${uniqueFileName}`;
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Use admin client for storage upload to ensure consistent access
    const adminSupabase = createAdminClient();
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase
      .storage
      .from('lesson-resources')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // If bucket doesn't exist, try to create it
      if (uploadError.message?.includes('not found')) {
        const { error: createError } = await adminSupabase
          .storage
          .createBucket('lesson-resources', {
            public: true,
            fileSizeLimit: maxSize
          });
          
        if (createError && !createError.message?.includes('already exists')) {
          console.error('Failed to create bucket:', createError);
          return NextResponse.json(
            { error: 'Storage configuration error' },
            { status: 500 }
          );
        }
        
        // Retry upload after creating bucket
        const { data: retryData, error: retryError } = await adminSupabase
          .storage
          .from('lesson-resources')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          });
          
        if (retryError) {
          console.error('Storage upload retry error:', retryError);
          return NextResponse.json(
            { error: 'Failed to upload file after creating bucket' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadError.message}` },
          { status: 500 }
        );
      }
    }

    // Get public URL
    const { data: { publicUrl } } = adminSupabase
      .storage
      .from('lesson-resources')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}