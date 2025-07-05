// Temporary endpoint to check document status
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');
    
    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID required' }, { status: 400 });
    }
    
    const supabaseAdmin = createAdminClient();
    
    // Get documents
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });
      
    if (docsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
    
    // Get document chunks
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .limit(10);
      
    if (chunksError) {
      return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
    }
    
    return NextResponse.json({
      documents: documents || [],
      documentCount: documents?.length || 0,
      chunks: chunks || [],
      chunkCount: chunks?.length || 0,
      readyDocuments: documents?.filter(d => d.status === 'ready').length || 0
    });
  } catch (error) {
    console.error('Error checking documents:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}