// API route for bulk saving messages to notebook
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface BulkMessage {
  message_id: string;
  message_content: string;
  message_role: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    const body = await request.json();
    
    const { 
      chatbot_id, 
      chatbot_name,
      room_id,
      messages
    } = body;

    // Validate required fields
    if (!chatbot_id || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields or empty messages array' 
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the student record from the students table
    const { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('auth_user_id', user.id)
      .single();

    if (studentError || !studentRecord) {
      console.error('Error fetching student record:', studentError);
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentId = studentRecord.student_id;
    console.log('Bulk save - checking access for chatbot:', chatbot_id, 'student:', studentId);
    
    // Check if student has access to this chatbot
    // First get all rooms that have this chatbot
    const { data: roomsWithChatbot, error: roomError } = await supabase
      .from('room_chatbots')
      .select('room_id')
      .eq('chatbot_id', chatbot_id);

    if (roomError) {
      console.error('Error fetching rooms with chatbot:', roomError);
      return NextResponse.json({ 
        error: 'Failed to verify chatbot access' 
      }, { status: 500 });
    }

    if (!roomsWithChatbot || roomsWithChatbot.length === 0) {
      console.log('No rooms found with this chatbot:', chatbot_id);
      return NextResponse.json({ 
        error: 'Chatbot not found' 
      }, { status: 404 });
    }

    // Now check if the student is a member of any of these rooms
    const roomIds = roomsWithChatbot.map(r => r.room_id);
    const { data: studentMemberships, error: membershipError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('student_id', studentId)
      .in('room_id', roomIds);

    if (membershipError) {
      console.error('Error checking student memberships:', membershipError);
      return NextResponse.json({ 
        error: 'Failed to verify access' 
      }, { status: 500 });
    }

    if (!studentMemberships || studentMemberships.length === 0) {
      console.log('Student does not have access to chatbot:', { 
        student_id: studentId, 
        chatbot_id,
        rooms_with_chatbot: roomIds
      });
      return NextResponse.json({ 
        error: 'You do not have access to this chatbot' 
      }, { status: 403 });
    }

    // Check if notebook already exists for this chatbot
    let notebook;
    const { data: existingNotebook, error: notebookError } = await adminSupabase
      .from('student_notebooks')
      .select('*')
      .eq('student_id', user.id)  // Use auth user ID for student_notebooks table
      .eq('chatbot_id', chatbot_id)
      .single();

    if (notebookError && notebookError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error checking notebook:', notebookError);
      return NextResponse.json({ 
        error: 'Failed to check notebook' 
      }, { status: 500 });
    }

    if (!existingNotebook) {
      // Create new notebook with required name field
      const notebookData = {
        student_id: user.id,  // Use auth user ID for student_notebooks table
        chatbot_id: chatbot_id,
        name: `${chatbot_name || 'Assistant'} Notes`,  // Use 'name' not 'title'
        title: `${chatbot_name || 'Assistant'} Notes`, // Keep title for backwards compatibility
        is_starred: false
      };
      
      console.log('Creating notebook with data:', notebookData);
      
      const { data: newNotebook, error: createError } = await adminSupabase
        .from('student_notebooks')
        .insert(notebookData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating notebook:', createError);
        
        // Check if it's a column not found error
        if (createError.code === 'PGRST204' || createError.code === '42703') {
          console.log('Database migration pending - title/is_starred columns not yet added');
          
          // Try creating without the new columns
          const fallbackData = {
            student_id: user.id,  // Use auth user ID for student_notebooks table
            chatbot_id: chatbot_id,
            name: `${chatbot_name || 'Assistant'} Notes`  // name is required
          };
          
          const { data: fallbackNotebook, error: fallbackError } = await adminSupabase
            .from('student_notebooks')
            .insert(fallbackData)
            .select()
            .single();
            
          if (fallbackError) {
            console.error('Fallback creation also failed:', fallbackError);
            return NextResponse.json({ 
              error: 'Failed to create notebook',
              details: fallbackError.message
            }, { status: 500 });
          }
          
          notebook = fallbackNotebook;
        } else {
          return NextResponse.json({ 
            error: 'Failed to create notebook',
            details: createError.message
          }, { status: 500 });
        }
      } else {
        notebook = newNotebook;
      }
    } else {
      notebook = existingNotebook;
      
      // Update the updated_at timestamp
      await adminSupabase
        .from('student_notebooks')
        .update({ updated_at: new Date().toISOString() })
        .eq('notebook_id', notebook.notebook_id);
    }

    // Get existing entries to avoid duplicates
    const { data: existingEntries } = await adminSupabase
      .from('notebook_entries')
      .select('message_id')
      .eq('notebook_id', notebook.notebook_id)
      .in('message_id', messages.map(m => m.message_id));

    const existingMessageIds = new Set(existingEntries?.map(e => e.message_id) || []);
    
    // Filter out messages that are already saved
    const newMessages = messages.filter(msg => !existingMessageIds.has(msg.message_id));
    
    if (newMessages.length === 0) {
      return NextResponse.json({ 
        message: 'All messages are already saved',
        notebook_id: notebook.notebook_id,
        saved_count: 0,
        skipped_count: messages.length
      });
    }

    // Prepare entries for bulk insert
    const entriesToInsert = newMessages.map(msg => ({
      notebook_id: notebook.notebook_id,
      message_id: msg.message_id,
      content: msg.message_content,
      chatbot_id: chatbot_id,
      room_id: room_id,
      chatbot_name: chatbot_name,
      metadata: {
        saved_at: new Date().toISOString(),
        message_role: msg.message_role,
        original_content: msg.message_content,
        created_at: msg.created_at,
        bulk_save: true
      }
    }));

    // Insert all entries at once
    const { data: newEntries, error: insertError } = await adminSupabase
      .from('notebook_entries')
      .insert(entriesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting entries:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save messages' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Messages saved successfully',
      notebook_id: notebook.notebook_id,
      saved_count: newEntries?.length || newMessages.length,
      skipped_count: messages.length - newMessages.length,
      is_new_notebook: !existingNotebook
    });

  } catch (error) {
    console.error('Error in bulk save notebook:', error);
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}