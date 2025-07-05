import { Job, DoneCallback } from 'bull';
import { memoryQueue, MemoryJobData, MemoryJobResult, PodcastJobData, PodcastJobResult } from './memory-queue-safe';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/openai/embeddings';
import { getUserSpellingPreferenceAdmin, getSpellingInstruction } from '@/lib/utils/spelling-preference';
import openai from '@/lib/openai/client';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Connection pool for Supabase
const connectionPool = new Map<string, ReturnType<typeof createAdminClient>>();
const MAX_POOL_SIZE = 50;
const CONNECTION_TTL = 5 * 60 * 1000; // 5 minutes

interface PooledConnection {
  client: ReturnType<typeof createAdminClient>;
  lastUsed: number;
}

// Get or create a pooled connection
function getPooledConnection(): ReturnType<typeof createAdminClient> {
  const now = Date.now();
  
  // Clean up old connections
  for (const [key, conn] of connectionPool.entries()) {
    if (now - (conn as any).lastUsed > CONNECTION_TTL) {
      connectionPool.delete(key);
    }
  }
  
  // Reuse existing connection or create new one
  if (connectionPool.size < MAX_POOL_SIZE) {
    const client = createAdminClient();
    const key = `conn_${now}_${Math.random()}`;
    connectionPool.set(key, client);
    (client as any).lastUsed = now;
    return client;
  } else {
    // Reuse least recently used connection
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const [key, client] of connectionPool.entries()) {
      const lastUsed = (client as any).lastUsed || 0;
      if (lastUsed < oldestTime) {
        oldestTime = lastUsed;
        oldestKey = key;
      }
    }
    
    const client = connectionPool.get(oldestKey)!;
    (client as any).lastUsed = now;
    return client;
  }
}

// Helper function to format study guide content for podcast
function formatForPodcast(content: string, title: string, spellingPreference: 'UK' | 'US' = 'UK'): string {
  // Add intro
  let podcastScript = `Welcome to your revision podcast! Today we're covering: ${title}.\n\n`;
  podcastScript += "Let's dive into your study guide.\n\n";
  
  // Process the markdown content to make it more podcast-friendly
  let processedContent = content;
  
  // Replace markdown headings with spoken transitions
  processedContent = processedContent.replace(/^# (.+)$/gm, 'Main topic: $1.');
  processedContent = processedContent.replace(/^## (.+)$/gm, '\nNow, let\'s talk about: $1.\n');
  processedContent = processedContent.replace(/^### (.+)$/gm, '\nHere\'s an important point: $1.\n');
  
  // Replace bullet points with spoken lists
  processedContent = processedContent.replace(/^- (.+)$/gm, 'Point: $1.');
  processedContent = processedContent.replace(/^\* (.+)$/gm, 'Point: $1.');
  processedContent = processedContent.replace(/^\d+\. (.+)$/gm, 'Number $&');
  
  // Handle bold text for emphasis
  processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '$1');
  processedContent = processedContent.replace(/__(.+?)__/g, '$1');
  
  // Remove other markdown syntax
  processedContent = processedContent.replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links
  processedContent = processedContent.replace(/`(.+?)`/g, '$1'); // Inline code
  processedContent = processedContent.replace(/```[\s\S]+?```/g, ''); // Code blocks
  
  // Apply spelling corrections based on preference
  if (spellingPreference === 'US') {
    // Convert UK to US spelling
    processedContent = processedContent.replace(/\bcolour\b/gi, 'color');
    processedContent = processedContent.replace(/\bcentre\b/gi, 'center');
    processedContent = processedContent.replace(/\borganise\b/gi, 'organize');
    processedContent = processedContent.replace(/\borganised\b/gi, 'organized');
    processedContent = processedContent.replace(/\borganising\b/gi, 'organizing');
    processedContent = processedContent.replace(/\banalyse\b/gi, 'analyze');
    processedContent = processedContent.replace(/\banalysed\b/gi, 'analyzed');
    processedContent = processedContent.replace(/\banalysing\b/gi, 'analyzing');
    processedContent = processedContent.replace(/\brecognise\b/gi, 'recognize');
    processedContent = processedContent.replace(/\brealise\b/gi, 'realize');
    processedContent = processedContent.replace(/\btheatre\b/gi, 'theater');
    processedContent = processedContent.replace(/\bdefence\b/gi, 'defense');
    processedContent = processedContent.replace(/\blicence\b/gi, 'license');
    processedContent = processedContent.replace(/\bpractise\b/gi, 'practice');
  } else {
    // Convert US to UK spelling (default)
    processedContent = processedContent.replace(/\bcolor\b/gi, 'colour');
    processedContent = processedContent.replace(/\bcenter\b/gi, 'centre');
    processedContent = processedContent.replace(/\borganize\b/gi, 'organise');
    processedContent = processedContent.replace(/\borganized\b/gi, 'organised');
    processedContent = processedContent.replace(/\borganizing\b/gi, 'organising');
    processedContent = processedContent.replace(/\banalyze\b/gi, 'analyse');
    processedContent = processedContent.replace(/\banalyzed\b/gi, 'analysed');
    processedContent = processedContent.replace(/\banalyzing\b/gi, 'analysing');
    processedContent = processedContent.replace(/\brecognize\b/gi, 'recognise');
    processedContent = processedContent.replace(/\brealize\b/gi, 'realise');
    processedContent = processedContent.replace(/\btheater\b/gi, 'theatre');
    processedContent = processedContent.replace(/\bdefense\b/gi, 'defence');
    processedContent = processedContent.replace(/\blicense\b/gi, 'licence');
    processedContent = processedContent.replace(/\bpractice\b/gi, 'practise');
  }

  // Add the processed content
  podcastScript += processedContent;
  
  // Add outro with appropriate spelling
  const organize = spellingPreference === 'US' ? 'organize' : 'organise';
  podcastScript += `\n\nThat concludes your revision podcast. Remember to ${organize} and review these key points regularly. Good luck with your studies!`;
  
  return podcastScript;
}

// Helper to split long content into chunks (OpenAI has a 4096 character limit)
function splitIntoChunks(text: string, maxLength: number = 3000): string[] {
  // Use a smaller max length to ensure we stay well under the limit
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Process podcast generation job
async function processPodcastJob(job: Job<PodcastJobData>): Promise<PodcastJobResult> {
  const { studyGuideId, userId, studyGuideContent, studyGuideTitle, voice, speed } = job.data;
  const startTime = Date.now();
  
  console.log(`[Podcast Worker] Processing job ${job.id} for study guide ${studyGuideId}`);
  
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Update job progress
    await job.progress(5);
    
    // Get pooled connection
    const supabase = getPooledConnection();
    
    // Check if podcast already exists
    const { data: existingPodcast } = await supabase
      .from('study_guide_podcasts')
      .select('podcast_id, audio_url')
      .eq('study_guide_id', studyGuideId)
      .eq('voice', voice)
      .eq('speed', speed)
      .single();

    if (existingPodcast && existingPodcast.audio_url) {
      console.log(`[Podcast Worker] Using existing podcast for job ${job.id}`);
      return {
        success: true,
        podcastId: existingPodcast.podcast_id,
        audioUrl: existingPodcast.audio_url,
        progress: 100
      };
    }

    await job.progress(10);

    // Get user's spelling preference
    const spellingPreference = await getUserSpellingPreferenceAdmin(userId);
    console.log(`[Podcast Worker] Using ${spellingPreference} English spelling for user ${userId}`);

    // Format content for podcast
    const podcastScript = formatForPodcast(studyGuideContent, studyGuideTitle, spellingPreference);
    
    // Split into chunks if needed
    const chunks = splitIntoChunks(podcastScript);
    console.log(`[Podcast Worker] Split into ${chunks.length} chunks`);
    
    await job.progress(15);
    
    // Validate chunks
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].length > 4096) {
        console.error(`Chunk ${i} is too long: ${chunks[i].length} characters`);
        // Force split it further
        const subChunks = [];
        let text = chunks[i];
        while (text.length > 0) {
          subChunks.push(text.substring(0, 3000));
          text = text.substring(3000);
        }
        chunks.splice(i, 1, ...subChunks);
      }
    }
    
    await job.progress(20);
    
    // Generate audio for each chunk
    const audioBuffers: ArrayBuffer[] = [];
    const progressPerChunk = 60 / chunks.length; // 60% of progress for TTS generation
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[Podcast Worker] Generating audio for chunk ${i + 1}/${chunks.length}, length: ${chunk.length}`);
      
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1', // Using standard model
        voice: voice as any,
        input: chunk,
        speed: speed,
      });
      
      const buffer = await mp3Response.arrayBuffer();
      audioBuffers.push(buffer);
      
      // Update progress
      const currentProgress = 20 + (i + 1) * progressPerChunk;
      await job.progress(Math.min(80, currentProgress));
    }
    
    await job.progress(85);
    
    // Combine audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of audioBuffers) {
      combinedBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
    
    await job.progress(90);
    
    // Generate unique filename
    const filename = `study-guide-${studyGuideId}-${voice}-${speed}x-${Date.now()}.mp3`;
    const filePath = `podcasts/${userId}/${filename}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, combinedBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000' // Cache for 1 year
      });

    if (uploadError) {
      console.error('Error uploading audio file:', uploadError);
      throw new Error(`Failed to upload audio file: ${uploadError.message}`);
    }

    await job.progress(95);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath);
    
    // Create podcast record with audio URL
    const { data: podcast, error: createError } = await supabase
      .from('study_guide_podcasts')
      .insert({
        study_guide_id: studyGuideId,
        student_id: userId,
        voice,
        speed,
        duration_seconds: Math.ceil(podcastScript.length / 150), // Rough estimate
        file_size_bytes: combinedBuffer.byteLength,
        audio_url: publicUrl,
        script_preview: podcastScript.substring(0, 500),
        metadata: {
          chunks: chunks.length,
          original_length: studyGuideContent.length,
          script_length: podcastScript.length,
          file_path: filePath
        }
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating podcast record:', createError);
      // Try to clean up the uploaded file
      await supabase.storage.from('audio-files').remove([filePath]);
      throw new Error('Failed to save podcast record');
    }

    await job.progress(100);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Podcast Worker] Job ${job.id} completed in ${processingTime}ms`);
    
    return {
      success: true,
      podcastId: podcast.podcast_id,
      audioUrl: publicUrl,
      progress: 100
    };
    
  } catch (error) {
    console.error(`[Podcast Worker] Job ${job.id} failed:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      progress: 0
    };
  }
}

// Generate conversation summary using GPT
async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>,
  chatbotName: string
): Promise<any> {
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
        model: 'openai/gpt-4.1-nano',
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

// Process memory job
async function processMemoryJob(job: Job<MemoryJobData>): Promise<MemoryJobResult> {
  const { userId, roomId, memory } = job.data;
  const startTime = Date.now();
  
  console.log(`[Memory Worker] Processing job ${job.id} for user ${userId} in room ${roomId}`);
  
  try {
    // Update job progress
    await job.progress(10);
    
    // Parse the memory content
    const memoryData = JSON.parse(memory.content);
    const { studentId, chatbotId, messages, sessionStartTime, sessionDuration } = memoryData;
    
    // Get pooled connection
    const supabase = getPooledConnection();
    
    // Get chatbot name for context
    await job.progress(20);
    const { data: chatbot } = await supabase
      .from('chatbots')
      .select('name')
      .eq('chatbot_id', chatbotId)
      .single();
    
    const chatbotName = chatbot?.name || 'Assistant';
    
    // Generate conversation summary
    await job.progress(30);
    const summary = await generateConversationSummary(messages, chatbotName);
    
    await job.progress(50);
    
    // Store in database with retry logic
    let retries = 3;
    let lastError: any;
    
    while (retries > 0) {
      try {
        const { data: savedMemory, error: dbError } = await supabase
          .from('student_chat_memories')
          .insert({
            student_id: studentId,
            chatbot_id: chatbotId,
            room_id: roomId,
            conversation_summary: summary.summary,
            key_topics: summary.keyTopics,
            learning_insights: summary.learningInsights,
            next_steps: summary.nextSteps,
            message_count: messages.length,
            session_duration_seconds: sessionDuration
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        await job.progress(70);
        
        // Update or create learning profile
        const { data: existingProfile } = await supabase
          .from('student_learning_profiles')
          .select('*')
          .eq('student_id', studentId)
          .eq('chatbot_id', chatbotId)
          .single();

        if (existingProfile) {
          // Update existing profile
          const updatedTopicsInProgress = new Set([
            ...existingProfile.topics_in_progress,
            ...summary.keyTopics
          ]);
          
          const updatedTopicProgress = { ...existingProfile.topic_progress };
          summary.keyTopics.forEach((topic: string) => {
            if (!updatedTopicProgress[topic]) {
              updatedTopicProgress[topic] = { level: 50, last_reviewed: new Date().toISOString() };
            } else {
              updatedTopicProgress[topic].last_reviewed = new Date().toISOString();
            }
          });

          // Move understood concepts to mastered if confidence is high
          summary.learningInsights.understood.forEach((concept: string) => {
            const currentLevel = updatedTopicProgress[concept]?.level || 50;
            updatedTopicProgress[concept] = {
              level: Math.min(100, currentLevel + 10),
              last_reviewed: new Date().toISOString()
            };
          });

          // Track struggling concepts
          summary.learningInsights.struggling.forEach((concept: string) => {
            const currentLevel = updatedTopicProgress[concept]?.level || 50;
            updatedTopicProgress[concept] = {
              level: Math.max(0, currentLevel - 5),
              last_reviewed: new Date().toISOString()
            };
          });

          await supabase
            .from('student_learning_profiles')
            .update({
              topics_in_progress: Array.from(updatedTopicsInProgress),
              topic_progress: updatedTopicProgress,
              total_sessions: existingProfile.total_sessions + 1,
              total_messages: existingProfile.total_messages + messages.filter((m: any) => m.role === 'user').length,
              last_session_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);
        } else {
          // Create new profile
          const topicProgress: Record<string, any> = {};
          summary.keyTopics.forEach((topic: string) => {
            topicProgress[topic] = { level: 50, last_reviewed: new Date().toISOString() };
          });

          await supabase
            .from('student_learning_profiles')
            .insert({
              student_id: studentId,
              chatbot_id: chatbotId,
              room_id: roomId,
              topics_in_progress: summary.keyTopics,
              topic_progress: topicProgress,
              total_sessions: 1,
              total_messages: messages.filter((m: any) => m.role === 'user').length,
              last_session_at: new Date().toISOString()
            });
        }
        
        await job.progress(100);
        
        const processingTime = Date.now() - startTime;
        console.log(`[Memory Worker] Job ${job.id} completed in ${processingTime}ms`);
        
        return {
          success: true,
          memoryId: savedMemory.id,
        };
      } catch (error) {
        retries--;
        lastError = error;
        
        if (retries > 0) {
          console.warn(`[Memory Worker] Database retry ${3 - retries}/3 for job ${job.id}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }
    
    throw new Error(`Database operation failed after 3 retries: ${lastError}`);
  } catch (error) {
    console.error(`[Memory Worker] Job ${job.id} failed:`, error);
    
    // Log to error tracking service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Worker configuration
const CONCURRENCY = parseInt(process.env.MEMORY_WORKER_CONCURRENCY || '10');

// Start the worker
export function startMemoryWorker() {
  console.log(`[Memory Worker] Starting with concurrency: ${CONCURRENCY}`);
  
  // Process memory jobs
  memoryQueue.process('memory-processing', CONCURRENCY, async (job: Job<MemoryJobData>, done: DoneCallback) => {
    try {
      const result = await processMemoryJob(job);
      done(null, result);
    } catch (error) {
      done(error as Error);
    }
  });

  // Process podcast generation jobs (lower concurrency for TTS-heavy operations)
  const podcastConcurrency = Math.max(1, Math.floor(CONCURRENCY / 3)); // Use 1/3 of memory concurrency
  memoryQueue.process('podcast-generation', podcastConcurrency, async (job: Job<PodcastJobData>, done: DoneCallback) => {
    try {
      const result = await processPodcastJob(job);
      done(null, result);
    } catch (error) {
      done(error as Error);
    }
  });
  
  // Monitor worker health
  setInterval(async () => {
    try {
      const metrics = await getWorkerMetrics();
      console.log('[Memory Worker] Metrics:', metrics);
      
      // Alert if queue is backing up
      if (metrics.waiting > 1000) {
        console.warn('[Memory Worker] High queue backlog:', metrics.waiting);
        // Send alert to monitoring service
      }
    } catch (error) {
      console.error('[Memory Worker] Failed to get metrics:', error);
    }
  }, 60000); // Check every minute
}

// Get worker metrics
async function getWorkerMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    memoryQueue.getWaitingCount(),
    memoryQueue.getActiveCount(),
    memoryQueue.getCompletedCount(),
    memoryQueue.getFailedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    connectionPoolSize: connectionPool.size,
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Memory Worker] Received SIGTERM, shutting down gracefully...');
  await memoryQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Memory Worker] Received SIGINT, shutting down gracefully...');
  await memoryQueue.close();
  process.exit(0);
});

// Auto-start if this file is run directly
if (require.main === module) {
  startMemoryWorker();
}