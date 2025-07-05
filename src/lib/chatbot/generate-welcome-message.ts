// Generate a welcome message based on the chatbot's system prompt
import { BotTypeEnum } from '@/types/database.types';

interface GenerateWelcomeMessageParams {
  systemPrompt: string;
  botType: BotTypeEnum;
  chatbotName: string;
}

export async function generateWelcomeMessage({
  systemPrompt,
  botType,
  chatbotName
}: GenerateWelcomeMessageParams): Promise<string> {
  // For assessment bots, don't generate a welcome message
  if (botType === 'assessment') {
    return '';
  }

  // Create a prompt to generate the welcome message
  const generationPrompt = `Based on this teaching assistant's behavior and personality:

${systemPrompt}

Generate a brief, friendly welcome message (max 2-3 sentences) that this teaching assistant would say when first meeting a student. The message should:
- Be warm and encouraging but PROFESSIONAL
- Reflect the personality and teaching style described in the behavior prompt
- Invite the student to start learning or asking questions
- Be appropriate for students
- Use UK spelling
- NEVER say "I'm here to help", "I'm here for you", "I care", or position the AI as emotional support
- Focus on ACADEMIC assistance only

Do not include any meta-commentary or explanations. Just provide the welcome message text.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Skolr AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are helping create friendly welcome messages for educational AI assistants. Keep messages brief, warm, and encouraging. NEVER position the AI as emotional support or say phrases like "I\'m here to help" or "I\'m here for you". Focus on academic learning only.'
          },
          {
            role: 'user',
            content: generationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('[generateWelcomeMessage] API error:', response.status);
      return getDefaultWelcomeMessage(botType, chatbotName);
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content?.trim();

    if (!generatedMessage) {
      return getDefaultWelcomeMessage(botType, chatbotName);
    }

    // Ensure the message isn't too long
    if (generatedMessage.length > 500) {
      return generatedMessage.substring(0, 497) + '...';
    }

    return generatedMessage;
  } catch (error) {
    console.error('[generateWelcomeMessage] Error generating welcome message:', error);
    return getDefaultWelcomeMessage(botType, chatbotName);
  }
}

function getDefaultWelcomeMessage(botType: BotTypeEnum, chatbotName: string): string {
  switch (botType) {
    case 'learning':
      return `Hello! I'm ${chatbotName}, your learning assistant. Let's explore new concepts and answer your questions together. What would you like to learn about today?`;
    case 'reading_room':
      return `Welcome to the reading room! I'm ${chatbotName}. Let's explore and understand the texts together. What questions do you have about what you're reading?`;
    case 'viewing_room':
      return `Hi there! I'm ${chatbotName}, your viewing guide. Let's discuss and understand the video content. What questions do you have about what you're watching?`;
    case 'knowledge_book':
      return `Hello! I'm ${chatbotName}, your knowledge companion. I have access to specific resources we can explore together. What would you like to know more about?`;
    default:
      return `Hello! I'm ${chatbotName}, your AI learning assistant. What academic topic shall we explore today?`;
  }
}