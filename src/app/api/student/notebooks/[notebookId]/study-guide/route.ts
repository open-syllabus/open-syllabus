import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserSpellingPreference, getSpellingInstruction } from '@/lib/utils/spelling-preference';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    const { notebookId } = await params;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notebook with entries
    const { data: notebook, error: notebookError } = await supabase
      .from('student_notebooks')
      .select(`
        *,
        entries:notebook_entries(
          *,
          highlights:notebook_highlights(*),
          student_notes:notebook_student_notes(*)
        )
      `)
      .eq('notebook_id', notebookId)
      .eq('student_id', user.id)
      .single();

    if (notebookError) {
      console.error('Error fetching notebook:', notebookError);
      return NextResponse.json({ error: 'Failed to fetch notebook', details: notebookError.message }, { status: 500 });
    }
    
    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    // Sort entries chronologically
    const sortedEntries = notebook.entries.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Build the content for the AI
    let fullContent = `# Study Guide Generation Request\n\n`;
    fullContent += `Notebook Title: ${notebook.title || notebook.name}\n\n`;
    fullContent += `## Chat History and Notes:\n\n`;

    sortedEntries.forEach((entry: any, index: number) => {
      const role = entry.metadata?.message_role || 'assistant';
      
      if (role === 'user') {
        fullContent += `### Question ${Math.floor(index / 2) + 1}:\n`;
        fullContent += `${entry.content}\n\n`;
      } else {
        fullContent += `### Answer:\n`;
        fullContent += `${entry.content}\n\n`;
        
        // Include student notes
        if (entry.student_notes && entry.student_notes.length > 0) {
          fullContent += `**Student Notes:**\n`;
          entry.student_notes.forEach((note: any, noteIndex: number) => {
            fullContent += `- Note ${noteIndex + 1}: ${note.content}\n`;
          });
          fullContent += '\n';
        }
        
        // Include highlights
        if (entry.highlights && entry.highlights.length > 0) {
          fullContent += `**Highlighted Text:**\n`;
          entry.highlights.forEach((highlight: any) => {
            fullContent += `- [${highlight.color}] "${highlight.selected_text}"\n`;
          });
          fullContent += '\n';
        }
      }
    });

    // Get user's spelling preference
    const spellingPreference = await getUserSpellingPreference(user.id);
    const spellingInstruction = getSpellingInstruction(spellingPreference);
    console.log(`[Study Guide] Using ${spellingPreference} English spelling for user ${user.id}`);

    // Generate study guide using Gemini 2.5 Flash via OpenRouter
    const prompt = `You are an expert educational content organizer. Transform the following chat history and student notes into a comprehensive, well-structured study guide.${spellingInstruction}

Requirements:
1. Create a clear hierarchy with main topics as H1 headings
2. Use H2 for subtopics and H3 for specific points
3. Integrate the student's own notes naturally into the content
4. Pay special attention to highlighted text - these are key concepts the student found important
5. Create summary boxes for complex topics
6. Add "Key Takeaways" sections where appropriate
7. Include any formulas, definitions, or important facts in clearly marked sections
8. Maintain the educational value while making it more organized and scannable
9. If there are practice problems or examples, group them together
10. End with a comprehensive summary section

Content to transform:
${fullContent}

Generate a well-formatted markdown study guide that a student can use for effective revision.`;

    // Call OpenRouter API directly for study guide generation
    console.log('Calling OpenRouter API with model: google/gemini-2.5-flash-lite-preview-06-17');
    console.log('Prompt length:', prompt.length);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Skolr Study Guide Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite-preview-06-17', // Using Gemini 2.5 Flash Lite for cost efficiency
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3, // Lower temperature for more structured output
        max_tokens: 4000 // Allow for comprehensive study guide
      }),
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error:', errorData);
      console.error('OpenRouter error details:', JSON.stringify(errorData, null, 2));
      throw new Error(errorData.error?.message || 'Failed to generate study guide');
    }

    const data = await response.json();
    console.log('OpenRouter response received, content length:', data.choices[0]?.message?.content?.length || 0);
    const studyGuideContent = data.choices[0].message.content;

    // Generate a title from the notebook name
    const studyGuideTitle = `${notebook.title || notebook.name} - Study Guide`;

    // Save the study guide as its own entity
    console.log('Attempting to save study guide for notebook:', notebookId);
    console.log('Student ID:', user.id);
    console.log('Study guide title:', studyGuideTitle);
    console.log('Content length:', studyGuideContent.length);
    
    const { data: studyGuideEntry, error: saveError } = await adminSupabase
      .from('study_guides')
      .insert({
        notebook_id: notebookId,
        student_id: user.id,
        title: studyGuideTitle,
        content: studyGuideContent,
        source_entries_count: sortedEntries.length,
        metadata: {
          generated_at: new Date().toISOString(),
          notebook_name: notebook.title || notebook.name
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving study guide:', saveError);
      console.error('Save error details:', JSON.stringify(saveError, null, 2));
      
      // Check if it's because the table doesn't exist
      if (saveError.code === '42P01') {
        return NextResponse.json({ 
          error: 'Study guides table not found. Please run the migration.',
          details: saveError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        studyGuide: studyGuideContent,
        saved: false,
        error: saveError.message
      });
    }

    return NextResponse.json({ 
      studyGuide: studyGuideContent,
      studyGuideId: studyGuideEntry.study_guide_id,
      saved: true 
    });

  } catch (error) {
    console.error('Error generating study guide:', error);
    return NextResponse.json({ 
      error: 'Failed to generate study guide',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}