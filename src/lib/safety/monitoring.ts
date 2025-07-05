// src/lib/safety/monitoring.ts
/**
 * Safety monitoring and response system
 * 
 * ===== SAFETY CRITICAL CODE =====
 * This file handles student safety concerns and delivers country-specific helplines
 * to students when concerning messages are detected. 
 * 
 * IMPORTANT: This is a complete rewrite for robustness and maintainability
 * Date: June 2025
 */

import type { Room, Database } from '@/types/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseClient } from '@supabase/supabase-js'
import { sendTeacherAlert } from '@/lib/safety/alerts'
import { generateSafetyResponse } from '@/lib/safety/generateSafetyResponse'
import { trackSafetyAnalytics } from '@/lib/safety/analytics'

// ===== TYPES =====

interface HelplineEntry {
  name: string
  phone?: string
  website?: string
  text_to?: string
  text_msg?: string
  short_desc: string
}

interface HelplineData {
  [countryCode: string]: HelplineEntry[]
}

interface SafetyCheckResult {
  hasConcern: boolean
  concernType: string | null
}

interface VerificationResult {
  isRealConcern: boolean
  concernLevel: number
  analysisExplanation: string
  aiGeneratedAdvice: string | null
}

// ===== CONSTANTS =====

const CONCERN_THRESHOLD = 3
const SAFETY_MESSAGE_COOLDOWN_MINUTES = 30
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SAFETY_CHECK_MODEL = 'google/gemini-2.5-flash-preview-05-20'
const SAFETY_SCREENING_MODEL = 'google/gemini-2.5-flash-preview-05-20' // Using Gemini 2.5 Flash for AI-powered initial screening

// ===== HELPLINE DATA =====

const HELPLINES_RAW_JSON = `
{
  "US": [
    { "name": "Childhelp USA", "phone": "1-800-422-4453", "website": "childhelp.org", "short_desc": "Child abuse prevention & treatment" },
    { "name": "National Suicide & Crisis Lifeline", "phone": "988", "website": "988lifeline.org", "short_desc": "24/7 crisis support" },
    { "name": "Crisis Text Line", "text_to": "741741", "text_msg": "HOME", "short_desc": "Text support for any crisis" },
    { "name": "The Trevor Project", "phone": "1-866-488-7386", "website": "thetrevorproject.org", "short_desc": "For LGBTQ youth" }
  ],
  "CA": [
    { "name": "Kids Help Phone", "phone": "1-800-668-6868", "website": "kidshelpphone.ca", "short_desc": "24/7 youth support (text CONNECT to 686868)" },
    { "name": "Talk Suicide Canada", "phone": "1-833-456-4566", "website": "talksuicide.ca", "short_desc": "Suicide prevention & support (text 45645)" },
    { "name": "Canadian Centre for Child Protection", "website": "protectchildren.ca", "short_desc": "Child safety resources" }
  ],
  "GB": [
    { "name": "Childline", "phone": "0800 1111", "website": "childline.org.uk", "short_desc": "Support for children & young people" },
    { "name": "NSPCC Helpline", "phone": "0808 800 5000", "website": "nspcc.org.uk", "short_desc": "If you're worried about a child" },
    { "name": "Samaritans", "phone": "116 123", "website": "samaritans.org", "short_desc": "Emotional support, 24/7" },
    { "name": "Papyrus HOPELINEUK", "phone": "0800 068 4141", "website": "papyrus-uk.org", "short_desc": "Suicide prevention for under 35s" }
  ],
  "IE": [
    { "name": "Childline (ISPCC)", "phone": "1800 66 66 66", "website": "childline.ie", "short_desc": "24/7 support for children (text 'LIST' to 50101)" },
    { "name": "Samaritans Ireland", "phone": "116 123", "website": "samaritans.org/ireland/", "short_desc": "Emotional support, 24/7" },
    { "name": "Pieta House", "phone": "1800 247247", "website": "pieta.ie", "short_desc": "Suicide & self-harm crisis centre (text HELP to 51444)" }
  ],
  "FR": [
    { "name": "Allo Enfance en Danger", "phone": "119", "website": "allo119.gouv.fr", "short_desc": "National child protection helpline (24/7)" },
    { "name": "Suicide Écoute", "phone": "01 45 39 40 00", "website": "suicide-ecoute.fr", "short_desc": "Suicide prevention helpline" },
    { "name": "Net Ecoute (e-Enfance)", "phone": "3018", "website": "e-enfance.org/numero-3018/", "short_desc": "Protection for children online (cyberbullying, etc.)" }
  ],
  "ES": [
    { "name": "ANAR (Ayuda a Niños y Adolescentes en Riesgo)", "phone": "900 20 20 10", "website": "anar.org", "short_desc": "Help for children & adolescents at risk (24/7)" },
    { "name": "Teléfono de la Esperanza", "phone": "717 003 717", "website": "telefonodelaesperanza.org", "short_desc": "Crisis support line" }
  ],
  "IT": [
    { "name": "Telefono Azzurro", "phone": "19696", "website": "azzurro.it", "short_desc": "Child helpline (24/7)" },
    { "name": "Telefono Amico Italia", "phone": "02 2327 2327", "website": "telefonoamico.it", "short_desc": "Emotional support helpline (check hours)" }
  ],
  "PT": [
    { "name": "SOS Criança (IAC)", "phone": "116 111", "website": "iacrianca.pt", "short_desc": "Child helpline (check hours)" },
    { "name": "Voz de Apoio", "phone": "225 50 60 70", "website": "vozdeapoio.pt", "short_desc": "Emotional support helpline (check hours)" }
  ],
  "DE": [
    { "name": "Nummer gegen Kummer (Kinder- und Jugendtelefon)", "phone": "116 111", "website": "nummergegenkummer.de", "short_desc": "Helpline for children & youth (Mon-Sat)" },
    { "name": "TelefonSeelsorge", "phone": "0800 111 0 111", "website": "telefonseelsorge.de", "short_desc": "Crisis support (24/7)" }
  ],
  "GR": [
    { "name": "The Smile of the Child (National Helpline for Children SOS)", "phone": "1056", "website": "hamogelo.gr", "short_desc": "Child helpline (24/7)" },
    { "name": "KLIMAKA (Suicide Prevention)", "phone": "1018", "website": "klimaka.org.gr", "short_desc": "24/7 suicide prevention line" }
  ],
  "AU": [
    { "name": "Kids Helpline", "phone": "1800 55 1800", "website": "kidshelpline.com.au", "short_desc": "Counselling for young people 5-25 (24/7)" },
    { "name": "Lifeline Australia", "phone": "13 11 14", "website": "lifeline.org.au", "short_desc": "24/7 crisis support & suicide prevention" },
    { "name": "eSafety Commissioner", "website": "esafety.gov.au", "short_desc": "Online safety help & reporting" }
  ],
  "AE": [
    { "name": "Child Protection Centre (Ministry of Interior)", "phone": "116111", "website": "moi-cpc.ae", "short_desc": "Child protection helpline" },
    { "name": "Dubai Foundation for Women and Children", "phone": "800111", "website": "dfwac.ae", "short_desc": "Support for women & children (violence/abuse)" }
  ],
  "MY": [
    { "name": "Buddy Bear Helpline", "phone": "1-800-18-BEAR (2327)", "short_desc": "Support helpline for children" },
    { "name": "PS The Children (Protect and Save The Children)", "phone": "+603-7957 4344", "short_desc": "Child protection services" }
  ],
  "NZ": [
    { "name": "Youthline", "phone": "0800 376 633", "text_to": "234", "website": "youthline.co.nz", "short_desc": "24/7 service for young people 12-24 years" },
    { "name": "What's Up", "phone": "0800 942 8787", "website": "whatsup.co.nz", "short_desc": "Phone counseling for ages 5-18, 11am-11pm daily" },
    { "name": "Kidsline", "phone": "0800 54 37 54", "short_desc": "New Zealand's only 24/7 helpline run by youth volunteers" },
    { "name": "1737 Need to Talk?", "phone": "1737", "website": "1737.org.nz", "short_desc": "Free national counseling service, call or text anytime" }
  ],
  "DEFAULT": [
    { "name": "Your Local Emergency Services", "short_desc": "Contact if in immediate danger (e.g., 911, 112, 999, 000)." },
    { "name": "A Trusted Adult", "short_desc": "Speak to a teacher, school counselor, parent, or another family member." },
    { "name": "Befrienders Worldwide", "website": "befrienders.org", "short_desc": "Find a crisis support center in your region." }
  ]
}`

// Parse helpline data
let ALL_HELPLINES: HelplineData
try {
  ALL_HELPLINES = JSON.parse(HELPLINES_RAW_JSON) as HelplineData
  console.log(`[Safety] Loaded helplines for ${Object.keys(ALL_HELPLINES).length} countries`)
} catch (error) {
  console.error('[Safety] CRITICAL: Failed to parse helplines data:', error)
  ALL_HELPLINES = {
    DEFAULT: [
      { name: "Emergency Services", short_desc: "Contact local emergency services if in immediate danger" },
      { name: "Talk to a Trusted Adult", short_desc: "Speak to a teacher, school counselor, or parent" }
    ]
  }
}

// ===== SAFETY KEYWORDS =====

const CONCERN_KEYWORDS: Record<string, string[]> = {
  age_inappropriate_relationship: [
    // School year references that indicate age gaps
    '6th form', 'sixth form', 'college', 'university', 'uni student', 'a level', 'year 12', 'year 13',
    'upper sixth', 'lower sixth', 'high school', 'secondary school student',
    // Discussions about liking/dating older people
    'like older', 'likes older', 'like an adult', 'like a grown', 'dating older', 'date older',
    'boyfriend older', 'girlfriend older', 'he is 18', 'she is 18', 'he is 19', 'she is 19',
    'he is 20', 'she is 20', 'he is 21', 'she is 21', 'he is 22', 'she is 22', 'he is 23', 'she is 23',
    'he is 24', 'she is 24', 'he is 25', 'she is 25', 'he is 26', 'she is 26', 'he is 27', 'she is 27',
    'he is 28', 'she is 28', 'he is 29', 'she is 29', 'he is 30', 'she is 30', 'he is 31', 'she is 31',
    'he is 32', 'she is 32', 'he is 33', 'she is 33', 'he is 34', 'she is 34', 'he is 35', 'she is 35',
    'he is 36', 'she is 36', 'he is 37', 'she is 37', 'he is 38', 'she is 38', 'he is 39', 'she is 39',
    'he is 40', 'she is 40', 'years older', 'much older', 'way older', 'adult boyfriend', 'adult girlfriend',
    'man I like', 'woman I like', 'guy I like', 'girl I like', 'boys I like', 'girls I like',
    'like the 18', 'like the 19', 'like the 20', 'like the 21', 'like the 22', 'like the 23',
    'like the 24', 'like the 25', 'like the 26', 'like the 27', 'like the 28', 'like the 29',
    'like the 30', 'like the 31', 'like the 32', 'like the 33', 'like the 34', 'like the 35',
    'like the 36', 'like the 37', 'like the 38', 'like the 39', 'like the 40',
    // Age mentions with romantic context
    'one is 18', 'one is 19', 'one is 20', 'one is 21', 'one is 22', 'one is 23', 'one is 24',
    'one is 25', 'one is 26', 'one is 27', 'one is 28', 'one is 29', 'one is 30', 'one is 31',
    'one is 32', 'one is 33', 'one is 34', 'one is 35', 'one is 36', 'one is 37', 'one is 38',
    'one is 39', 'one is 40', 'is 18 and', 'is 19 and', 'is 20 and', 'is 21 and', 'is 22 and',
    'is 23 and', 'is 24 and', 'is 25 and', 'is 26 and', 'is 27 and', 'is 28 and', 'is 29 and',
    'is 30 and', 'is 31 and', 'is 32 and', 'is 33 and', 'is 34 and', 'is 35 and', 'is 36 and',
    'is 37 and', 'is 38 and', 'is 39 and', 'is 40 and',
    'relationship with older', 'relationship with adult', 'seeing someone older', 'seeing an adult',
    'in love with older', 'in love with adult', 'crush on older', 'crush on adult',
    'teacher I like', 'coach I like', 'tutor I like', 'neighbor I like', 'neighbour I like',
    'met online', 'met on internet', 'wants to meet', 'asking for photos', 'send photos',
    'keep it secret', 'don\'t tell anyone', 'our secret', 'special relationship',
    'pick me up', 'drive me', 'come to his', 'go to his', 'come to her', 'go to her',
    'alone together', 'spend time alone', 'when parents away', 'when no one home'
  ],
  underage_substance_use: [
    // Alcohol-related
    'drinking', 'drunk', 'wasted', 'beer', 'wine', 'vodka', 'whiskey', 'alcohol', 'booze',
    'getting drunk', 'got drunk', 'been drinking', 'had drinks', 'having drinks', 'drink alcohol',
    'tried alcohol', 'trying alcohol', 'first drink', 'shots', 'doing shots', 'pregaming',
    'pre-gaming', 'sneaking drinks', 'sneak drinks', 'parents liquor', 'parents alcohol',
    'liquor cabinet', 'fake id', 'fake i.d.', 'underage drinking', 'drink at party',
    'drinks at party', 'drinking at party', 'drunk at party', 'tipsy', 'buzzed', 'hammered',
    'blackout', 'blacked out', 'hangover', 'hungover', 'throwing up drunk', 'vomiting drunk',
    // Drug-related
    'drugs', 'weed', 'marijuana', 'cannabis', 'smoking weed', 'smoke weed', 'tried weed',
    'trying weed', 'getting high', 'got high', 'stoned', 'baked', 'blazed', 'joint',
    'blunt', 'bong', 'edibles', 'vaping', 'vape', 'juul', 'nicotine', 'cigarettes',
    'smoking', 'smoke cigarettes', 'pills', 'molly', 'ecstasy', 'acid', 'shrooms',
    'cocaine', 'coke', 'crack', 'meth', 'heroin', 'opioids', 'xanax', 'adderall',
    'prescription drugs', 'stealing pills', 'parents pills', 'medicine cabinet',
    // Party/risky behavior
    'party', 'partying', 'house party', 'rager', 'kegger', 'drinking game', 'beer pong',
    'flip cup', 'never have i ever', 'truth or dare', 'spin the bottle', 'seven minutes',
    'sneaking out', 'sneak out', 'stay out late', 'lying to parents', 'fake sleepover',
    'older kids party', 'college party', 'frat party', 'club', 'fake my age',
    'pretend to be older', 'act older', 'hang with older', 'older crowd', 'bad crowd',
    // Peer pressure
    'everyone does it', 'everyone drinks', 'everyone smokes', 'peer pressure', 'pressured to',
    'make me drink', 'make me smoke', 'make me try', 'fit in', 'be cool', 'look cool',
    'called me baby', 'called me chicken', 'called me scared', 'prove myself', 'prove im not'
  ],
  sexual_content: [
    // General sexual terms that shouldn't be discussed with minors
    'how to kiss', 'kissing boys', 'kissing girls', 'kissing someone', 'make out', 'making out', 
    'french kiss', 'french kissing', 'tongue kiss', 'deep kiss', 'passionate kiss',
    'sex', 'sexual', 'sexuality', 'intercourse', 'intimate', 'intimacy', 'foreplay',
    'oral sex', 'anal sex', 'vaginal sex', 'sexual acts', 'sexual activity', 'sexual experience',
    'lose my virginity', 'losing virginity', 'first time', 'virgin', 'virginity',
    'sexual positions', 'sex positions', 'how to have sex', 'having sex', 'getting laid',
    'hook up', 'hooking up', 'one night stand', 'sexual encounter', 'sexual relationship',
    'turn me on', 'turns me on', 'aroused', 'horny', 'sexual feelings', 'sexual urges',
    'masturbate', 'masturbation', 'touching myself', 'pleasure myself', 'self pleasure',
    'orgasm', 'climax', 'come', 'cumming', 'ejaculate', 'ejaculation',
    'erection', 'hard on', 'boner', 'arousal', 'sexual arousal', 'sexually excited',
    'wet dream', 'nocturnal emission', 'sexual fantasy', 'sexual thoughts', 'dirty thoughts',
    'sexual desire', 'lust', 'lustful', 'seduction', 'seduce', 'seducing', 'flirting',
    'sexual harassment', 'inappropriate touching', 'unwanted advances', 'sexual pressure',
    'birth control', 'contraception', 'pregnancy', 'getting pregnant', 'teen pregnancy',
    'sexually transmitted', 'std', 'sti', 'sexual health', 'sexual education',
    // Body parts in sexual context
    'breasts', 'boobs', 'tits', 'nipples', 'penis', 'dick', 'cock', 'vagina', 'pussy',
    'ass', 'butt', 'buttocks', 'genitals', 'private parts', 'down there',
    // Dating/relationship terms that can be inappropriate for minors
    'sexual partner', 'sexual relationship', 'friends with benefits', 'casual sex',
    'sleeping together', 'sleeping with', 'bed together', 'naked together', 'undress',
    'take off clothes', 'get naked', 'strip', 'stripping', 'nude', 'nudity'
  ],
  self_harm: [
    'hate myself', 'don\'t want to live', 'don\'t want to be alive', 'don\'t want to be here', 'don\'t want to exist',
    'not worth going on', 'no point in living', 'no point going on', 'rather be dead', 'should end it',
    'should end it all', 'end it all', 'give up', 'giving up', 'take my own life', 'take my life',
    'harming myself', 'harm myself', 'hurting myself', 'cut myself', 'cutting myself', 'disappear forever',
    'everyone better off without me', 'they\'d be better off without me', 'they would be better off without me',
    'leave this world', 'escape this world', 'stop existing', 'tired of being alive', 'tired of existing',
    'too much pain', 'can\'t take it anymore', 'life is too hard', 'life isn\'t worth it', 'never wake up',
    'wish I wouldn\'t wake up', 'make the pain stop', 'no hope left', 'nowhere to turn', 'plan to kill',
    'how to end', 'easier if I wasn\'t here', 'easier if I was gone', 'want to die', 'wanna die',
    'kill myself', 'suicidal'
  ],
  bullying: [
    'bullied', 'bully', 'bullying', 'they hate me', 'everyone hates me', 'laughed at me', 'laugh at me',
    'excluded', 'leave me out', 'leaving me out', 'no friends', 'don\'t have friends', 'nobody likes me',
    'no one likes me', 'call me names', 'called me names', 'push me around', 'pushed me', 'shove me',
    'shoved me', 'making threats', 'threatened me', 'online bullying', 'cyberbullying', 'posting about me',
    'spreading rumors', 'spreading rumours', 'spreading lies', 'everyone talks about me', 'made fun of',
    'mock me', 'mocking me', 'rejected by everyone', 'being isolated', 'no one talks to me',
    'nobody talks to me', 'they ignore me', 'everyone ignores me', 'being targeted', 'pick on me',
    'won\'t leave me alone', 'always after me', 'ganging up on me', 'scared to go to school',
    'don\'t want to go to school', 'afraid at school', 'scared at school'
  ],
  abuse: [
    'hurt me', 'hurting me', 'hitting me', 'hit by', 'kicks me', 'kicking me', 'pushed me', 'pushes me',
    'throws things at me', 'threw things at me', 'threw something at me', 'yells at me', 'yelling at me',
    'screams at me', 'screaming at me', 'threatens me', 'threatening me', 'controls me', 'controlling me',
    'not allowed to', 'won\'t let me', 'keeps me from', 'locked me in', 'locks me in', 'touches me',
    'touched me', 'uncomfortable touching', 'hurt by someone', 'afraid of them', 'afraid to go home',
    'scared to go home', 'not safe at home', 'don\'t feel safe around', 'being punished',
    'punishes me unfairly', 'treated badly', 'treats me badly', 'calls me stupid', 'calls me worthless',
    'makes me feel worthless', 'makes me feel bad', 'punched me', 'punches me', 'slapped me', 'slaps me',
    'bruises from', 'left bruises', 'threatened to hurt me if I told', 'can\'t tell anyone'
  ],
  depression: [
    'hate my life', 'no one cares', 'nobody cares', 'nobody loves me', 'no one loves me', 'feel empty',
    'feeling empty', 'feel nothing', 'feels like nothing matters', 'nothing matters', 'what\'s the point',
    'feel worthless', 'feeling worthless', 'don\'t feel anything', 'don\'t know what to do',
    'can\'t see a future', 'lost all hope', 'lost hope', 'given up', 'feel like a failure', 'am a failure',
    'everything is dark', 'darkness closing in', 'can\'t get out of bed', 'can\'t face the day',
    'crying all the time', 'crying myself to sleep', 'never happy', 'always feeling down', 'feel so alone',
    'completely alone', 'no one understands', 'nobody understands', 'don\'t enjoy anything',
    'nothing makes me happy', 'too sad to function', 'too sad to do anything', 'life is meaningless',
    'unable to feel joy', 'can\'t sleep', 'can\'t eat', 'can\'t concentrate', 'mind feels foggy',
    'exhausted all the time', 'overwhelmed by sadness', 'drowning in sadness', 'feeling very sad',
    'feel very sad', 'so sad', 'really sad', 'feeling sad', 'feel sad', 'lonely', 'feeling lonely',
    'feel lonely', 'so lonely', 'feeling alone', 'very lonely', 'sad and lonely'
  ],
  family_issues: [
    'parents always fighting', 'parents always argue', 'parents hate each other', 'home is not safe',
    'scared at home', 'afraid at home', 'can\'t stand being home', 'hate being home', 'nowhere to go',
    'might get kicked out', 'might be kicked out', 'threatened to kick me out', 'parent drinking',
    'parent drunk', 'parents drunk', 'drinking problem', 'drug problem', 'parents using drugs',
    'parent using drugs', 'not enough food', 'going hungry', 'no food at home', 'can\'t sleep at home',
    'parents separated', 'parents separating', 'parents broke up', 'parents splitting up',
    'losing our house', 'lost our house', 'might be homeless', 'could be homeless',
    'moving in with relatives', 'have to move', 'parent lost job', 'no money for', 'can\'t afford',
    'parent in jail', 'parent arrested', 'no one takes care of me', 'have to take care of myself',
    'have to take care of my siblings', 'parent is sick', 'parent is ill', 'parent in hospital',
    'no electricity', 'utilities shut off', 'water shut off'
  ]
}

// ===== HELPER FUNCTIONS =====

/**
 * Get helplines for a specific country
 */
function getHelplines(countryCode: string): HelplineEntry[] {
  const normalized = normalizeCountryCode(countryCode)
  return ALL_HELPLINES[normalized] || ALL_HELPLINES['DEFAULT'] || []
}

/**
 * Get auth user ID for a student
 */
async function getAuthUserId(studentId: string): Promise<string> {
  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient
    .from('students')
    .select('auth_id')
    .eq('id', studentId)
    .single()
    
  if (error || !data?.auth_id) {
    throw new Error(`Failed to get auth_id for student ${studentId}: ${error?.message}`)
  }
  
  return data.auth_id
}

/**
 * Normalize country code to standard format
 */
function normalizeCountryCode(countryCode: string | null): string {
  if (!countryCode || typeof countryCode !== 'string') return 'DEFAULT'
  
  const normalized = countryCode.trim().toUpperCase()
  
  // Handle common aliases
  const aliases: Record<string, string> = {
    'UK': 'GB',
    'UAE': 'AE', 
    'USA': 'US'
  }
  
  return aliases[normalized] || normalized
}

/**
 * Check for recent safety message in the room FOR THE SAME CONCERN TYPE
 * This prevents duplicate messages for the same issue, but allows different safety concerns to be addressed
 */
async function hasRecentSafetyMessageForConcernType(
  sessionId: string,
  authUserId: string,
  chatbotId: string | null,
  concernType: string
): Promise<boolean> {
  const adminClient = createAdminClient()
  const cutoffTime = new Date(Date.now() - SAFETY_MESSAGE_COOLDOWN_MINUTES * 60 * 1000).toISOString()
  
  const query = adminClient
    .from('messages')
    .select('id, created_at, content')
    .eq('session_id', sessionId)
    .eq('role', 'system')
    .gte('created_at', cutoffTime)
    .limit(5) // Check last 5 safety messages
  
  // Note: In the current schema, messages don't have metadata field
  // So we can't filter by chatbot ID in the message itself
  
  const { data } = await query
  
  if (!data || data.length === 0) {
    return false
  }
  
  // Since we can't store metadata in messages table, we check if there's any recent safety message
  // This is a simpler approach but prevents all safety messages for the cooldown period
  if (data && data.length > 0) {
    console.log(`[Safety] Found ${data.length} recent safety messages, skipping to avoid spam`)
    return true
  }
  
  return false
}

/**
 * Create flag for teacher review
 */
async function createFlag(params: {
  messageId: string
  studentId: string
  room: Room
  concernType: string
  concernLevel: number
  explanation: string
}): Promise<string | null> {
  const adminClient = createAdminClient()
  
  // First check if a flag already exists for this message
  const { data: existingFlag } = await adminClient
    .from('flagged_messages')
    .select('id')
    .eq('message_id', params.messageId)
    .single()
    
  if (existingFlag) {
    console.log(`[Safety] Flag already exists for message ${params.messageId}, flag_id: ${existingFlag.id}`)
    return existingFlag.id
  }
  
  // Create new flag
  console.log(`[Safety] Inserting new flag with data:`, {
    message_id: params.messageId,
    student_id: params.studentId,
    teacher_id: params.room.teacher_id,
    room_id: params.room.room_id,
    concern_type: params.concernType,
    concern_level: params.concernLevel
  })
  
  const { data, error } = await adminClient
    .from('flagged_messages')
    .insert({
      message_id: params.messageId,
      student_id: params.studentId,
      teacher_id: params.room.teacher_id,
      room_id: params.room.room_id,
      concern_type: params.concernType,
      concern_level: params.concernLevel,
      analysis_explanation: params.explanation,
      status: 'pending' as const
    })
    .select('id')
    .single()
    
  if (error) {
    console.error('[Safety] Failed to create flag:', error)
    // If it's a duplicate key error, try to fetch the existing flag
    if (error.code === '23505') {
      const { data: existingFlag } = await adminClient
        .from('flagged_messages')
        .select('id')
        .eq('message_id', params.messageId)
        .single()
      
      if (existingFlag) {
        console.log(`[Safety] Retrieved existing flag after duplicate error: ${existingFlag.id}`)
        return existingFlag.id
      }
    }
    return null
  }
  
  return data?.id || null
}

/**
 * Insert safety message
 */
async function insertSafetyMessage(params: {
  room: Room
  authUserId: string
  chatbotId: string | null
  content: string
  metadata: Record<string, any>
  instanceId?: string | null
}): Promise<string | null> {
  const adminClient = createAdminClient()
  
  const messageData: any = {
    room_id: params.room.room_id,
    user_id: params.authUserId,
    role: 'system',
    content: params.content,
    created_at: new Date().toISOString(),
    metadata: {
      ...params.metadata,
      chatbotId: params.chatbotId,
      isSystemSafetyResponse: true,
      safetyMessageVersion: '3.0'
    }
  }
  
  if (params.instanceId) {
    messageData.instance_id = params.instanceId
  }
  
  const { data, error } = await adminClient
    .from('messages')
    .insert(messageData)
    .select('id')
    .single()
    
  if (error) {
    console.error('[Safety] Failed to insert safety message:', error)
    return null
  }
  
  return data?.id || null
}

/**
 * Send alert to teacher
 */
async function notifyTeacher(
  room: Room,
  studentId: string,
  concernType: string,
  concernLevel: number,
  messageContent: string,
  flagId: string | null
): Promise<void> {
  try {
    const adminClient = createAdminClient()
    
    // Get teacher email
    const { data: teacherProfile } = await adminClient
      .from('teachers')
      .select('email')
      .eq('id', room.teacher_id)
      .single()
      
    if (!teacherProfile?.email) {
      console.warn('[Safety] No teacher email found')
      return
    }
    
    // Get student name from students table
    const { data: studentProfile } = await adminClient
      .from('students')
      .select('first_name, surname')
      .eq('id', studentId)
      .single()
      
    const studentName = studentProfile ? `${studentProfile.first_name} ${studentProfile.surname}` : 'Unknown Student'
    const roomName = room.room_name || 'Unnamed Room'
    const viewUrl = flagId ? 
      `${process.env.NEXT_PUBLIC_APP_URL}/teacher-dashboard/concerns/${flagId}` :
      `${process.env.NEXT_PUBLIC_APP_URL}/teacher-dashboard`
    
    await sendTeacherAlert(
      teacherProfile.email,
      studentName,
      roomName,
      concernType,
      concernLevel,
      messageContent,
      viewUrl
    )
  } catch (error) {
    console.error('[Safety] Failed to notify teacher:', error)
  }
}

/**
 * Broadcast safety message via realtime
 */
async function broadcastSafetyMessage(
  room: Room,
  messageId: string,
  authUserId: string,
  studentId: string,
  chatbotId: string | null
): Promise<void> {
  try {
    const adminClient = createAdminClient()
    // Use a consistent channel name that matches what Chat.tsx is listening for
    const channel = adminClient.channel(`safety-alert-${authUserId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'safety-message',
      payload: {
        room_id: room.room_id,
        message_id: messageId,
        user_id: authUserId,
        student_id: studentId,
        chatbot_id: chatbotId
      }
    })
    
    // Don't remove the channel immediately - let it stay alive for a bit
    // This ensures the message has time to be delivered
    setTimeout(() => {
      adminClient.removeChannel(channel)
    }, 5000) // Increased from 1000ms to 5000ms
  } catch (error) {
    console.error('[Safety] Broadcast failed:', error)
  }
}

// ===== MAIN EXPORTED FUNCTIONS =====

/**
 * AI-powered initial safety screening using Gemini 2.5 Flash
 */
async function aiSafetyScreening(message: string, studentAge: number | null): Promise<SafetyCheckResult> {
  try {
    const prompt = `You are a safety screening system for a school chat platform. A ${studentAge ? `${studentAge}-year-old` : 'young'} student just sent this message:

"${message}"

Analyze if this message contains ANY safety concerns. Look for:
1. Age-inappropriate relationships (e.g., romantic interest in adults or much older individuals)
2. Substance use (alcohol, drugs, vaping, partying)
3. Self-harm or suicidal ideation
4. Bullying or harassment
5. Abuse (physical, emotional, sexual)
6. Depression or mental health crisis
7. Family safety issues
8. Sexual content or inappropriate discussions
9. Online safety risks (meeting strangers, sharing personal info)
10. Any other concerning content for a ${studentAge ? `${studentAge}-year-old` : 'young student'}

Be VERY sensitive to nuanced language and age gaps. For example:
- "the 34 year old wants to chat" from a 10-year-old is concerning
- "which boy should I choose" with age gaps is concerning
- Any adult showing special interest in a child is concerning
- A primary school student (Years 1-6) liking someone in "6th form" (Years 12-13, ages 16-18) is EXTREMELY concerning
- References to "college", "university", "6th form" from young children indicate dangerous age gaps
- A 10-year-old wanting to "get a girlfriend" in 6th form is an age-inappropriate relationship concern

Respond with JSON only:
{
  "hasConcern": boolean,
  "concernType": string | null,
  "confidence": number (0-1),
  "explanation": string
}

If hasConcern is true, concernType should be one of: age_inappropriate_relationship, underage_substance_use, self_harm, bullying, abuse, depression, family_issues, sexual_content, online_safety, other`

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Skolr Safety Screening',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: SAFETY_SCREENING_MODEL,
        messages: [
          { role: 'system', content: 'You are a safety screening system. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('[Safety] AI screening API error:', response.status)
      // Fall back to keyword check
      return keywordBasedCheck(message)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)
    
    console.log('[Safety] AI screening result:', result)
    
    return {
      hasConcern: result.hasConcern,
      concernType: result.concernType
    }
  } catch (error) {
    console.error('[Safety] AI screening error:', error)
    // Fall back to keyword check
    return keywordBasedCheck(message)
  }
}

/**
 * Fallback keyword-based check (kept as backup)
 */
function keywordBasedCheck(message: string): SafetyCheckResult {
  const lowerMessage = message.toLowerCase()
  
  for (const [category, keywords] of Object.entries(CONCERN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return { hasConcern: true, concernType: category }
      }
    }
  }
  
  return { hasConcern: false, concernType: null }
}

/**
 * Check if a message contains concerning content
 */
export async function initialConcernCheck(message: string, studentAge?: number | null): Promise<SafetyCheckResult> {
  console.log(`[Safety] Checking message: "${message.substring(0, 100)}..." for ${studentAge ? `${studentAge}-year-old` : 'student'}`)
  
  // Skip safety check for system commands
  if (message.trim().startsWith('/')) {
    console.log('[Safety] Skipping check - message is a system command')
    return { hasConcern: false, concernType: null }
  }
  
  // Use AI screening if we have the API key
  if (process.env.OPENROUTER_API_KEY) {
    return await aiSafetyScreening(message, studentAge || null)
  }
  
  // Fall back to keyword check
  console.log('[Safety] No API key, using keyword-based check')
  return keywordBasedCheck(message)
}

/**
 * Verify concern with LLM
 */
export async function verifyConcern(
  messageContent: string,
  concernType: string,
  recentMessages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
  countryCode: string | null,
  studentAge?: number | null
): Promise<VerificationResult> {
  try {
    // Build context string
    let contextString = ''
    if (recentMessages.length > 0) {
      contextString = "\n\nRecent Conversation History (most recent last):\n"
      recentMessages.slice(-3).forEach(msg => {
        const roleLabel = msg.role === 'user' ? 'Student' : (msg.role === 'assistant' ? 'Assistant' : 'System')
        contextString += `${roleLabel}: ${msg.content}\n`
      })
    }
    
    // Normalize country code
    const effectiveCountryCode = normalizeCountryCode(countryCode)
    
    // Get helplines for the prompt
    const helplines = getHelplines(effectiveCountryCode)
    const helplinesToList = helplines.slice(0, 3)
    
    let conciseHelplineDataForPrompt = "Relevant Support Contacts (use ONLY these for the student's country):\n"
    helplinesToList.forEach(line => {
      conciseHelplineDataForPrompt += `* ${line.name}`
      if (line.phone) {
        conciseHelplineDataForPrompt += ` - Phone: ${line.phone}`
      } else if (line.text_to && line.text_msg) {
        conciseHelplineDataForPrompt += ` - Text: ${line.text_msg} to ${line.text_to}`
      } else if (line.website) {
        conciseHelplineDataForPrompt += ` - Website: ${line.website}`
      }
      if (line.short_desc) {
        conciseHelplineDataForPrompt += ` (${line.short_desc})`
      }
      conciseHelplineDataForPrompt += "\n"
    })
    
    // Special handling for inappropriate content
    const isInappropriateContent = concernType === 'sexual_content' || concernType === 'age_inappropriate_relationship'
    const isSubstanceUse = concernType === 'underage_substance_use'
    
    // Add age context if available
    const ageContext = studentAge ? `Student Age: Approximately ${studentAge} years old\n` : ''
    
    const promptParts = [
      `You are a safety assessment system analyzing student messages for genuine welfare concerns. Focus ONLY on messages where the student is directly expressing personal distress, harm, or danger to themselves.`,
      `Concern Category Identified: ${concernType.replace(/_/g, ' ')}`,
      ageContext,
      contextString,
      `Student's Message: "${messageContent}"`,
      `\nCRITICAL ASSESSMENT CRITERIA:`,
      `- Only flag messages where the student is talking about THEMSELVES being in distress, danger, or needing help`,
      `- Do NOT flag: academic discussions, historical events, book/movie content, hypothetical scenarios, or general questions`,
      `- Look for first-person statements (I, me, my) indicating personal crisis or genuine need for support`,
      `- Academic assessment commands like "/assess" are NOT safety concerns`,
      studentAge ? `- Consider age-appropriateness: For a ${studentAge}-year-old, be especially alert to discussions of relationships with much older individuals, substance use, or content that may indicate grooming or exploitation` : '',
      concernType === 'age_inappropriate_relationship' ? `- CRITICAL AGE-INAPPROPRIATE RELATIONSHIP: A ${studentAge || 'young'}-year-old discussing romantic feelings or relationships with ANYONE significantly older (especially adults 18+) IS a serious safety concern. Even vague references to "older" people in romantic contexts should be flagged. Look for patterns across messages - if they previously mentioned specific ages (like 34) and now reference "older boy", connect those dots. THIS IS ALWAYS A REAL CONCERN (isRealConcern: true, concernLevel: 4+)` : '',
      concernType === 'underage_substance_use' && studentAge ? `- CRITICAL: A ${studentAge}-year-old discussing alcohol, drugs, or partying is a serious safety concern. Even if they're talking about others doing it, they may be testing boundaries or seeking validation` : '',
      `\nTasks:`,
      `1.  **Analysis for Teacher (Internal):**`,
      `    a.  **isRealConcern**: (boolean: true/false) Is the STUDENT expressing a genuine PERSONAL concern about their own welfare?`,
      `    b.  **concernLevel**: (number 0-5) Only rate 3+ if this is clearly about the student's own situation.`,
      `    c.  **analysisExplanation**: (string) Brief explanation focusing on whether this is about the student personally.\n`,
      `2.  **Safety Redirect Message for Student (aiGeneratedAdvice):**`,
      `    CRITICAL: Do NOT engage with the personal topic. Generate a brief redirect message that:
    - Does NOT discuss or acknowledge the specific topic they raised
    - Does NOT ask them to share more or "talk about it"
    - Simply states help is available and shows helplines
    - Mentions their teacher can see the conversation
    - Redirects to trusted adults
    
    Good examples:
    - "I see you may need some support. Your teacher can see this conversation and these helplines can help:"
    - "It's important to talk to a trusted adult about this. Here are some resources:"
    - "Your safety is important. Please speak with your teacher or parent. These helplines can also help:"
    
    BAD examples (NEVER USE):
    - "Can we talk more about what you shared?"
    - "I want to understand better"
    - "It sounds like you're having fun..."
    - Any message that engages with their personal topic
    
    Then list these helplines:
${conciseHelplineDataForPrompt.trim()}`,
      `\nRespond ONLY with a valid JSON object with these exact keys:`,
      `"isRealConcern": boolean,`,
      `"concernLevel": number,`,
      `"analysisExplanation": string,`,
      `"aiGeneratedAdvice": string (Your natural, conversational response including helplines)`
    ]
    
    const prompt = promptParts.join('\n')

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://app.skolai.com',
        'X-Title': 'Skol AI Safety System'
      },
      body: JSON.stringify({
        model: SAFETY_CHECK_MODEL,
        messages: [
          { role: 'system', content: 'You are a student safety assessment system. Flag messages where a student is expressing PERSONAL distress, harm, or danger about THEMSELVES. EXCEPTION: Age-inappropriate relationships are ALWAYS a concern - if a young student discusses romantic feelings for older individuals, this IS a personal safety issue requiring intervention. Academic content, commands like /assess, or third-person discussions (unless about relationships with age gaps) are NOT safety concerns. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 700,
        temperature: 0.2
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Safety] LLM API response:', JSON.stringify(data, null, 2))
    
    const result = JSON.parse(data.choices[0].message.content || '{}')
    console.log('[Safety] LLM parsed result:', JSON.stringify(result, null, 2))
    
    // Generate advice if needed
    let aiGeneratedAdvice = result.studentMessage
    if (result.isRealConcern && result.concernLevel >= CONCERN_THRESHOLD && !aiGeneratedAdvice) {
      aiGeneratedAdvice = await generateSafetyResponse(concernType, countryCode, messageContent, studentAge, ALL_HELPLINES)
    }
    
    const finalResult = {
      isRealConcern: result.isRealConcern === true,
      concernLevel: Math.max(0, Math.min(5, result.concernLevel || 0)),
      analysisExplanation: result.analysisExplanation || result.explanation || 'Flagged for review',
      aiGeneratedAdvice: aiGeneratedAdvice || result.aiGeneratedAdvice || null
    }
    
    console.log('[Safety] Final verification result:', JSON.stringify(finalResult, null, 2))
    return finalResult
  } catch (error) {
    console.error('[Safety] LLM verification failed:', error)
    // Fail safe - treat as real concern
    return {
      isRealConcern: true,
      concernLevel: 3,
      analysisExplanation: 'Automated review unavailable - flagged for manual review',
      aiGeneratedAdvice: await generateSafetyResponse(concernType, countryCode, messageContent, studentAge, ALL_HELPLINES)
    }
  }
}

/**
 * Main safety check function
 */
export async function checkMessageSafety(
  supabaseUserContextClient: SupabaseClient<Database>,
  messageContent: string,
  messageId: string,
  studentId: string,
  room: Room,
  countryCode: string | null,
  instanceId?: string | null,
  studentAge?: number | null
): Promise<{ concernDetected: boolean; messageSent: boolean }> {
  console.log(`[Safety] Starting check for message ${messageId}`)
  console.log(`[Safety] Message content: "${messageContent.substring(0, 100)}..."`)
  console.log(`[Safety] Student ID: ${studentId}`)
  console.log(`[Safety] Room ID: ${room.room_id}`)
  console.log(`[Safety] Country code: ${countryCode}`)
  console.log(`[Safety] Student age: ${studentAge}`)
  
  try {
    // Step 1: Quick keyword check
    const { hasConcern, concernType } = await initialConcernCheck(messageContent, studentAge)
    console.log(`[Safety] Initial check result: hasConcern=${hasConcern}, concernType=${concernType}`)
    if (!hasConcern || !concernType) {
      console.log('[Safety] No keywords detected, exiting')
      return { concernDetected: false, messageSent: false }
    }
    
    // Step 2: Get necessary IDs and data
    const authUserId = await getAuthUserId(studentId)
    
    const adminClient = createAdminClient()
    // In the new schema, we don't have metadata on messages
    // The bot_id comes from the context passed to this function
    const chatbotId = null // This would need to be passed from the calling function
      
    const effectiveInstanceId = instanceId
    
    // Step 3: Get context for LLM - include more messages for better context
    // Get recent messages from the session
    const { data: recentMessages } = await adminClient
      .from('messages')
      .select('role, content, created_at')
      .eq('session_id', instanceId) // Messages are linked to sessions, not rooms
      .order('created_at', { ascending: false })
      .limit(20)  // Get more messages to ensure we have full context
      
    const context = (recentMessages || [])
      .map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content || '' }))
      .reverse()
    
    // Step 4: Verify with LLM
    const verification = await verifyConcern(messageContent, concernType, context, countryCode, studentAge)
    
    if (!verification.isRealConcern || verification.concernLevel < CONCERN_THRESHOLD) {
      console.log(`[Safety] Not a real concern or below threshold (level ${verification.concernLevel})`)
      return { concernDetected: false, messageSent: false }
    }
    
    // Step 5: Create flag
    console.log(`[Safety] Creating flag for message ${messageId}, student ${studentId}, room ${room.room_id}`)
    const flagId = await createFlag({
      messageId,
      studentId,
      room,
      concernType,
      concernLevel: verification.concernLevel,
      explanation: verification.analysisExplanation
    })
    
    if (!flagId) {
      console.error(`[Safety] Failed to create/retrieve flag for message ${messageId}`)
      // Continue anyway - safety message is more important than flag creation
    } else {
      console.log(`[Safety] Flag created/retrieved successfully: ${flagId}`)
    }
    
    // Step 6: Alert teacher
    await notifyTeacher(room, studentId, concernType, verification.concernLevel, messageContent, flagId)
    
    // Step 7: Check cooldown - but ONLY for the same concern type
    // Different safety concerns should always get responses
    const hasRecent = await hasRecentSafetyMessageForConcernType(effectiveInstanceId || '', authUserId, chatbotId, concernType)
    if (hasRecent) {
      console.log(`[Safety] Recent safety message exists for concern type ${concernType}, skipping duplicate`)
      return { concernDetected: true, messageSent: false }
    }
    
    // Step 8: Insert safety message
    const safetyContent = verification.aiGeneratedAdvice || 
      await generateSafetyResponse(concernType, countryCode, messageContent, studentAge, ALL_HELPLINES)
      
    const safetyMessageId = await insertSafetyMessage({
      room,
      authUserId,
      chatbotId,
      content: safetyContent,
      metadata: {
        originalConcernType: concernType,
        originalConcernLevel: verification.concernLevel,
        triggerMessageId: messageId,
        countryCode: normalizeCountryCode(countryCode)
      },
      instanceId: effectiveInstanceId
    })
    
    if (!safetyMessageId) {
      return { concernDetected: true, messageSent: false }
    }
    
    // Step 9: Track and broadcast
    await trackSafetyAnalytics(
      safetyMessageId,
      studentId,
      room.room_id,
      concernType,
      countryCode,
      new Date().toISOString()
    )
    
    await broadcastSafetyMessage(room, safetyMessageId, authUserId, studentId, chatbotId)
    
    console.log(`[Safety] Completed - safety message sent: ${safetyMessageId}`)
    return { concernDetected: true, messageSent: true }
    
  } catch (error) {
    console.error('[Safety] Error in checkMessageSafety:', error)
    return { concernDetected: false, messageSent: false }
  }
}