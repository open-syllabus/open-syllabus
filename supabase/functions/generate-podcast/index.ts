import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PodcastRequest {
  studyGuideId: string
  userId: string
  studyGuideContent: string
  studyGuideTitle: string
  voice: string
  speed: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const { studyGuideId, userId, studyGuideContent, studyGuideTitle, voice, speed } = await req.json() as PodcastRequest

    console.log(`[Podcast] Starting generation for study guide ${studyGuideId}`)

    // Check if podcast already exists
    const { data: existingPodcast } = await supabase
      .from('study_guide_podcasts')
      .select('podcast_id, audio_url')
      .eq('study_guide_id', studyGuideId)
      .eq('student_id', userId)
      .eq('voice', voice)
      .eq('speed', speed)
      .single()

    if (existingPodcast?.audio_url) {
      console.log(`[Podcast] Found existing podcast ${existingPodcast.podcast_id}`)
      return new Response(
        JSON.stringify({
          success: true,
          podcastId: existingPodcast.podcast_id,
          audioUrl: existingPodcast.audio_url,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format content for podcast - limit to prevent timeouts
    const podcastScript = formatForPodcast(studyGuideContent, studyGuideTitle)
    
    // Limit script length to prevent timeouts (approximately 5 minutes of speech)
    const maxScriptLength = 4500; // ~5 minutes at average speaking pace
    const truncatedScript = podcastScript.length > maxScriptLength 
      ? podcastScript.substring(0, maxScriptLength) + "\n\nThis is a preview of your study guide. The full content was too long for audio generation."
      : podcastScript;
    
    // Split into chunks for TTS
    const chunks = splitIntoChunks(truncatedScript, 1000) // Smaller chunks for faster processing
    console.log(`[Podcast] Split into ${chunks.length} chunks`)

    // Generate audio for chunks in parallel (but limit concurrency)
    const maxConcurrent = 3;
    const audioBuffers: Uint8Array[] = new Array(chunks.length);
    
    for (let i = 0; i < chunks.length; i += maxConcurrent) {
      const batch = chunks.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex;
        console.log(`[Podcast] Generating audio for chunk ${chunkIndex + 1}/${chunks.length}`)
        
        try {
          const mp3Response = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: chunk,
            speed: speed,
          })
          
          const buffer = new Uint8Array(await mp3Response.arrayBuffer())
          audioBuffers[chunkIndex] = buffer;
        } catch (error) {
          console.error(`[Podcast] Error generating chunk ${chunkIndex + 1}:`, error)
          throw error;
        }
      });
      
      await Promise.all(batchPromises);
    }

    // Combine audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
    const combinedBuffer = new Uint8Array(totalLength)
    let offset = 0
    
    for (const buffer of audioBuffers) {
      combinedBuffer.set(buffer, offset)
      offset += buffer.byteLength
    }

    console.log(`[Podcast] Combined audio size: ${combinedBuffer.byteLength} bytes`)

    // Upload to Supabase Storage
    const filename = `study-guide-${studyGuideId}-${voice}-${speed}x-${Date.now()}.mp3`
    const filePath = `podcasts/${userId}/${filename}`
    
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, combinedBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',
        upsert: false
      })

    if (uploadError) {
      console.error('[Podcast] Upload error:', uploadError)
      throw new Error(`Failed to upload audio: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath)

    // Save podcast record
    const { data: podcast, error: createError } = await supabase
      .from('study_guide_podcasts')
      .insert({
        study_guide_id: studyGuideId,
        student_id: userId,
        voice,
        speed,
        duration_seconds: Math.ceil(truncatedScript.length / 150),
        file_size_bytes: combinedBuffer.byteLength,
        audio_url: publicUrl,
        script_preview: truncatedScript.substring(0, 500),
        metadata: {
          chunks: chunks.length,
          original_length: studyGuideContent.length,
          script_length: truncatedScript.length,
          file_path: filePath,
          truncated: podcastScript.length > maxScriptLength
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('[Podcast] Database error:', createError)
      throw new Error(`Failed to create podcast record: ${createError.message}`)
    }

    console.log(`[Podcast] Successfully generated podcast ${podcast.podcast_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        podcastId: podcast.podcast_id,
        audioUrl: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Podcast] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function formatForPodcast(content: string, title: string): string {
  let podcastScript = `Welcome to your revision podcast! Today we're covering: ${title}.\n\n`;
  podcastScript += "Let's dive into your study guide.\n\n";
  
  let processedContent = content;
  
  // Replace markdown with spoken text
  processedContent = processedContent.replace(/^# (.+)$/gm, 'Main topic: $1.');
  processedContent = processedContent.replace(/^## (.+)$/gm, '\nNow, let\'s talk about: $1.\n');
  processedContent = processedContent.replace(/^### (.+)$/gm, '\nHere\'s an important point: $1.\n');
  processedContent = processedContent.replace(/^- (.+)$/gm, 'Point: $1.');
  processedContent = processedContent.replace(/^\* (.+)$/gm, 'Point: $1.');
  processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '$1');
  processedContent = processedContent.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  processedContent = processedContent.replace(/`(.+?)`/g, '$1');
  processedContent = processedContent.replace(/```[\s\S]+?```/g, '');
  
  podcastScript += processedContent;
  podcastScript += "\n\nThat concludes our revision podcast. Good luck with your studies!";
  
  return podcastScript;
}

function splitIntoChunks(text: string, maxLength: number = 1000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}