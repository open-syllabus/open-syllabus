// src/lib/safety/content-filter.ts
/**
 * Content filtering for under-13 COPPA compliance
 * Blocks personal information, inappropriate content, and external communications
 * 
 * CRITICAL SAFETY NOTE: This filter does NOT block self-harm, suicide, or mental health
 * related messages. These MUST be allowed through so the safety monitoring system
 * can detect them and provide appropriate helpline resources to students in crisis.
 */

export interface FilterResult {
  isBlocked: boolean;
  reason?: string;
  cleanedMessage?: string;
  flaggedPatterns?: string[];
}

interface ContentFilter {
  pattern: RegExp;
  reason: string;
  replacement: string;
  skipIfEducational?: boolean;
}

// Personal Information Patterns - Realistic for chatbot conversations
const PERSONAL_INFO_PATTERNS = [
  {
    pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    reason: 'phone number',
    replacement: '[PHONE REMOVED]'
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    reason: 'email address',
    replacement: '[EMAIL REMOVED]'
  },
  {
    pattern: /\b(?:my|i live at|address is|i'm at)\s+\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl)\b/gi,
    reason: 'physical address',
    replacement: '[ADDRESS REMOVED]'
  },
  {
    pattern: /\b(?:i'm|i am|im)\s+home\s+alone\b/gi,
    reason: 'home alone status',
    replacement: '[SAFETY INFO REMOVED]'
  },
  {
    pattern: /\b(?:my\s+)?(?:mom|dad|mother|father|parents?)\s+(?:is|are)\s+(?:at work|gone|away|not home)\b/gi,
    reason: 'parent absence',
    replacement: '[FAMILY INFO REMOVED]'
  },
  {
    pattern: /\b(?:my school is|i go to|i attend|student at)\s+[A-Z][\w\s]+(?:elementary|middle|high|primary|secondary|school|academy|prep)\b/gi,
    reason: 'school name',
    replacement: '[SCHOOL REMOVED]'
  },
  {
    pattern: /\b[A-Z][\w\s]+(?:Elementary|Middle|High|Primary|Secondary)\s*(?:School)?\b/g,
    reason: 'school name',
    replacement: '[SCHOOL REMOVED]'
  },
  {
    pattern: /\b(?:my teacher(?:'s)?|teacher is)\s+(?:mrs?\.?|miss|ms\.?)?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi,
    reason: 'teacher name',
    replacement: '[TEACHER NAME REMOVED]'
  },
  {
    pattern: /\b(?:mrs?\.?|miss|ms\.?)\s+[A-Z][a-z]+\s+(?:is|teaches|said)\b/gi,
    reason: 'teacher name',
    replacement: '[TEACHER NAME REMOVED]'
  },
  {
    pattern: /\b(?:i take|i'm on|medication for|prescribed)\s+[\w\s]+(?:for|because)\b/gi,
    reason: 'medical information',
    replacement: '[MEDICAL INFO REMOVED]'
  },
  {
    pattern: /\b(?:my full name is|my name is)\s+[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi,
    reason: 'full name',
    replacement: '[NAME REMOVED]'
  },
  {
    pattern: /\b(?:password|passcode|pin)\s*(?:is|:)?\s*["']?[\w@#$%^&*]+["']?\b/gi,
    reason: 'password',
    replacement: '[PASSWORD REMOVED]'
  },
  {
    pattern: /\b(?:i live in|i'm from|my city is|my town is)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/gi,
    reason: 'location information',
    replacement: '[LOCATION REMOVED]'
  },
  {
    pattern: /\b(?:birthday|birthdate|born on|i was born)\s+(?:is)?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
    reason: 'birthdate',
    replacement: '[BIRTHDATE REMOVED]'
  },
  {
    pattern: /\b(?:my age is|i am|i'm)\s+\d{1,3}\s*(?:years?\s*old)?\b/gi,
    reason: 'age information',
    replacement: '[AGE REMOVED]'
  }
];

// External Platform Patterns - Realistic for chatbot conversations
const EXTERNAL_PLATFORM_PATTERNS = [
  {
    pattern: /\b(?:my|i have a?|i'm on|check my|follow my|see my)\s+(?:snapchat|instagram|tiktok|facebook|whatsapp|discord|telegram|kik|twitter|youtube|twitch)\b/gi,
    reason: 'social media mention',
    replacement: '[SOCIAL MEDIA REMOVED]'
  },
  {
    pattern: /\b(?:my username is|my handle is|@[a-zA-Z0-9_]+)\s+(?:on)?\s*(?:snapchat|instagram|tiktok|facebook|whatsapp|discord|telegram|kik|twitter|youtube|twitch)?\b/gi,
    reason: 'social media username',
    replacement: '[USERNAME REMOVED]'
  },
  {
    pattern: /\b(?:can you|do you have|are you on|what's your)\s+(?:snapchat|instagram|tiktok|facebook|whatsapp|discord|telegram|kik|twitter|youtube|twitch)\b/gi,
    reason: 'social media inquiry',
    replacement: '[SOCIAL MEDIA REMOVED]'
  }
];

// Inappropriate Content Patterns - Expanded for chatbot safety
// NOTE: Safety-related messages (self-harm, suicide, etc.) are NOT included here
// They must be allowed through so the safety monitoring system can provide helplines
const INAPPROPRIATE_CONTENT_PATTERNS = [
  // We do NOT block self-harm or suicide mentions - these need safety response
  // We do NOT block depression or mental health concerns - these need support
  // We only block violent threats toward others or general inappropriate content
  {
    pattern: /\b(?:kill|hurt|harm|hit|punch|fight|beat up)\s+(?:you|someone|them|him|her|everyone)\b/gi,
    reason: 'violence threats',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]'
  },
  {
    pattern: /\b(?:i'll|i will|going to|gonna)\s+(?:kill|hurt|harm|hit|punch|fight|beat up)\s+(?:you|someone|them|him|her)\b/gi,
    reason: 'violence threats',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]'
  }
];

// Sexual Content Patterns - Critical for minor safety
// These patterns will be skipped if educational context is detected
const SEXUAL_CONTENT_PATTERNS = [
  {
    pattern: /\b(?:kiss|kisses|kissing|kissed)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true
  },
  {
    pattern: /\b(?:how to kiss|kissing boys|kissing girls|kissing someone)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true
  },
  {
    pattern: /\b(?:make out|making out|french kiss|french kissing)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: false // Always block these
  },
  {
    pattern: /\b(?:sex|sexual|sexuality|intercourse|intimate|intimacy)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true // Allow in biology/health context
  },
  {
    pattern: /\b(?:masturbate|masturbation|touching myself|pleasure myself)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: false // Always block personal references
  },
  {
    pattern: /\b(?:dick|cock|pussy|boobs|tits)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: false // Always block slang terms
  },
  {
    pattern: /\b(?:penis|vagina|breasts)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true // Allow anatomical terms in educational context
  },
  {
    pattern: /\b(?:horny|aroused|turn.*on|sexual feelings|sexual urges)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: false // Always block personal sexual feelings
  },
  {
    pattern: /\b(?:virginity|lose my virginity|losing virginity|first time)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true // May be discussed in health education
  },
  {
    pattern: /\b(?:hook up|hooking up|one night stand|sexual encounter|rizz me up|rizz)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: false // Always block casual sex references
  },
  {
    pattern: /\b(?:naked|nude|nudity|undress|take off clothes|get naked)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true // Allow in art/history context
  },
  {
    pattern: /\b(?:birth control|contraception|pregnancy|getting pregnant)\b/gi,
    reason: 'sexual content',
    replacement: '[INAPPROPRIATE CONTENT REMOVED]',
    skipIfEducational: true // Allow in health education
  }
];

// External Links
const EXTERNAL_LINK_PATTERN = {
  pattern: /https?:\/\/(?!(?:www\.)?skolr\.app)[^\s]+/gi,
  reason: 'external link',
  replacement: '[LINK REMOVED]'
};

// Base64 Images
const BASE64_IMAGE_PATTERN = {
  pattern: /data:image\/[^;]+;base64,[^\s]+/gi,
  reason: 'embedded image',
  replacement: '[IMAGE REMOVED]'
};

/**
 * Check if message contains educational context indicators
 */
function hasEducationalContext(message: string): boolean {
  const educationalIndicators = [
    /\b(biology|chemistry|physics|science|health|PE|dance|history|literature)\s+(class|lesson|assignment|homework|project)/i,
    /\bfor\s+(my|our)\s+(class|school|education|learning)/i,
    /\bstudying\s+(biology|chemistry|physics|science|health|anatomy|physiology)/i,
    /\b(teacher|professor|instructor)\s+(asked|assigned|taught)/i,
    /\bin\s+(science|biology|health|PE|dance)\s+we/i,
    /\b(reproductive|digestive|circulatory|respiratory|nervous)\s+system/i,
    /\bhuman\s+(anatomy|body|physiology)/i,
    /\bscientific\s+(explanation|process|method)/i,
    /\beducational\s+purposes?/i,
    /\bacademic\s+(research|study|work)/i,
    /\blearning\s+about/i
  ];
  
  return educationalIndicators.some(pattern => pattern.test(message));
}

/**
 * Filter message content for under-13 users
 */
export function filterMessageContent(
  message: string,
  isUnder13: boolean = true,
  strictMode: boolean = true
): FilterResult {
  if (!message || message.trim().length === 0) {
    return { isBlocked: false, cleanedMessage: message };
  }

  // Allow assessment command through without filtering
  if (message.trim().toLowerCase() === '/assess') {
    return { isBlocked: false, cleanedMessage: message };
  }
  
  // Check if message has educational context
  const isEducational = hasEducationalContext(message);

  let cleanedMessage = message;
  const flaggedPatterns: string[] = [];
  let shouldBlock = false;

  // Always check for personal information
  for (const filter of PERSONAL_INFO_PATTERNS) {
    const matches = message.match(filter.pattern);
    if (matches) {
      flaggedPatterns.push(filter.reason);
      if (strictMode || isUnder13) {
        shouldBlock = true;
        cleanedMessage = cleanedMessage.replace(filter.pattern, filter.replacement);
      }
    }
  }

  // Check for external platforms
  for (const filter of EXTERNAL_PLATFORM_PATTERNS) {
    const matches = message.match(filter.pattern);
    if (matches) {
      flaggedPatterns.push(filter.reason);
      if (isUnder13) {
        shouldBlock = true;
        cleanedMessage = cleanedMessage.replace(filter.pattern, filter.replacement);
      }
    }
  }

  // Check for inappropriate content
  for (const filter of INAPPROPRIATE_CONTENT_PATTERNS) {
    const matches = message.match(filter.pattern);
    if (matches) {
      flaggedPatterns.push(filter.reason);
      shouldBlock = true;
      cleanedMessage = cleanedMessage.replace(filter.pattern, filter.replacement);
    }
  }

  // Check for sexual content (consider educational context)
  for (const filter of SEXUAL_CONTENT_PATTERNS) {
    // Skip this filter if it has educational context and skipIfEducational is true
    if (isEducational && filter.skipIfEducational) {
      continue;
    }
    
    const matches = message.match(filter.pattern);
    if (matches) {
      flaggedPatterns.push(filter.reason);
      shouldBlock = true;
      cleanedMessage = cleanedMessage.replace(filter.pattern, filter.replacement);
    }
  }

  // Check for external links (block for under-13)
  if (isUnder13) {
    const linkMatches = message.match(EXTERNAL_LINK_PATTERN.pattern);
    if (linkMatches) {
      flaggedPatterns.push(EXTERNAL_LINK_PATTERN.reason);
      shouldBlock = true;
      cleanedMessage = cleanedMessage.replace(EXTERNAL_LINK_PATTERN.pattern, EXTERNAL_LINK_PATTERN.replacement);
    }
  }

  // Check for base64 images
  const imageMatches = message.match(BASE64_IMAGE_PATTERN.pattern);
  if (imageMatches) {
    flaggedPatterns.push(BASE64_IMAGE_PATTERN.reason);
    shouldBlock = true;
    cleanedMessage = cleanedMessage.replace(BASE64_IMAGE_PATTERN.pattern, BASE64_IMAGE_PATTERN.replacement);
  }

  return {
    isBlocked: shouldBlock,
    reason: flaggedPatterns.length > 0 ? `Contains: ${flaggedPatterns.join(', ')}` : undefined,
    cleanedMessage: shouldBlock ? cleanedMessage : message,
    flaggedPatterns
  };
}

/**
 * Check if a user is under 13 based on birthdate
 */
export function isUserUnder13(birthdate: Date | string | null): boolean {
  if (!birthdate) {
    // If no birthdate, assume under 13 for safety
    return true;
  }

  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 < 13;
  }
  
  return age < 13;
}

/**
 * Get appropriate system prompt additions for under-13 users
 */
export function getUnder13SystemPrompt(): string {
  return `
IMPORTANT: You are chatting with a student who may be under 13 years old. You must:
- Never ask for or acknowledge personal information (names, addresses, phone numbers, emails)
- If a student tries to share personal information, respond with: "For your safety, please don't share personal information online."
- Never suggest meeting in person or communicating outside of this platform
- Keep all conversations educational and age-appropriate
- Do not discuss mature topics or use complex language beyond their grade level
- If asked about social media or external platforms, remind them to focus on their learning
- Report any concerning messages through the safety system immediately
`;
}

/**
 * Log filtered content for compliance and concerns dashboard
 */
export async function logFilteredContent(
  userId: string,
  roomId: string,
  originalMessage: string,
  filterReason: string,
  supabaseAdmin: any,
  flaggedPatterns?: string[],
  actualStudentId?: string
): Promise<void> {
  try {
    // CRITICAL: Check if this is self-harm content - if so, DO NOT log to filtered_messages
    // The safety monitoring system handles these cases with proper helpline resources
    const lowerMessage = originalMessage.toLowerCase();
    const selfHarmKeywords = [
      'kill myself', 'want to die', 'end my life', 'suicide', 'suicidal',
      'hurt myself', 'harm myself', 'cut myself', 'hate myself',
      'better off without me', 'no point living', 'disappear forever'
    ];
    
    const isSelfHarmContent = selfHarmKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isSelfHarmContent) {
      console.log('[Content Filter] Self-harm content detected - NOT logging to filtered_messages. Safety monitoring system will handle this.');
      return;
    }

    // First, get the room details to find the teacher_id
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('teacher_id')
      .eq('room_id', roomId)
      .single();

    if (roomError || !room) {
      console.error('[Content Filter] Failed to get room details:', roomError);
      return;
    }

    // Log to filtered_messages table for compliance - ONLY for non-safeguarding content
    // Don't include filter_id - let the database generate it
    const insertData = {
      user_id: userId,
      room_id: roomId,
      original_message: originalMessage.substring(0, 500), // Truncate for storage
      filter_reason: filterReason,
      flagged_patterns: flaggedPatterns || [],
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabaseAdmin
      .from('filtered_messages')
      .insert(insertData);

    if (insertError) {
      console.error('[Content Filter] Failed to insert into filtered_messages:', insertError);
    } else {
      console.log('[Content Filter] Successfully inserted into filtered_messages');
    }

    // Determine concern type based on filter reason
    let concernType = 'inappropriate_content';
    let concernLevel = 3; // Medium severity by default
    
    if (filterReason.includes('sexual content')) {
      concernType = 'sexual_content';
      concernLevel = 4; // Higher severity for sexual content
    } else if (filterReason.includes('violence')) {
      concernType = 'violence';
      concernLevel = 4;
    } else if (filterReason.includes('personal information') || filterReason.includes('phone') || filterReason.includes('email') || filterReason.includes('address')) {
      concernType = 'personal_info_shared';
      concernLevel = 2;
    }

    // If actualStudentId is not provided, we need to look it up
    let studentIdForFlagged = actualStudentId;
    if (!studentIdForFlagged) {
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .select('student_id')
        .eq('auth_user_id', userId)
        .single();
      
      if (studentError || !studentData) {
        console.error('[Content Filter] Failed to get student_id for flagged_messages:', studentError);
        return;
      }
      studentIdForFlagged = studentData.student_id;
    }

    // Create a flagged message entry for the concerns dashboard
    // Don't insert to flagged_messages - it requires a foreign key to chat_messages
    // which doesn't exist for blocked messages
    console.log('[Content Filter] Skipping flagged_messages insert for blocked content');

  } catch (error) {
    console.error('[Content Filter] Error logging filtered content:', error);
  }
}