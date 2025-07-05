// src/app/api/teacher/documents/[documentId]/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/document-processing/processor';
import { Document } from '@/types/knowledge-base.types';

// Allow longer execution time for manual document processing
export const maxDuration = 300; // 5 minutes

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  console.log("Manual document processing request received");
  
  try {
    const params = await context.params;
    const { documentId } = params;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get document and verify ownership
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select(`
        *,
        chatbots!inner (
          teacher_id
        )
      `)
      .eq('document_id', documentId)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if the teacher owns the chatbot
    if (document.chatbots.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if document is already being processed
    if (document.status === 'processing') {
      return NextResponse.json({ 
        error: 'Document is already being processed',
        document: document 
      }, { status: 400 });
    }

    // Check if document is already completed
    if (document.status === 'completed') {
      return NextResponse.json({ 
        message: 'Document has already been processed successfully',
        document: document 
      });
    }

    // Reset document status to uploaded for reprocessing
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'uploaded',
        error_message: null,
        retry_count: 0
      })
      .eq('document_id', documentId);

    if (updateError) {
      console.error('Failed to reset document status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to reset document status' 
      }, { status: 500 });
    }

    // Process the document directly
    const adminSupabase = createAdminClient();
    
    try {
      console.log(`Starting manual processing for document ${document.document_id}`);
      
      // Process the document synchronously
      const result = await processDocument(document as Document);
      
      console.log(`Document ${document.document_id} processed successfully:`, result);
      
      return NextResponse.json({
        message: 'Document processed successfully',
        document: {
          ...document,
          status: 'completed'
        },
        chunksCreated: result.chunksCreated,
        processingMethod: 'direct'
      });
      
    } catch (processingError) {
      console.error(`Document ${document.document_id} processing failed:`, processingError);
      
      // Update retry count
      const { error: updateError } = await adminSupabase
        .from('documents')
        .update({
          status: 'error',
          error_message: processingError instanceof Error ? processingError.message : 'Processing failed',
          retry_count: (document.retry_count || 0) + 1
        })
        .eq('document_id', documentId);
      
      if (updateError) {
        console.error('Failed to update document status:', updateError);
      }
      
      return NextResponse.json({
        error: 'Document processing failed',
        details: processingError instanceof Error ? processingError.message : 'Unknown error',
        document: {
          ...document,
          status: 'error'
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in manual document processing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process document' },
      { status: 500 }
    );
  }
}