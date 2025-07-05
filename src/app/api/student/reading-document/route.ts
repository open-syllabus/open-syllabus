// API endpoint to fetch reading document for a Reading Room chatbot
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Handle Accept header properly - accept any request that doesn't explicitly reject JSON
    const acceptHeader = request.headers.get('accept') || '*/*';
    
    // Only reject if the client explicitly refuses JSON (very rare)
    if (acceptHeader && 
        !acceptHeader.includes('application/json') && 
        !acceptHeader.includes('json') && 
        !acceptHeader.includes('*/*') &&
        !acceptHeader.includes('text/html')) {
      console.log('[API /student/reading-document] Client explicitly rejects JSON:', acceptHeader);
      return new NextResponse('Not Acceptable - This endpoint only returns JSON', { 
        status: 406,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');
    const userId = searchParams.get('userId');

    // Log only essential info
    console.log('[API /student/reading-document] Request for chatbot:', chatbotId);

    if (!chatbotId) {
      console.error('[API /student/reading-document] Missing chatbot ID');
      return NextResponse.json(
        { error: 'Chatbot ID is required' }, 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('[API /student/reading-document] Fetching document for chatbot:', chatbotId);

    // Use admin client for direct access scenarios
    const adminSupabase = createAdminClient();
    
    // Log to help debug
    console.log('[API /student/reading-document] Admin client created successfully');

    // First, verify this is a Reading Room bot
    const { data: chatbot, error: chatbotError } = await adminSupabase
      .from('chatbots')
      .select('chatbot_id, name, bot_type')
      .eq('chatbot_id', chatbotId)
      .single();

    if (chatbotError || !chatbot) {
      console.error('[API /student/reading-document] Chatbot not found:', chatbotError);
      return NextResponse.json(
        { error: 'Chatbot not found' }, 
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (chatbot.bot_type !== 'reading_room' && chatbot.bot_type !== 'viewing_room') {
      return NextResponse.json(
        { error: 'Not a Reading Room or Viewing Room bot' }, 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Get the reading document for this chatbot
    console.log('[API /student/reading-document] Querying reading_documents for chatbot:', chatbotId);
    
    
    const { data: readingDoc, error: docError } = await adminSupabase
      .from('reading_documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .single();

    if (docError) {
      console.error('[API /student/reading-document] Database error:', {
        error: docError,
        code: docError.code,
        message: docError.message,
        details: docError.details,
        hint: docError.hint
      });
      
      // Handle specific error cases
      if (docError.code === 'PGRST116') {
        // No rows found
        console.log('[API /student/reading-document] No reading document found for chatbot');
        return NextResponse.json({ 
          error: 'No reading document uploaded yet',
          document: null 
        }, { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      return NextResponse.json({ 
        error: 'Database error fetching document',
        details: docError.message
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    if (!readingDoc) {
      console.log('[API /student/reading-document] No reading document found for chatbot');
      return NextResponse.json({ 
        error: 'No reading document uploaded yet',
        document: null 
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Handle different content types with null safety
    let documentUrl: string | null = null;
    let contentType = readingDoc.content_type || 'pdf'; // Default to PDF for backward compatibility
    
    if (contentType === 'video') {
      // For videos, use the video_url directly
      documentUrl = readingDoc.video_url || null;
    } else {
      // For PDFs, use the stored file_url or construct it
      documentUrl = readingDoc.file_url || null;
      
      if (!documentUrl && readingDoc.file_path) {
        // Fallback: construct the URL if not stored
        const { data: publicUrlData } = adminSupabase
          .storage
          .from('reading_documents')
          .getPublicUrl(readingDoc.file_path);
        
        documentUrl = publicUrlData.publicUrl;
      }
    }

    console.log('[API /student/reading-document] Returning document:', { 
      contentType, 
      documentUrl,
      readingDocKeys: Object.keys(readingDoc || {}),
      hasRequiredFields: !!(readingDoc?.id && readingDoc?.file_name)
    });

    // Ensure we handle potential undefined fields safely
    const safeDocument = {
      document_id: readingDoc.id,
      content_type: contentType,
      file_name: readingDoc.file_name || 'Unknown',
      file_url: documentUrl, // This will be either PDF URL or video URL
      video_platform: readingDoc.video_platform || null,
      video_id: readingDoc.video_id || null,
      video_metadata: readingDoc.video_metadata || null,
      uploaded_at: readingDoc.created_at || new Date().toISOString()
    };

    return NextResponse.json({
      document: safeDocument
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Prevent caching of document data
      }
    });

  } catch (error) {
    console.error('[API /student/reading-document] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading document' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}