// Shared chat processing logic to avoid internal HTTP calls in Vercel
// This extracts the core streaming logic from the main chat route

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/openai/embeddings';
import { queryVectors } from '@/lib/pinecone/utils';
import type { ChatMessage } from '@/types/database.types';
import { processNotebookLMQuery } from './notebook-lm-processor';
import { initialConcernCheck, checkMessageSafety } from '@/lib/safety/monitoring';
import type { Room } from '@/types/database.types';
import { getStudentMinimumAge, createAgeContext } from '@/lib/utils/age-utils';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ProcessChatParams {
  roomId: string;
  userId: string;
  content: string;
  chatbotId: string;
  model?: string;
  messageId: string;
  instanceId?: string;
  countryCode?: string | null;
  isStudent: boolean;
  isTeacher: boolean;
}

export async function processChatMessage(params: ProcessChatParams): Promise<ReadableStream> {
  const {
    roomId,
    userId,
    content,
    chatbotId,
    model,
    messageId,
    instanceId,
    isStudent,
    isTeacher,
    countryCode
  } = params;

  const supabaseAdmin = createAdminClient();

  // Get chatbot configuration
  const { data: chatbotConfig, error: chatbotError } = await supabaseAdmin
    .from('chatbots')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .single();

  if (chatbotError || !chatbotConfig) {
    throw new Error('Chatbot not found');
  }

  // Get student age context if this is a student
  let studentAge: number | null = null;
  let ageContext = '';
  
  if (isStudent) {
    // Get student's year group
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('year_group, school_id')
      .eq('auth_user_id', userId)
      .single();
    
    if (studentData?.year_group) {
      // Get room's teacher to get country code
      const { data: roomData } = await supabaseAdmin
        .from('rooms')
        .select('teacher_id')
        .eq('room_id', roomId)
        .single();
      
      if (roomData?.teacher_id) {
        // Get teacher's country code
        const { data: teacherData } = await supabaseAdmin
          .from('teacher_profiles')
          .select('country_code')
          .eq('user_id', roomData.teacher_id)
          .single();
        
        if (teacherData?.country_code) {
          // Calculate student's minimum age
          studentAge = getStudentMinimumAge(studentData.year_group, teacherData.country_code);
          if (studentAge) {
            ageContext = createAgeContext(studentAge);
          }
        }
      }
    }
  }

  // SAFETY CHECK: Check for concerning content before processing
  console.log(`[ProcessChat] Starting safety check - isStudent: ${isStudent}, userId: ${userId}, studentAge: ${studentAge}, content: "${content.substring(0, 50)}..."`);
  
  if (isStudent) {
    const { hasConcern, concernType } = await initialConcernCheck(content, studentAge);
    console.log(`[ProcessChat] Initial concern check result - hasConcern: ${hasConcern}, concernType: ${concernType}`);
    
    if (hasConcern && concernType) {
      console.log(`[ProcessChat] Safety concern detected: ${concernType}`);
      
      // Get room data for safety check
      const { data: roomData, error: roomError } = await supabaseAdmin
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();
        
      if (!roomError && roomData) {
        // Get the actual student_id from the students table
        const { data: studentData, error: studentError } = await supabaseAdmin
          .from('students')
          .select('student_id')
          .eq('auth_user_id', userId)
          .single();
          
        if (!studentError && studentData) {
          console.log(`[ProcessChat] Running safety check for student ${studentData.student_id}, age: ${studentAge}, message: "${content.substring(0, 100)}..."`);
          // Run safety check which will insert safety response with the correct student_id
          const safetyResult = await checkMessageSafety(
            supabaseAdmin,
            content,
            messageId,
            studentData.student_id, // Use the actual student_id, not auth_user_id
            roomData as Room,
            countryCode || null,
            instanceId, // Pass the instance_id for proper message association
            studentAge // Pass the student's age for age-appropriate safety monitoring
          );
          
          console.log(`[ProcessChat] Safety check result: concernDetected=${safetyResult.concernDetected}, messageSent=${safetyResult.messageSent}`);
          
          if (safetyResult.concernDetected) {
            // Safety concern was detected, return empty stream to skip normal AI response
            // This prevents the AI from engaging with the topic even if no message was sent due to cooldown
            console.log(`[ProcessChat] Safety concern detected, skipping normal AI response`);
            const encoder = new TextEncoder();
            return new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              }
            });
          }
        } else {
          console.error(`[ProcessChat] Failed to get student_id for auth_user_id ${userId}:`, studentError);
        }
        // If no safety message was sent, continue with normal chat flow
      }
    }
  }

  // Handle KnowledgeBook bots differently
  if (chatbotConfig.bot_type === 'knowledge_book') {
    console.log(`[ProcessChat] Processing KnowledgeBook query for chatbot ${chatbotId}`);
    console.log(`[ProcessChat] KnowledgeBook config:`, {
      enable_rag: chatbotConfig.enable_rag,
      strict_document_only: chatbotConfig.strict_document_only,
      min_confidence_score: chatbotConfig.min_confidence_score
    });
    
    const encoder = new TextEncoder();
    
    return new ReadableStream({
      async start(controller) {
        try {
          // Use NotebookLM processor for document-only responses
          const result = await processNotebookLMQuery(
            content,
            chatbotId,
            {
              minConfidence: chatbotConfig.min_confidence_score || 0.65, // Balanced threshold for relevance
              maxSources: 5,
              requireCitations: chatbotConfig.require_citations !== false
            }
          );

          // Save user message
          const userMessageData = {
            message_id: messageId,
            room_id: roomId,
            user_id: userId,
            role: 'user' as const,
            content: content,
            metadata: { chatbotId }
          };

          if (isStudent && instanceId) {
            (userMessageData as any).instance_id = instanceId;
          }

          await supabaseAdmin
            .from('chat_messages')
            .insert(userMessageData);

          // Stream the response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            content: result.content,
            citations: result.citations,
            confidence: result.confidence
          })}\n\n`));

          // Save assistant message with citations
          const assistantMessageData = {
            room_id: roomId,
            user_id: userId,
            role: 'assistant' as const,
            content: result.content,
            metadata: { 
              chatbotId,
              isKnowledgeBook: true
            },
            citations: result.citations,
            confidence_score: result.confidence
          };

          if (isStudent && instanceId) {
            (assistantMessageData as any).instance_id = instanceId;
          }

          await supabaseAdmin
            .from('chat_messages')
            .insert(assistantMessageData);

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in KnowledgeBook processing:', error);
          controller.error(error);
        }
      }
    });
  }

  // Regular chatbot flow (non-KnowledgeBook)
  let context = '';

  // Check if chatbot has documents before attempting RAG
  const { count: documentCount } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('chatbot_id', chatbotId)
    .eq('status', 'completed');

  // Only use RAG if documents exist
  if (documentCount && documentCount > 0) {
    try {
      // Generate embedding for the user's message
      const userEmbedding = await generateEmbedding(content);

      // Get context from Pinecone
      const topK = 3;
      const contextResults = await queryVectors(
        userEmbedding,
        chatbotId,
        topK
      );

      context = contextResults
        .map((match: any) => match.metadata?.text || '')
        .filter(text => text)
        .join('\n\n');
        
      console.log(`[ProcessChat] RAG context retrieved for chatbot ${chatbotId}, context length: ${context.length}`);
    } catch (error) {
      console.error(`[ProcessChat] RAG operation failed for chatbot ${chatbotId}:`, error);
      // Continue without context rather than failing the entire chat
    }
  } else {
    console.log(`[ProcessChat] No documents found for chatbot ${chatbotId}, skipping RAG`);
  }

  // Get conversation history with metadata
  let historyQuery = supabaseAdmin
    .from('chat_messages')
    .select('role, content, created_at, metadata')
    .eq('room_id', roomId)
    .eq('metadata->>chatbotId', chatbotId)
    .neq('message_id', messageId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (isStudent && instanceId) {
    historyQuery = historyQuery.eq('instance_id', instanceId);
  }

  const { data: history } = await historyQuery;

  const conversationHistory = (history || [])
    .reverse()
    .map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      metadata: msg.metadata
    }));

  // Check if there's a recent safety message in the conversation
  let shouldAddSafetyContext = false;
  if (conversationHistory.length > 0) {
    // Look for any system safety messages in recent history
    const hasSafetyMessage = conversationHistory.some(msg => 
      msg.role === 'system' && msg.metadata?.isSystemSafetyResponse === true
    );
    
    if (hasSafetyMessage) {
      shouldAddSafetyContext = true;
    }
  }

  // Build system prompt with safety context if needed
  let systemPrompt = chatbotConfig.system_prompt;
  
  // CRITICAL SAFETY INSTRUCTION - Always added for student safety
  const safetyBoundaryInstruction = `\n\nCRITICAL SAFETY RULES - YOU MUST FOLLOW THESE:

1. NEVER ENGAGE WITH PERSONAL TOPICS:
   - Relationships, dating, crushes, girlfriends/boyfriends
   - Family problems, personal emotions, mental health
   - Social issues, friendship problems, bullying
   - Any non-academic personal matters

2. ALWAYS REDIRECT TO ACADEMIC CONTENT:
   - "I'm here to help with your learning. What subject would you like to work on?"
   - "Let's focus on your studies. Which topic can I help you understand better?"
   - "I can assist with academic subjects. What would you like to learn about today?"
   - "For personal matters, please speak with your teacher or school counselor. Now, what academic topic shall we explore?"

3. NEVER PROVIDE:
   - Relationship advice or dating tips
   - Personal life guidance
   - Emotional support or counseling
   - Friendship advice
   - Any non-educational assistance

4. YOU ARE STRICTLY AN EDUCATIONAL TOOL:
   - Only discuss academic subjects
   - Only help with learning and understanding concepts
   - Only provide educational content
   - Politely but firmly redirect ALL personal topics

5. IF STUDENT PERSISTS WITH PERSONAL TOPICS:
   - "I'm designed to help with academic learning only. Please choose a subject to study."
   - "I can only assist with educational content. What would you like to learn?"
   - Do not engage, sympathize, or provide any personal advice
   - Keep redirecting to academic topics`;
  
  systemPrompt += safetyBoundaryInstruction;
  
  // Add age context if available
  if (ageContext) {
    systemPrompt += `\n\n${ageContext}`;
  }
  
  if (shouldAddSafetyContext) {
    systemPrompt += `\n\nIMPORTANT: A safety support message was previously sent. DO NOT ENGAGE WITH THE PERSONAL TOPIC THAT TRIGGERED IT.
    - Redirect immediately to academic content
    - Do not provide relationship advice, dating tips, or personal guidance
    - Say something like: "I'm here to help with your learning. What subject would you like to work on today?"
    - Do not acknowledge or discuss the personal matter
    - Focus ONLY on academic subjects`;
  }

  // Build messages for OpenRouter (strip metadata and filter out system safety messages)
  const messagesForAI = conversationHistory
    .filter(msg => !(msg.role === 'system' && msg.metadata?.isSystemSafetyResponse === true))
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

  const messages = [
    {
      role: 'system' as const,
      content: context 
        ? `${systemPrompt}\n\nContext:\n${context}`
        : systemPrompt
    },
    ...messagesForAI,
    {
      role: 'user' as const,
      content
    }
  ];

  // Create streaming response
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Skolr AI',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model || chatbotConfig.model || 'openai/gpt-4.1-mini',
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let assistantMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        // Save the assistant's message
        const assistantMessageData = {
          room_id: roomId,
          user_id: userId,
          role: 'assistant' as const,
          content: assistantMessage,
          metadata: { chatbotId }
        };

        if (isStudent && instanceId) {
          (assistantMessageData as any).instance_id = instanceId;
        }

        await supabaseAdmin
          .from('chat_messages')
          .insert(assistantMessageData);

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Error in chat processing:', error);
        controller.error(error);
      }
    }
  });
}