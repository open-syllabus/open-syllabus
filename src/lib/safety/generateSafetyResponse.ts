// src/lib/safety/generateSafetyResponse.ts
import fs from 'fs';
import path from 'path';

// Define the helplines data structure
interface HelplineEntry {
  name: string;
  phone?: string;
  website?: string;
  text_to?: string;
  text_msg?: string;
  short_desc: string;
}

// Define the full data structure
interface HelplineData {
  [countryCode: string]: HelplineEntry[];
}

// Helper function to load helplines data
function loadHelplines(): HelplineData {
  try {
    // Read the helplines data from the file
    const dataPath = path.join(process.cwd(), 'src/lib/safety/data/helplines.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const helplines = JSON.parse(rawData) as HelplineData;
    
    console.log(`[Safety] Successfully loaded helplines data from file with ${Object.keys(helplines).length} countries`);
    return helplines;
  } catch (error) {
    console.error('[Safety] Error loading helplines data:', error);
    // Provide a minimal fallback in case of error
    return {
      DEFAULT: [
        { name: "Emergency Services", short_desc: "Contact local emergency services if in immediate danger." },
        { name: "Talk to a Trusted Adult", short_desc: "Speak to a teacher, school counselor, parent, or another family member." }
      ]
    };
  }
}

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SAFETY_RESPONSE_MODEL = 'google/gemini-2.5-flash-preview-05-20';

// Normalize and validate country code
function normalizeCountryCode(countryCode: string | null): string {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.trim() === '') {
    return 'DEFAULT';
  }
  
  // Convert to uppercase and trim
  let normalizedCode = countryCode.trim().toUpperCase();
  
  // Handle common aliases
  if (normalizedCode === 'UK') {
    normalizedCode = 'GB'; // Convert UK to GB (ISO standard)
  } else if (normalizedCode === 'UAE') {
    normalizedCode = 'AE'; // Convert UAE to AE (ISO standard)
  } else if (normalizedCode === 'USA') {
    normalizedCode = 'US'; // Convert USA to US (ISO standard)
  }
  
  return normalizedCode;
}

// Generate contextually appropriate intro message using AI
async function generateContextualIntroMessage(
  concernType: string,
  messageContent: string,
  studentAge: number | null
): Promise<string | null> {
  try {
    const ageContext = studentAge ? `The student is approximately ${studentAge} years old.` : '';
    
    const prompt = `You are a safety system providing a redirect message. ${ageContext}

The safety system detected a concern of type: ${concernType}
The student's message was: "${messageContent}"

Generate a brief safety message (1-2 sentences) that:
1. Does NOT engage with or discuss the topic they raised
2. Does NOT ask them to share more or talk about it
3. Simply states that help is available and shows the helplines below
4. Redirects them to trusted adults (teacher, parent, counselor)
5. Is brief and does not invite further discussion

CRITICAL RULES:
- NEVER say "Can we talk more about this" or similar
- NEVER say "I want to understand better" or ask questions
- NEVER engage with the personal topic AT ALL
- Just acknowledge help is available and point to resources
- Keep it to 1-2 short sentences maximum

Examples of GOOD messages:
- "I see you may need some support. Your teacher can see this conversation and these helplines can help:"
- "It's important to talk to a trusted adult about this. Here are some resources that can help:"
- "Your safety is important. Please speak with your teacher or use these helplines:"

Examples of BAD messages (DO NOT USE):
- "Can we talk more about what you shared?"
- "I want to understand better"
- "Tell me more about..."
- Any message that engages with their topic

Just provide the intro message text, nothing else.`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Skolr Safety System'
      },
      body: JSON.stringify({
        model: SAFETY_RESPONSE_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a safety redirect system. NEVER engage with personal topics or ask students to share more. Only provide brief messages that redirect to adult help and resources. Do NOT invite further discussion.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('[Safety] AI response generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[Safety] Error generating contextual intro message:', error);
    return null;
  }
}

// Function to generate a supportive safety response with country-specific helplines
export async function generateSafetyResponse(
  concernType: string, 
  countryCode: string | null,
  messageContent?: string,
  studentAge?: number | null,
  helplines?: HelplineData
): Promise<string> {
  // Load helplines data if not provided
  const allHelplines = helplines || loadHelplines();
  
  // Normalize country code
  const effectiveCountryCode = normalizeCountryCode(countryCode);
  
  // Get helplines for this country (or fallback to DEFAULT)
  let countryHelplines = allHelplines[effectiveCountryCode];
  
  // If no helplines found for this country, use DEFAULT
  if (!countryHelplines || !Array.isArray(countryHelplines) || countryHelplines.length === 0) {
    console.log(`[Safety] No helplines found for country ${effectiveCountryCode}, using DEFAULT`);
    countryHelplines = allHelplines.DEFAULT || [];
  }
  
  // Format the concern type for display (e.g., "self_harm" -> "Self Harm")
  const concernTypeDisplay = concernType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Generate appropriate intro message based on concern type
  let introMessage = '';
  
  // Try to generate AI-powered contextual message if message content is provided
  if (messageContent) {
    const aiGeneratedMessage = await generateContextualIntroMessage(concernType, messageContent, studentAge || null);
    if (aiGeneratedMessage) {
      introMessage = aiGeneratedMessage;
    }
  }
  
  // Fallback to default messages if AI generation fails or no message content
  if (!introMessage) {
    switch (concernType) {
      case 'self_harm':
        introMessage = 'Your safety is important. Please speak with your teacher or use these helplines for support:';
        break;
      case 'bullying':
        introMessage = 'It\'s important to talk to a trusted adult about this. Here are some resources that can help:';
        break;
      case 'abuse':
        introMessage = 'Your safety matters. Please speak with your teacher or contact these helplines:';
        break;
      case 'depression':
        introMessage = 'Support is available. Please talk to your teacher or use these resources:';
        break;
      case 'family_issues':
        introMessage = 'Please speak with your teacher or school counselor. These resources can also help:';
        break;
      case 'age_inappropriate_relationship':
        introMessage = 'Your safety is important. Please speak with your teacher or parent right away. These helplines can also help:';
        break;
      case 'underage_substance_use':
        introMessage = 'It\'s important to talk to a trusted adult. Your teacher can help, and here are some resources:';
        break;
      default:
        introMessage = 'I see you may need support. Your teacher can see this conversation and these helplines can help:';
    }
  }
  
  // Standard teacher awareness sentence
  const teacherAwareness = 'Your teacher can see this conversation and will follow up to make sure you get the support you need.';
  
  // Format helplines section
  let helplinesSection = '';
  
  countryHelplines.forEach(helpline => {
    helplinesSection += `* ${helpline.name}`;
    
    if (helpline.phone) {
      helplinesSection += ` - Phone: ${helpline.phone}`;
    } else if (helpline.text_to && helpline.text_msg) {
      helplinesSection += ` - Text: ${helpline.text_msg} to ${helpline.text_to}`;
    } else if (helpline.website) {
      helplinesSection += ` - Website: ${helpline.website}`;
    }
    
    // Add short description if available
    if (helpline.short_desc) {
      helplinesSection += ` (${helpline.short_desc})`;
    }
    
    helplinesSection += '\n';
  });
  
  // Closing message
  const closingMessage = 'Help is available.';
  
  // Combine all parts with appropriate spacing
  const fullResponse = `${introMessage} ${teacherAwareness}\n\n${helplinesSection}\n${closingMessage}`;
  
  return fullResponse;
}