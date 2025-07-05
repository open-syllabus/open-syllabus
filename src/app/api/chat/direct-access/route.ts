// src/app/api/chat/direct-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processChatMessage } from '@/lib/chat/process-chat-message';
import { filterMessageContent, logFilteredContent } from '@/lib/safety/content-filter';
import { getKindFilterMessage, getKindModerationMessage } from '@/lib/safety/kind-messages';
import { moderateContent } from '@/lib/safety/ai-moderation';
import { initialConcernCheck } from '@/lib/safety/monitoring';
// We don't directly use this type here but keep for reference
// import type { ChatMessage } from '@/types/database.types';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');
    const chatbotId = searchParams.get('chatbotId');
    const instanceId = searchParams.get('instanceId');

    // Validate required parameters
    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId and userId are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Verify user exists - try both methods for compatibility
    let userExists = false;
    
    try {
      // Method 1: Try using auth.admin.getUserById if available
      if (supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserById === 'function') {
        const { data: userCheck, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && userCheck.user) {
          userExists = true;
        }
      }
    } catch (authMethodError) {
      console.warn('[API GET /chat/direct-access] Error with auth.admin.getUserById:', authMethodError);
    }
    
    if (!userExists) {
      // Method 2: Fall back to checking the students table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('students')
        .select('auth_user_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (profileError || !userProfile) {
        console.error('[API GET /chat/direct-access] User not found in student_profiles:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userExists = true;
    }
    
    if (!userExists) {
      console.error('[API GET /chat/direct-access] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the actual student_id from the students table
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (studentError || !studentData) {
      console.error('[API GET /chat/direct-access] Failed to get student_id for auth_user_id:', userId, studentError);
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const actualStudentId = studentData.student_id;
    console.log(`[API GET /chat/direct-access] Resolved student_id: ${actualStudentId} for auth_user_id: ${userId}`);

    // Verify the user has access to the room using the actual student_id
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('student_id', actualStudentId)
      .maybeSingle();

    if (membershipError) {
      console.error('[API GET /chat/direct-access] Error checking membership:', membershipError);
    }

    // If not a member, deny access - teachers must add students
    if (!membership) {
      console.log('[API GET /chat/direct-access] User not in room');
      return NextResponse.json(
        { error: 'Student is not a member of this room. Please ask your teacher to add you.' },
        { status: 403 }
      );
    }

    // Check if we have a student-specific instance to use
    let studentChatbotInstanceId = instanceId;
    
    if (chatbotId && !studentChatbotInstanceId) {
      // Try to find the student's instance for this chatbot
      const { data: instanceData, error: instanceError } = await supabaseAdmin
        .from('student_chatbot_instances')
        .select('instance_id')
        .eq('student_id', actualStudentId)
        .eq('room_id', roomId)
        .eq('chatbot_id', chatbotId)
        .single();
        
      if (!instanceError && instanceData?.instance_id) {
        console.log(`[API GET /chat/direct-access] Found instance ${instanceData.instance_id} for student ${userId}`);
        studentChatbotInstanceId = instanceData.instance_id;
      } else {
        // Create a new instance on-the-fly
        console.log(`[API GET /chat/direct-access] Creating new instance for student ${userId}`);
        
        const { data: newInstance, error: createError } = await supabaseAdmin
          .from('student_chatbot_instances')
          .insert({
            student_id: actualStudentId,
            chatbot_id: chatbotId,
            room_id: roomId
          })
          .select('instance_id')
          .single();
          
        if (!createError && newInstance) {
          studentChatbotInstanceId = newInstance.instance_id;
          console.log(`[API GET /chat/direct-access] Created new instance ${studentChatbotInstanceId}`);
        } else {
          console.error(`[API GET /chat/direct-access] Error creating instance:`, createError);
        }
      }
    }
    
    // Fetch messages using admin client to bypass RLS policies
    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId);
      
    if (studentChatbotInstanceId) {
      // If we have an instance ID, use that for precise filtering
      console.log(`[API GET /chat/direct-access] Using instance ${studentChatbotInstanceId} for filtering`);
      query = query.eq('instance_id', studentChatbotInstanceId);
    } else {
      // Fallback to traditional filtering
      console.log(`[API GET /chat/direct-access] Using traditional filtering without instance ID`);
      query = query.or(`user_id.eq.${userId},role.eq.assistant,role.eq.system`);
      
      if (chatbotId) {
        query = query.filter('metadata->>chatbotId', 'eq', chatbotId);
      }
    }

    const { data: messages, error: messagesError } = await query.order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[API GET /chat/direct-access] Error fetching messages:', messagesError);
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    console.log(`[API GET /chat/direct-access] Fetched ${messages?.length || 0} messages for room ${roomId}, user ${userId}, chatbot ${chatbotId || 'any'}`);
    
    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('[API GET /chat/direct-access] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');
    const instanceId = searchParams.get('instanceId');
    
    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId and userId are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Verify user exists - try both methods for compatibility
    let userExists = false;
    
    try {
      // Method 1: Try using auth.admin.getUserById if available
      if (supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.getUserById === 'function') {
        const { data: userCheck, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && userCheck.user) {
          userExists = true;
        }
      }
    } catch (authMethodError) {
      console.warn('[API POST /chat/direct-access] Error with auth.admin.getUserById:', authMethodError);
    }
    
    if (!userExists) {
      // Method 2: Fall back to checking the students table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('students')
        .select('auth_user_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      if (profileError || !userProfile) {
        console.error('[API POST /chat/direct-access] User not found in student_profiles:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userExists = true;
    }
    
    if (!userExists) {
      console.error('[API POST /chat/direct-access] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the actual student_id from the students table
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (studentError || !studentData) {
      console.error('[API POST /chat/direct-access] Failed to get student_id for auth_user_id:', userId, studentError);
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const actualStudentId = studentData.student_id;
    console.log(`[API POST /chat/direct-access] Resolved student_id: ${actualStudentId} for auth_user_id: ${userId}`);

    // Get body content
    const { content, chatbot_id, model, instance_id, country_code } = await request.json();
    
    console.log('[API POST /chat/direct-access] Request data:', {
      content: content?.substring(0, 50),
      chatbot_id,
      country_code,
      hasCountryCode: !!country_code,
      countryCodeType: typeof country_code
    });
    
    if (!content || !chatbot_id) {
      return NextResponse.json({ error: 'Missing content or chatbot_id in request body' }, { status: 400 });
    }
    
    // Use instance_id from either URL parameters or request body
    const effectiveInstanceId = instanceId || instance_id;

    // Verify and ensure room membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('student_id', actualStudentId)
      .maybeSingle();

    if (membershipError) {
      console.error('[API POST /chat/direct-access] Error checking membership:', membershipError);
    }

    if (!membership) {
      console.log('[API POST /chat/direct-access] User not in room');
      return NextResponse.json(
        { error: 'Student is not a member of this room. Please ask your teacher to add you.' },
        { status: 403 }
      );
    }

    // Find or create instance ID if not provided
    let studentChatbotInstanceId = effectiveInstanceId;
    
    if (!studentChatbotInstanceId) {
      console.log(`[API POST /chat/direct-access] No instance ID provided, finding or creating one`);
      
      // Try to find an existing instance
      const { data: existingInstance, error: findError } = await supabaseAdmin
        .from('student_chatbot_instances')
        .select('instance_id')
        .eq('student_id', actualStudentId)
        .eq('room_id', roomId)
        .eq('chatbot_id', chatbot_id)
        .single();
        
      if (!findError && existingInstance?.instance_id) {
        studentChatbotInstanceId = existingInstance.instance_id;
        console.log(`[API POST /chat/direct-access] Found existing instance ${studentChatbotInstanceId}`);
      } else {
        // Create a new instance
        const { data: newInstance, error: createError } = await supabaseAdmin
          .from('student_chatbot_instances')
          .insert({
            student_id: actualStudentId,
            chatbot_id: chatbot_id,
            room_id: roomId
          })
          .select('instance_id')
          .single();
          
        if (!createError && newInstance) {
          studentChatbotInstanceId = newInstance.instance_id;
          console.log(`[API POST /chat/direct-access] Created new instance ${studentChatbotInstanceId}`);
        } else {
          console.error(`[API POST /chat/direct-access] Error creating instance:`, createError);
        }
      }
    }
    
    // Store user message using admin client
    const userMessageToStore: any = {
      room_id: roomId,
      user_id: userId,
      role: 'user',
      content: content.trim(),
      metadata: { chatbotId: chatbot_id }
    };
    
    // Add instance_id if we have one
    if (studentChatbotInstanceId) {
      userMessageToStore.instance_id = studentChatbotInstanceId;
    }

    const { data: savedUserMessage, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert(userMessageToStore)
      .select('message_id, created_at')
      .single();

    if (messageError || !savedUserMessage) {
      console.error('[API POST /chat/direct-access] Error storing message:', messageError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Process the chat message directly without HTTP forwarding
    console.log(`[API POST /chat/direct-access] Processing chat message directly`);
    
    try {
      // Get user profile to determine role
      const { data: studentProfile } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();
      
      const isStudent = !!studentProfile;
      const isTeacher = !isStudent;
      
      console.log(`[API POST /chat/direct-access] User role check - isStudent: ${isStudent}, isTeacher: ${isTeacher}`);
      
      // CRITICAL: Check for safety concerns FIRST before any content filtering
      // This ensures students in crisis receive help resources, not generic blocked messages
      let mightBeSafetyConcern = false;
      if (isStudent) {
        const safetyCheck = await initialConcernCheck(content.trim());
        mightBeSafetyConcern = safetyCheck.hasConcern;
        
        if (mightBeSafetyConcern) {
          console.log(`[API POST /chat/direct-access] Safety concern detected - will ensure message is processed for helpline response`);
        }
      }
      
      // Content filtering for students - but NOT if it's a safety concern
      if (isStudent && !mightBeSafetyConcern) {
        const filterResult = filterMessageContent(content.trim(), true, true);
        
        if (filterResult.isBlocked) {
          console.log(`[API POST /chat/direct-access] Content filtered for user ${userId}: ${filterResult.reason}`);
          
          // Log the filtered content for compliance
          // Note: logFilteredContent expects auth_user_id for filtered_messages table
          // but actual student_id for flagged_messages table
          await logFilteredContent(
            userId,  // auth_user_id for filtered_messages
            roomId,
            content.trim(),
            filterResult.reason || 'Unknown reason',
            supabaseAdmin,
            filterResult.flaggedPatterns,
            actualStudentId  // actual student_id for flagged_messages
          );
          
          // Return a friendly message to the user using kind messages
          const kindMessage = getKindFilterMessage(filterResult.reason || '');
          
          // Insert a system message to show the kind message in chat
          const systemMessageId = `system-filter-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await supabaseAdmin
            .from('chat_messages')
            .insert({
              message_id: systemMessageId,
              room_id: roomId,
              user_id: userId,
              role: 'system',
              content: kindMessage,
              created_at: new Date().toISOString(),
              instance_id: studentChatbotInstanceId,
              metadata: {
                isSystemMessage: true,
                isContentFilterMessage: true,
                filterReason: filterResult.reason,
                chatbotId: chatbot_id
              }
            });
          
          return NextResponse.json({ 
            error: 'Message blocked', 
            message: kindMessage,
            systemMessageId: systemMessageId,
            reason: filterResult.reason 
          }, { status: 400 });
        }
      }
      
      // AI-based content moderation for inappropriate content and jailbreak attempts
      if (isStudent) {
        
        const moderationResult = await moderateContent(content.trim(), {
          studentId: actualStudentId,
          roomId: roomId,
          messageId: savedUserMessage.message_id,
          logToDatabase: true // Automatically log flagged content
        });
        
        if (moderationResult.isFlagged) {
          console.log(`[API POST /chat/direct-access] AI moderation flagged content from user ${userId}: ${moderationResult.reason}`);
          
          // CRITICAL: If this might be a safety concern (self-harm, suicide, age-inappropriate relationships, etc.), 
          // let it through so the safety system can provide helplines
          if (mightBeSafetyConcern) {
            console.log(`[API POST /chat/direct-access] Safety concern detected, allowing through for safety response despite moderation flag`);
            // Continue processing - safety system will handle this appropriately
          } else {
            // Not a safety concern, or not self-harm related - block it
            const userMessage = getKindModerationMessage(
              moderationResult.categories, 
              moderationResult.severity, 
              moderationResult.jailbreakDetected || false
            );
            
            // Insert a system message to show the kind message in chat
            const systemMessageId = `system-moderation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            await supabaseAdmin
              .from('chat_messages')
              .insert({
                message_id: systemMessageId,
                room_id: roomId,
                user_id: userId,
                role: 'system',
                content: userMessage,
                created_at: new Date().toISOString(),
                instance_id: studentChatbotInstanceId,
                metadata: {
                  isSystemMessage: true,
                  isModerationMessage: true,
                  moderationCategories: moderationResult.categories,
                  chatbotId: chatbot_id
                }
              });
            
            return NextResponse.json({ 
              error: 'Message moderated', 
              message: userMessage,
              systemMessageId: systemMessageId,
              reason: moderationResult.reason 
            }, { status: 400 });
          }
        }
      }
      
      // Process the chat message
      const stream = await processChatMessage({
        roomId,
        userId,
        content: content.trim(),
        chatbotId: chatbot_id,
        model,
        messageId: savedUserMessage.message_id,
        instanceId: studentChatbotInstanceId,
        countryCode: country_code,
        isStudent,
        isTeacher
      });
      
      // Return the streaming response
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error) {
      console.error(`[API POST /chat/direct-access] Error processing message:`, error);
      
      return NextResponse.json({ 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API POST /chat/direct-access] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process message' },
      { status: 500 }
    );
  }
}