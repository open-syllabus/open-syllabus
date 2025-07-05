// src/app/api/teacher/chatbots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteChatbotVectors } from '@/lib/pinecone/utils';
import type { CreateChatbotPayload, Chatbot as DatabaseChatbot, BotTypeEnum } from '@/types/database.types'; // MODIFIED: Added BotTypeEnum
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

// GET Handler
export async function GET(request: NextRequest) { // MODIFIED: Added request parameter
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // IMPORTANT: We're using the admin client to bypass RLS issues
    const supabaseAdmin = createAdminClient();
    
    const { data: profile } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // MODIFIED: Extract query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm');
    const botType = searchParams.get('botType') as BotTypeEnum | null;
    const ragEnabledParam = searchParams.get('ragEnabled'); // Will be 'true' or 'false' as string
    const sortBy = searchParams.get('sortBy') || 'created_at_desc'; // Default sort

    // Use admin client instead of RLS-restricted client
    let query = supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('teacher_id', user.id);

    // Apply search term filter (searches name and description)
    if (searchTerm) {
      // Using .or() for searching in multiple columns.
      // The syntax `description.ilike.%${searchTerm}%` means description case-insensitive LIKE '%searchTerm%'
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply botType filter
    if (botType && (botType === 'learning' || botType === 'assessment' || botType === 'reading_room' || botType === 'viewing_room')) {
      query = query.eq('bot_type', botType);
    }

    // Apply ragEnabled filter
    if (ragEnabledParam === 'true') {
      query = query.eq('enable_rag', true);
    } else if (ragEnabledParam === 'false') {
      query = query.eq('enable_rag', false);
    }

    // Apply sorting
    // Example: sortBy = "name_asc" or "created_at_desc"
    // Need to handle fields with underscores properly
    const sortParts = sortBy.split('_');
    const sortOrder = sortParts[sortParts.length - 1]; // Last part is the order (asc/desc)
    const sortField = sortParts.slice(0, -1).join('_'); // Everything else is the field name
    
    if (sortField && sortOrder && ['name', 'created_at', 'updated_at', 'bot_type'].includes(sortField) && ['asc', 'desc'].includes(sortOrder)) {
      query = query.order(sortField as keyof DatabaseChatbot, { ascending: sortOrder === 'asc' });
    } else {
      // Default sort if sortBy parameter is invalid or not provided fully
      query = query.order('created_at', { ascending: false });
    }
    
    // Execute the query using admin client
    try {
      const { data: chatbots, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching chatbots:', fetchError);
        console.error('Chatbots fetch error details:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint
        });
        throw fetchError;
      }

      // Filter out archived chatbots
      const activeChatbots = chatbots ? chatbots.filter(c => !c.is_archived) : [];
      
      // Get student enrollment counts for each chatbot
      if (activeChatbots && activeChatbots.length > 0) {
        const chatbotIds = activeChatbots.map(c => c.chatbot_id);
        
        // Get student counts grouped by chatbot
        const { data: enrollmentCounts, error: countError } = await supabaseAdmin
          .from('room_chatbots')
          .select('chatbot_id, room_id')
          .in('chatbot_id', chatbotIds);
          
        if (!countError && enrollmentCounts) {
          // Get unique room IDs
          const roomIds = [...new Set(enrollmentCounts.map(rc => rc.room_id))];
          
          if (roomIds.length > 0) {
            // Get student counts per room
            const { data: roomStudentCounts, error: roomCountError } = await supabaseAdmin
              .from('room_members')
              .select('room_id')
              .in('room_id', roomIds)
              .eq('is_archived', false);
              
            if (!roomCountError && roomStudentCounts) {
              // Create a map of room_id to student count
              const roomStudentMap = new Map<string, number>();
              roomStudentCounts.forEach(rm => {
                const currentCount = roomStudentMap.get(rm.room_id) || 0;
                roomStudentMap.set(rm.room_id, currentCount + 1);
              });
              
              // Create a map of chatbot_id to total student count
              const chatbotStudentMap = new Map<string, number>();
              enrollmentCounts.forEach(rc => {
                const studentCount = roomStudentMap.get(rc.room_id) || 0;
                const currentTotal = chatbotStudentMap.get(rc.chatbot_id) || 0;
                chatbotStudentMap.set(rc.chatbot_id, currentTotal + studentCount);
              });
              
              // Add student counts to chatbot objects
              const chatbotsWithCounts = activeChatbots.map(chatbot => ({
                ...chatbot,
                student_count: chatbotStudentMap.get(chatbot.chatbot_id) || 0
              }));
              
              return NextResponse.json(chatbotsWithCounts);
            }
          }
        }
        
        // If we couldn't get counts, return chatbots with 0 counts
        const chatbotsWithZeroCounts = activeChatbots.map(chatbot => ({
          ...chatbot,
          student_count: 0
        }));
        
        return NextResponse.json(chatbotsWithZeroCounts);
      }

      return NextResponse.json(activeChatbots || []);
    } catch (queryError) {
      console.error('Error executing chatbot query:', queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('Error in GET /api/teacher/chatbots:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chatbots' },
      { status: 500 }
    );
  }
}

// POST Handler
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    console.log('[POST /api/teacher/chatbots] Starting request');
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[POST /api/teacher/chatbots] Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[POST /api/teacher/chatbots] User authenticated:', user.id);

    // Use admin client for all database operations to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Check if user is a teacher in the profiles table
    console.log('[POST /api/teacher/chatbots] Checking user profile...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[POST /api/teacher/chatbots] Error fetching profile:', {
        error: profileError,
        userId: user.id,
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      });
      return NextResponse.json({ 
        error: 'Error checking authorization',
        details: profileError.message 
      }, { status: 500 });
    }

    console.log('[POST /api/teacher/chatbots] Profile found:', profile);

    if (!profile || profile.role !== 'teacher') {
      console.error('[POST /api/teacher/chatbots] User not authorized:', { 
        userId: user.id, 
        profile: profile,
        role: profile?.role 
      });
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    console.log('[POST /api/teacher/chatbots] User authorized as teacher');

    const body: CreateChatbotPayload = await request.json();
    console.log("[API POST /teacher/chatbots] Received payload for creation:", body);

    if (!body.name || !body.system_prompt) {
        return NextResponse.json({ error: 'Name and system prompt are required' }, { status: 400 });
    }
    if (body.bot_type === 'assessment' && (!body.assessment_criteria_text || body.assessment_criteria_text.trim() === '')) {
        return NextResponse.json({ error: 'Assessment criteria are required for assessment bots.' }, { status: 400 });
    }

    // Import the welcome message generator
    const { generateWelcomeMessage } = await import('@/lib/chatbot/generate-welcome-message');
    
    // Generate welcome message if not provided
    let welcomeMessage = body.welcome_message || null;
    if (!welcomeMessage && body.bot_type !== 'assessment') {
      console.log('[POST /api/teacher/chatbots] Generating welcome message from system prompt');
      welcomeMessage = await generateWelcomeMessage({
        systemPrompt: body.system_prompt,
        botType: body.bot_type || 'learning',
        chatbotName: body.name
      });
    }

    const chatbotDataToInsert: Omit<DatabaseChatbot, 'chatbot_id' | 'created_at' | 'updated_at'> & { teacher_id: string } = {
      name: body.name,
      description: body.description || undefined, 
      system_prompt: body.system_prompt,
      teacher_id: user.id,
      model: body.model || 'openai/gpt-4.1-mini',
      model_id: body.model_id || 'grok-3-mini',
      max_tokens: body.max_tokens === undefined || body.max_tokens === null ? 1000 : Number(body.max_tokens),
      temperature: body.temperature === undefined || body.temperature === null ? 0.7 : Number(body.temperature),
      enable_rag: (body.bot_type === 'learning' || body.bot_type === 'reading_room' || body.bot_type === 'viewing_room' || body.bot_type === 'knowledge_book') ? (body.enable_rag || false) : false,
      bot_type: body.bot_type || 'learning',
      assessment_criteria_text: body.bot_type === 'assessment' ? body.assessment_criteria_text : null,
      assessment_type: body.bot_type === 'assessment' ? (body.assessment_type || 'multiple_choice') : null,
      assessment_question_count: body.bot_type === 'assessment' ? (body.assessment_question_count || 10) : null,
      welcome_message: welcomeMessage,
      prompt_starters: body.prompt_starters || null,
      linked_assessment_bot_id: body.linked_assessment_bot_id || null,
      // KnowledgeBook specific fields
      strict_document_only: body.bot_type === 'knowledge_book' ? (body.strict_document_only !== false) : false,
      min_confidence_score: body.bot_type === 'knowledge_book' ? (body.min_confidence_score || 0.75) : null,
      require_citations: body.bot_type === 'knowledge_book' ? (body.require_citations !== false) : false,
    };
    if (chatbotDataToInsert.description === undefined) {
        delete chatbotDataToInsert.description; 
    }

    // Use admin client for insert to bypass RLS restrictions
    console.log('[POST /api/teacher/chatbots] Inserting chatbot with data:', chatbotDataToInsert);
    
    const { data: newChatbot, error: insertError } = await supabaseAdmin
      .from('chatbots')
      .insert(chatbotDataToInsert)
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/teacher/chatbots] Error creating chatbot:', {
        error: insertError,
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        data: chatbotDataToInsert
      });
      if (insertError.code === '23505') {
         return NextResponse.json({ error: 'A chatbot with this name might already exist or another unique constraint was violated.' }, { status: 409 });
      }
      throw insertError;
    }

    console.log('[POST /api/teacher/chatbots] Chatbot created successfully:', newChatbot);
    
    // If this is a viewing room bot with a video URL, save it immediately
    if (body.bot_type === 'viewing_room' && body.video_url && newChatbot.chatbot_id) {
      try {
        console.log('[POST /api/teacher/chatbots] Saving video URL for viewing room bot:', body.video_url);
        
        // Parse and validate the video URL
        const { parseVideoUrl, validateVideoUrl } = await import('@/lib/utils/video-utils');
        const validation = validateVideoUrl(body.video_url);
        
        if (validation.valid) {
          const videoInfo = parseVideoUrl(body.video_url);
          
          // Create reading document record for the video
          const { error: videoError } = await supabaseAdmin
            .from('reading_documents')
            .insert({
              chatbot_id: newChatbot.chatbot_id,
              content_type: 'video',
              file_name: body.video_url,
              file_path: null,
              file_url: null,
              file_size: 0,
              video_url: videoInfo.originalUrl,
              video_platform: videoInfo.platform,
              video_id: videoInfo.videoId,
              video_metadata: {
                platform: videoInfo.platform,
                videoId: videoInfo.videoId,
                embedUrl: videoInfo.embedUrl,
                originalUrl: videoInfo.originalUrl,
                capturedAt: new Date().toISOString()
              }
            });
          
          if (videoError) {
            console.error('[POST /api/teacher/chatbots] Error saving video URL:', videoError);
            // Don't fail the whole request, just log the error
          } else {
            console.log('[POST /api/teacher/chatbots] Video URL saved successfully');
            
            // If RAG is enabled, fetch and process the transcript
            if (body.enable_rag && videoInfo.platform === 'youtube' && videoInfo.videoId) {
              // Import transcript utilities
              const { fetchYouTubeTranscript, formatTranscriptForKnowledgeBase } = await import('@/lib/youtube/transcript');
              
              try {
                console.log('[POST /api/teacher/chatbots] Fetching YouTube transcript for video:', videoInfo.videoId);
                const transcript = await fetchYouTubeTranscript(videoInfo.videoId);
                
                if (transcript) {
                  const formattedTranscript = formatTranscriptForKnowledgeBase(transcript);
                  const transcriptFileName = `transcript_${videoInfo.videoId}_${Date.now()}.txt`;
                  const transcriptPath = `${newChatbot.chatbot_id}/${transcriptFileName}`;
                  
                  // Upload transcript to storage
                  const { error: uploadError } = await supabaseAdmin.storage
                    .from('documents')
                    .upload(transcriptPath, new Blob([formattedTranscript], { type: 'text/plain' }), {
                      contentType: 'text/plain',
                      upsert: false
                    });
                  
                  if (!uploadError) {
                    // Create document record for the transcript
                    const { data: transcriptDoc, error: docError } = await supabaseAdmin
                      .from('documents')
                      .insert({
                        chatbot_id: newChatbot.chatbot_id,
                        file_name: `Video Transcript: ${transcript.title || videoInfo.videoId}`,
                        file_type: 'text',
                        file_size: formattedTranscript.length,
                        file_path: transcriptPath,
                        status: 'uploaded',
                        original_url: videoInfo.originalUrl
                      })
                      .select()
                      .single();
                    
                    if (!docError && transcriptDoc) {
                      console.log('[POST /api/teacher/chatbots] Transcript document created, ready for processing');
                      
                      // Process the transcript asynchronously
                      import('@/lib/document-processing/processor').then(({ processDocument }) => {
                        processDocument(transcriptDoc).catch(err => {
                          console.error('[POST /api/teacher/chatbots] Error processing transcript:', err);
                        });
                      });
                    }
                  }
                }
              } catch (transcriptError) {
                console.error('[POST /api/teacher/chatbots] Error fetching/processing transcript:', transcriptError);
                // Don't fail the request
              }
            }
          }
        }
      } catch (videoError) {
        console.error('[POST /api/teacher/chatbots] Error handling video URL:', videoError);
        // Don't fail the whole request
      }
    }
    
    return NextResponse.json(newChatbot, { status: 201 });
  } catch (error) {
    console.error('[POST /api/teacher/chatbots] Unexpected error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create chatbot',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


// DELETE Handler
export async function DELETE(request: NextRequest) {
    // Apply rate limiting for chatbot deletion
    const rateLimitResult = await checkRateLimit(request, {
        limit: 20,
        windowMs: 60 * 60 * 1000, // 20 deletions per hour
        message: 'Too many chatbot deletion requests. Please try again later.'
    });
    if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
    }
    
    const { searchParams } = new URL(request.url);
    const chatbotId = searchParams.get('chatbotId');

    if (!chatbotId) {
        return NextResponse.json({ error: 'Chatbot ID is required as a query parameter for deletion' }, { status: 400 });
    }
    console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Request received.`);

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Use admin client for all DB operations to bypass RLS
        const { data: chatbot, error: fetchError } = await supabaseAdmin
            .from('chatbots')
            .select('teacher_id, name')
            .eq('chatbot_id', chatbotId)
            .single();

        if (fetchError) {
            console.error(`[API DELETE /chatbots?chatbotId=${chatbotId}] Error fetching chatbot: ${fetchError.message}`);
            if (fetchError.code === 'PGRST116') return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
            return NextResponse.json({ error: 'Failed to fetch chatbot details' }, { status: 500 });
        }
        if (!chatbot) {
            return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
        }
        if (chatbot.teacher_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized to delete this chatbot' }, { status: 403 });
        }
        console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] User ${user.id} authorized to delete chatbot "${chatbot.name}".`);

        const documentsFolderPath = `${user.id}/${chatbotId}/`;
        console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Listing files in storage path: ${documentsFolderPath}`);
        const { data: filesInStorage, error: listError } = await supabaseAdmin.storage
            .from('documents')
            .list(documentsFolderPath);

        if (listError) {
            console.warn(`[API DELETE /chatbots?chatbotId=${chatbotId}] Error listing files in storage for cleanup: ${listError.message}`);
        } else if (filesInStorage && filesInStorage.length > 0) {
            const filePathsToRemove = filesInStorage.map(file => `${documentsFolderPath}${file.name}`);
            if (filePathsToRemove.length > 0) {
                console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Removing ${filePathsToRemove.length} files from storage.`);
                const { error: removeFilesError } = await supabaseAdmin.storage.from('documents').remove(filePathsToRemove);
                if (removeFilesError) console.warn(`[API DELETE /chatbots?chatbotId=${chatbotId}] Error removing files from storage: ${removeFilesError.message}`);
                else console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Successfully removed files from storage.`);
            }
        }

        console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Deleting chatbot record from database.`);
        const { error: deleteChatbotError } = await supabaseAdmin
            .from('chatbots')
            .delete()
            .eq('chatbot_id', chatbotId);

        if (deleteChatbotError) {
            console.error(`[API DELETE /chatbots?chatbotId=${chatbotId}] Error deleting chatbot from database: ${deleteChatbotError.message}`);
            throw deleteChatbotError;
        }
        console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Chatbot record deleted from database.`);

        try {
            console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Deleting vectors from Pinecone.`);
            await deleteChatbotVectors(chatbotId);
            console.log(`[API DELETE /chatbots?chatbotId=${chatbotId}] Pinecone vectors deletion initiated/completed.`);
        } catch (pineconeError) {
            console.error(`[API DELETE /chatbots?chatbotId=${chatbotId}] Error deleting vectors from Pinecone:`, pineconeError);
        }

        return NextResponse.json({ success: true, message: `Chatbot "${chatbot.name}" and associated data deleted.` });

    } catch (error) {
        console.error(`[API DELETE /chatbots?chatbotId=${chatbotId}] General error:`, error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete chatbot' }, { status: 500 });
    }
}