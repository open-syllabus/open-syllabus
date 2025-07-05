// src/app/api/student/memory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { memoryQueue, MemoryJobData } from '@/lib/queue/memory-queue-safe';
// OpenRouter is used for all LLM completions
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const dynamic = 'force-dynamic';

interface SaveMemoryRequest {
  studentId: string;
  chatbotId: string;
  roomId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sessionStartTime: string;
}

interface MemoryResponse {
  summary: string;
  keyTopics: string[];
  learningInsights: {
    understood: string[];
    struggling: string[];
    progress: string;
  };
  nextSteps: string;
}

// Generate conversation summary using GPT
async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>,
  chatbotName: string
): Promise<MemoryResponse> {
  // Create a conversation transcript
  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Student' : chatbotName}: ${m.content}`)
    .join('\n\n');
  
  const systemPrompt = `You are an educational assistant analyzing a student-chatbot conversation. 
Your task is to create a memory summary that will help the chatbot remember this student in future conversations.

Analyze the conversation and provide:
1. A concise summary of what was discussed (2-3 sentences)
2. Key topics covered (as an array)
3. Learning insights:
   - What concepts the student understood well
   - What concepts the student struggled with
   - Overall progress assessment
4. Suggested next steps for the student

Return your response as valid JSON matching this structure:
{
  "summary": "string",
  "keyTopics": ["topic1", "topic2"],
  "learningInsights": {
    "understood": ["concept1", "concept2"],
    "struggling": ["concept3"],
    "progress": "string describing overall progress"
  },
  "nextSteps": "string with recommendations"
}`;

  try {
    // Use OpenRouter for the completion
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ClassBots AI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite-preview-06-17', // Using Gemini 2.5 Flash Lite for best cost/performance
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this conversation:\n\n${transcript}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter error:', errorBody);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('Error generating summary:', error);
    // Return a basic summary if the API fails
    return {
      summary: 'Student had a conversation with the chatbot.',
      keyTopics: [],
      learningInsights: {
        understood: [],
        struggling: [],
        progress: 'Unable to assess'
      },
      nextSteps: 'Continue with regular curriculum'
    };
  }
}

// POST: Save conversation memory
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: SaveMemoryRequest = await request.json();
    const { studentId, chatbotId, roomId, messages, sessionStartTime } = body;

    // Verify the authenticated user matches the student ID or is a teacher
    if (user.id !== studentId) {
      // Check if user is a teacher for this room
      const adminSupabase = createAdminClient();
      const { data: room } = await adminSupabase
        .from('rooms')
        .select('teacher_id')
        .eq('room_id', roomId)
        .single();

      if (!room || room.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check if there's a recent memory save (within last 15 minutes) to prevent duplicates
    const adminSupabase = createAdminClient();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentMemory } = await adminSupabase
      .from('student_chat_memories')
      .select('id, created_at, message_count')
      .eq('student_id', studentId)
      .eq('chatbot_id', chatbotId)
      .eq('room_id', roomId)
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentMemory && recentMemory.length > 0) {
      console.log('[Memory API] Found recent memory save, checking if it\'s a duplicate...');
      const timeSinceLastSave = Date.now() - new Date(recentMemory[0].created_at).getTime();
      const minutesSinceLastSave = Math.floor(timeSinceLastSave / 1000 / 60);
      
      // If saved less than 10 minutes ago with similar message count, it's likely a duplicate
      if (minutesSinceLastSave < 10 && Math.abs(recentMemory[0].message_count - messages.length) < 2) {
        console.log(`[Memory API] Duplicate save prevented - last save was ${minutesSinceLastSave} minutes ago`);
        return NextResponse.json({
          success: true,
          memory: recentMemory[0],
          duplicate: true
        });
      }
    }

    // Prepare job data for the queue
    const jobData: MemoryJobData = {
      userId: studentId,
      roomId: roomId,
      memory: {
        content: JSON.stringify({
          studentId,
          chatbotId,
          messages,
          sessionStartTime,
          sessionDuration: Math.floor(
            (new Date().getTime() - new Date(sessionStartTime).getTime()) / 1000
          )
        }),
        metadata: {
          chatbotId,
          messageCount: messages.length,
          sessionStartTime
        }
      },
      priority: messages.length > 20 ? 'high' : 'normal' // Prioritize longer conversations
    };

    // Check if Redis is available
    const REDIS_ENABLED = process.env.ENABLE_REDIS === 'true';
    
    if (!REDIS_ENABLED) {
      console.log('[Memory API] Redis disabled, processing memory directly...');
      
      try {
        // Get chatbot name
        const { data: chatbotData } = await adminSupabase
          .from('chatbots')
          .select('name')
          .eq('chatbot_id', chatbotId)
          .single();
          
        const chatbotName = chatbotData?.name || 'Assistant';
        
        // Generate the memory summary directly
        const summary = await generateConversationSummary(
          messages,
          chatbotName
        );
        
        // Save directly to database (studentId here is actually auth_user_id)
        const memoryData = {
          student_id: studentId, // This is the auth_user_id passed from the chat
          chatbot_id: chatbotId,
          room_id: roomId,
          conversation_summary: summary.summary,
          key_topics: summary.keyTopics,
          learning_insights: summary.learningInsights,
          next_steps: summary.nextSteps,
          message_count: messages.length,
          session_duration_seconds: Math.floor(
            (new Date().getTime() - new Date(sessionStartTime).getTime()) / 1000
          ),
          created_at: new Date().toISOString()
        };
        
        const { data: savedMemory, error: saveError } = await adminSupabase
          .from('student_chat_memories')
          .insert(memoryData)
          .select()
          .single();
          
        if (saveError) {
          console.error('[Memory API] Failed to save memory directly:', saveError);
          throw saveError;
        }
        
        console.log('[Memory API] Memory saved directly:', savedMemory?.id);
        
        return NextResponse.json({
          success: true,
          memory: savedMemory,
          direct: true,
          message: 'Memory processed and saved successfully'
        });
        
      } catch (directSaveError) {
        console.error('[Memory API] Direct save failed:', directSaveError);
        return NextResponse.json({
          error: 'Failed to save memory',
          details: directSaveError instanceof Error ? directSaveError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Add job to queue with priority (original Redis path)
    const job = await memoryQueue.add('process-memory', jobData, {
      priority: jobData.priority === 'high' ? 1 : jobData.priority === 'low' ? 3 : 2,
      delay: 0, // Process immediately
      removeOnComplete: true,
      removeOnFail: false,
    });

    console.log(`[Memory API] Added job ${job.id} to queue for student ${studentId}`);

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Memory processing has been queued'
    });

  } catch (error) {
    console.error('Memory save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue memory processing' },
      { status: 500 }
    );
  }
}

// GET: Retrieve student memories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const chatbotId = searchParams.get('chatbotId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!studentId || !chatbotId) {
      return NextResponse.json(
        { error: 'studentId and chatbotId are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify access permissions
    const adminSupabase = createAdminClient();
    
    // First, we need to get the auth_user_id from the student_id
    const { data: studentData, error: studentError } = await adminSupabase
      .from('students')
      .select('auth_user_id')
      .eq('student_id', studentId)
      .single();
      
    if (studentError || !studentData || !studentData.auth_user_id) {
      console.error('Error fetching student auth_user_id:', studentError);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    const authUserId = studentData.auth_user_id;
    
    console.log('[Memory API GET] Looking for memories with:', {
      studentId: studentId,
      authUserId: authUserId,
      chatbotId: chatbotId
    });
    
    // Get recent memories using the auth_user_id
    const { data: memories, error: memoriesError } = await adminSupabase
      .from('student_chat_memories')
      .select('*')
      .eq('student_id', authUserId)
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
      return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
    }

    // Get learning profile using the auth_user_id
    const { data: profile } = await adminSupabase
      .from('student_learning_profiles')
      .select('*')
      .eq('student_id', authUserId)
      .eq('chatbot_id', chatbotId)
      .single();

    console.log('[Memory API GET] Found memories:', memories?.length || 0);
    console.log('[Memory API GET] Found profile:', profile ? 'Yes' : 'No');
    
    return NextResponse.json({
      memories: memories || [],
      profile: profile || null
    });

  } catch (error) {
    console.error('Memory fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch memories' },
      { status: 500 }
    );
  }
}

// New endpoint to check job status
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await memoryQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    const progress = await job.progress();
    
    // Type-safe property access for Bull.Job
    const result = 'returnvalue' in job ? (job as any).returnvalue : null;
    const failedReason = 'failedReason' in job ? (job as any).failedReason : null;
    const timestamp = 'timestamp' in job ? (job as any).timestamp : null;
    const processedOn = 'processedOn' in job ? (job as any).processedOn : null;

    return NextResponse.json({
      jobId: job.id,
      state,
      progress,
      result,
      failedReason,
      createdAt: timestamp,
      processedAt: processedOn,
      finishedAt: 'finishedOn' in job ? (job as any).finishedOn : null
    });

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}