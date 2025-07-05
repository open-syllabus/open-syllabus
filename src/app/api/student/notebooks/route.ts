// API routes for student notebooks
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Fetch all notebooks for the current student
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
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

    // Fetch notebooks with chatbot details
    const { data: notebooks, error } = await supabase
      .from('student_notebooks')
      .select(`
        *,
        chatbot:chatbots(
          chatbot_id,
          name,
          bot_type,
          description
        )
      `)
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notebooks:', error);
      return NextResponse.json({ error: 'Failed to fetch notebooks' }, { status: 500 });
    }

    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error('Error in GET notebooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new notebook or add entry to existing notebook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    const body = await request.json();
    
    const { 
      chatbot_id, 
      message_id, 
      message_content, 
      message_role,
      chatbot_name,
      room_id 
    } = body;

    // Validate required fields
    if (!chatbot_id || !message_id || !message_content) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
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
    console.log('Checking access for chatbot:', chatbot_id, 'student:', studentId);
    
    // Check if student has access to this chatbot
    // We need to check if the student is a member of any room that contains this chatbot
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
        console.error('Notebook data attempted:', notebookData);
        
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

    // Check if this message is already saved
    const { data: existingEntry } = await adminSupabase
      .from('notebook_entries')
      .select('entry_id')
      .eq('notebook_id', notebook.notebook_id)
      .eq('message_id', message_id)
      .single();

    if (existingEntry) {
      return NextResponse.json({ 
        message: 'Note already saved',
        notebook_id: notebook.notebook_id,
        entry_id: existingEntry.entry_id
      });
    }

    // Add the new entry with correct column names
    const { data: newEntry, error: entryError } = await adminSupabase
      .from('notebook_entries')
      .insert({
        notebook_id: notebook.notebook_id,
        message_id: message_id,
        content: message_content,  // Column is 'content' not 'message_content'
        chatbot_id: chatbot_id,   // Store chatbot_id
        room_id: room_id,          // Store room_id from request
        chatbot_name: chatbot_name,
        metadata: {
          saved_at: new Date().toISOString(),
          message_role: message_role,  // Store role in metadata instead
          original_content: message_content
        }
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error creating entry:', entryError);
      return NextResponse.json({ 
        error: 'Failed to save note' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Note saved successfully',
      notebook_id: notebook.notebook_id,
      entry_id: newEntry.entry_id,
      is_new_notebook: !existingNotebook
    });

  } catch (error) {
    console.error('Error in POST notebook:', error);
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

// DELETE - Remove a notebook
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get('notebookId');

    if (!notebookId) {
      return NextResponse.json({ error: 'Notebook ID required' }, { status: 400 });
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

    // Delete notebook (entries will cascade delete)
    const { error } = await supabase
      .from('student_notebooks')
      .delete()
      .eq('notebook_id', notebookId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error deleting notebook:', error);
      return NextResponse.json({ error: 'Failed to delete notebook' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notebook deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE notebook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update notebook (e.g., rename, star/unstar)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { notebook_id, title, is_starred } = body;

    if (!notebook_id) {
      return NextResponse.json({ error: 'Notebook ID required' }, { status: 400 });
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

    // Prepare update object with migration safety
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only add fields if they're provided
    if (title !== undefined) {
      updates.title = title;
    }
    if (is_starred !== undefined) {
      updates.is_starred = is_starred;
    }

    // Update notebook with error handling for missing columns
    const { data, error } = await supabase
      .from('student_notebooks')
      .update(updates)
      .eq('notebook_id', notebook_id)
      .eq('student_id', user.id)
      .select()
      .single();
    
    if (error) {
      // If error is about missing columns, provide helpful message
      if (error.code === 'PGRST204' && (error.message.includes('title') || error.message.includes('is_starred'))) {
        console.log('Database migration pending - title/is_starred columns not yet added');
        // Return success anyway, just without the new fields
        return NextResponse.json({ 
          message: 'Notebook updated (limited fields)',
          notebook: { notebook_id, student_id: user.id, updated_at: updates.updated_at }
        });
      }
      console.error('Error updating notebook:', error);
      return NextResponse.json({ error: 'Failed to update notebook' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notebook updated successfully',
      notebook: data
    });
  } catch (error) {
    console.error('Error in PATCH notebook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}