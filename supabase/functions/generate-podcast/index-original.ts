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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const openai = new OpenAI({ apiKey: openaiApiKey })

    const { studyGuideId, userId, studyGuideContent, studyGuideTitle, voice, speed } = await req.json() as PodcastRequest

    console.log(`Generating podcast for study guide ${studyGuideId}`)

    // Check if podcast already exists
    const { data: existingPodcast } = await supabase
      .from('study_guide_podcasts')
      .select('podcast_id, audio_url')
      .eq('study_guide_id', studyGuideId)
      .eq('voice', voice)
      .eq('speed', speed)
      .single()

    if (existingPodcast?.audio_url) {
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

    // Format content for podcast
    const podcastScript = formatForPodcast(studyGuideContent, studyGuideTitle)
    
    // Split into chunks for TTS
    const chunks = splitIntoChunks(podcastScript)
    console.log(`Split into ${chunks.length} chunks`)

    // Generate audio for each chunk
    const audioBuffers: Uint8Array[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Generating audio for chunk ${i + 1}/${chunks.length}`)
      
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: chunk,
        speed: speed,
      })
      
      const buffer = new Uint8Array(await mp3Response.arrayBuffer())
      audioBuffers.push(buffer)
    }

    // Combine audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
    const combinedBuffer = new Uint8Array(totalLength)
    let offset = 0
    
    for (const buffer of audioBuffers) {
      combinedBuffer.set(buffer, offset)
      offset += buffer.byteLength
    }

    // Upload to Supabase Storage
    const filename = `study-guide-${studyGuideId}-${voice}-${speed}x-${Date.now()}.mp3`
    const filePath = `podcasts/${userId}/${filename}`
    
    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, combinedBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000'
      })

    if (uploadError) {
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
        duration_seconds: Math.ceil(podcastScript.length / 150),
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
      .single()

    if (createError) {
      throw new Error(`Failed to create podcast record: ${createError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        podcastId: podcast.podcast_id,
        audioUrl: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating podcast:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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

function splitIntoChunks(text: string, maxLength: number = 3000): string[] {
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