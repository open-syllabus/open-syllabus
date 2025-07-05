import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/document-processing/processor';
import { Document } from '@/types/knowledge-base.types';

export const maxDuration = 300; // 5 minutes max for cron job

export async function GET(request: NextRequest) {
  // Verify this is a Vercel Cron request or has the right auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting document processing batch job');
  
  try {
    const adminSupabase = createAdminClient();
    
    // Get documents that need processing
    // Priority order:
    // 1. Status 'uploaded' (never processed)
    // 2. Status 'processing' stuck for over 10 minutes
    // 3. Status 'error' with retry_count < 3
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: pendingDocs, error: fetchError } = await adminSupabase
      .from('documents')
      .select('document_id, status, retry_count, processing_started_at')
      .or(`status.eq.uploaded,and(status.eq.processing,processing_started_at.lt.${tenMinutesAgo}),and(status.eq.error,retry_count.lt.3)`)
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 documents per cron run
    
    if (fetchError) {
      console.error('[Cron] Failed to fetch pending documents:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch pending documents',
        details: fetchError.message 
      }, { status: 500 });
    }
    
    if (!pendingDocs || pendingDocs.length === 0) {
      console.log('[Cron] No documents need processing');
      return NextResponse.json({ 
        message: 'No documents need processing',
        processed: 0 
      });
    }
    
    console.log(`[Cron] Found ${pendingDocs.length} documents to process`);
    
    // Get full document details for processing
    const documentIds = pendingDocs.map(doc => doc.document_id);
    const { data: fullDocuments, error: docsError } = await adminSupabase
      .from('documents')
      .select('*')
      .in('document_id', documentIds);
      
    if (docsError || !fullDocuments) {
      console.error('[Cron] Failed to fetch full documents:', docsError);
      return NextResponse.json({ 
        error: 'Failed to fetch document details',
        details: docsError?.message 
      }, { status: 500 });
    }
    
    // Process documents one by one to avoid overwhelming the system
    const results = [];
    for (const doc of fullDocuments) {
      const startTime = Date.now();
      try {
        console.log(`[Cron] Processing document ${doc.document_id}`);
        const result = await processDocument(doc as Document);
        results.push({
          documentId: doc.document_id,
          success: true,
          chunksCreated: result.chunksCreated,
          processingTime: Date.now() - startTime
        });
        console.log(`[Cron] Document ${doc.document_id} processed successfully`);
      } catch (error) {
        console.error(`[Cron] Document ${doc.document_id} processing failed:`, error);
        results.push({
          documentId: doc.document_id,
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          processingTime: Date.now() - startTime
        });
      }
    }
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Update retry counts for failed documents
    const failedDocIds = results
      .filter(r => !r.success)
      .map(r => r.documentId);
    
    if (failedDocIds.length > 0) {
      // Update retry counts for each failed document
      for (const docId of failedDocIds) {
        const { data: currentDoc } = await adminSupabase
          .from('documents')
          .select('retry_count, processing_metadata')
          .eq('document_id', docId)
          .single();
          
        const { error: updateError } = await adminSupabase
          .from('documents')
          .update({ 
            retry_count: (currentDoc?.retry_count || 0) + 1,
            processing_metadata: {
              ...(currentDoc?.processing_metadata || {}),
              lastCronAttempt: new Date().toISOString()
            }
          })
          .eq('document_id', docId);
          
        if (updateError) {
          console.error(`[Cron] Failed to update retry count for ${docId}:`, updateError);
        }
      }
    }
    
    console.log(`[Cron] Batch processing complete. Success: ${successful}, Failed: ${failed}`);
    
    return NextResponse.json({
      message: 'Batch processing complete',
      processed: pendingDocs.length,
      successful,
      failed,
      results: results.map(r => ({
        documentId: r.documentId,
        success: r.success,
        error: r.error,
        processingTime: r.processingTime
      }))
    });
    
  } catch (error) {
    console.error('[Cron] Batch processing error:', error);
    return NextResponse.json({ 
      error: 'Batch processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  // This allows manual triggering with proper auth
  return GET(request);
}