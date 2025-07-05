// src/app/api/teacher/chatbots/[chatbotId]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/document-processing/processor';
import { Document } from '@/types/knowledge-base.types';

// Configure Vercel to allow longer execution time for document processing
export const maxDuration = 300; // 5 minutes - maximum for Vercel Pro

export async function POST(request: NextRequest) {
  console.log("Document upload request received");
  
  try {
    // Extract chatbotId from URL
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const chatbotId = segments[segments.indexOf('chatbots') + 1];
    
    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID is required' }, { status: 400 });
    }
    
    console.log("Processing for chatbot ID:", chatbotId);
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if the chatbot belongs to the user
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('chatbot_id')
      .eq('chatbot_id', chatbotId)
      .eq('teacher_id', user.id)
      .single();

    if (chatbotError || !chatbot) {
      return NextResponse.json({ error: 'Chatbot not found or unauthorized' }, { status: 404 });
    }

    // Get file from formData
    const formData = await request.formData();
    console.log("FormData received:", formData);
    
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log("File received:", file.name, file.type, file.size);

    // Validate file type
    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Create storage path with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${chatbotId}/${timestamp}-${sanitizedFileName}`;
    
    // Get file buffer
    const buffer = await file.arrayBuffer();
    
    // Use admin client for storage upload to ensure consistent access
    const adminSupabase = createAdminClient();
    
    // Upload file to storage using admin client
    const { error: uploadError } = await adminSupabase
      .storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
    }

    // Create document record using admin client to bypass RLS
    const { data: document, error: documentError } = await adminSupabase
      .from('documents')
      .insert({
        chatbot_id: chatbotId,
        file_name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        status: 'uploaded'
      })
      .select()
      .single();

    if (documentError) {
      console.error("Document insert error:", documentError);
      
      // Clean up uploaded file if document record creation fails
      await adminSupabase.storage.from('documents').remove([filePath]);
      
      return NextResponse.json({ error: `Failed to create document record: ${documentError.message}` }, { status: 500 });
    }

    // Process the document directly - this is what was working before
    console.log(`Starting document processing for ${document.document_id}`);
    
    try {
      // Process the document synchronously
      const result = await processDocument(document as Document);
      
      console.log(`Document ${document.document_id} processed successfully:`, result);
      
      return NextResponse.json({
        document: document,
        message: 'Document uploaded and processed successfully.',
        chunksCreated: result.chunksCreated,
        processingMethod: 'direct'
      });
      
    } catch (processingError) {
      console.error(`Document ${document.document_id} processing failed:`, processingError);
      
      // Update document status to error
      await adminSupabase
        .from('documents')
        .update({
          status: 'error',
          error_message: processingError instanceof Error ? processingError.message : 'Processing failed',
          retry_count: 0
        })
        .eq('document_id', document.document_id);
      
      // Return success for upload but indicate processing failed
      // The cron job will retry it
      return NextResponse.json({
        document: document,
        message: 'Document uploaded successfully but processing failed. It will be retried automatically.',
        error: processingError instanceof Error ? processingError.message : 'Processing failed',
        processingMethod: 'direct'
      });
    }
  } catch (error) {
    console.error('Error in document upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract chatbotId from URL
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const chatbotId = segments[segments.indexOf('chatbots') + 1];
    
    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID is required' }, { status: 400 });
    }
    
    console.log("Fetching documents for chatbot ID:", chatbotId);
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for direct access via URL parameters
    const { searchParams } = new URL(request.url);
    const directUserId = searchParams.get('userId');
    
    let userId = user?.id;
    
    // If no authenticated user but direct access ID provided, use that
    if (!userId && directUserId) {
      userId = directUserId;
      console.log("Using direct access user ID:", userId);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is a teacher who owns the chatbot
    const { data: teacherChatbot } = await supabase
      .from('chatbots')
      .select('chatbot_id')
      .eq('chatbot_id', chatbotId)
      .eq('teacher_id', userId)
      .single();

    // If not a teacher, check if user is a student with access via room membership
    if (!teacherChatbot) {
      // First check if this is a student by auth_user_id
      const { data: studentProfile } = await supabase
        .from('students')
        .select('student_id')
        .eq('auth_user_id', userId)
        .single();
      
      if (!studentProfile) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
      }
      
      // Check if the student has access to any room that contains this chatbot
      const { data: studentAccess } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms!inner (
            room_chatbots!inner (
              chatbot_id
            )
          )
        `)
        .eq('student_id', studentProfile.student_id)
        .eq('rooms.room_chatbots.chatbot_id', chatbotId)
        .limit(1);

      if (!studentAccess || studentAccess.length === 0) {
        return NextResponse.json({ error: 'Chatbot not found or unauthorized' }, { status: 404 });
      }
    }

    // Get all documents for this chatbot
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json(documents || []);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// Helper function to determine file type
function getFileType(fileName: string): 'pdf' | 'docx' | 'txt' | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'docx': case 'doc': return 'docx';
    case 'txt': return 'txt';
    default: return null;
  }
}