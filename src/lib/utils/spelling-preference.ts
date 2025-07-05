import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Countries that use US English spelling
const US_ENGLISH_COUNTRIES = ['US', 'USA', 'UNITED_STATES'];

// Countries that use UK English spelling (most Commonwealth countries and UK)
const UK_ENGLISH_COUNTRIES = [
  'GB', 'UK', 'UNITED_KINGDOM', 'ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND',
  'AU', 'AUSTRALIA', 'NZ', 'NEW_ZEALAND', 'CA', 'CANADA', 'IE', 'IRELAND',
  'IN', 'INDIA', 'ZA', 'SOUTH_AFRICA', 'MY', 'MALAYSIA', 'SG', 'SINGAPORE',
  'HK', 'HONG_KONG', 'MT', 'MALTA', 'CY', 'CYPRUS', 'JM', 'JAMAICA',
  'BZ', 'BELIZE', 'GH', 'GHANA', 'KE', 'KENYA', 'NG', 'NIGERIA', 'UG', 'UGANDA'
];

export type SpellingPreference = 'UK' | 'US' | 'UK'; // Default to UK

/**
 * Get user's spelling preference based on their country
 */
export async function getUserSpellingPreference(userId: string): Promise<SpellingPreference> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('country_code')
      .eq('user_id', userId)
      .single();
    
    if (teacherProfile?.country_code) {
      return getSpellingFromCountryCode(teacherProfile.country_code);
    }
    
    // Check if user is a student
    const { data: studentData } = await supabase
      .from('students')
      .select('auth_user_id, country_code')
      .eq('auth_user_id', userId)
      .single();
    
    if (studentData?.country_code) {
      return getSpellingFromCountryCode(studentData.country_code);
    }
    
    // Default to UK English if no country found
    console.log(`[Spelling] No country found for user ${userId}, defaulting to UK English`);
    return 'UK';
    
  } catch (error) {
    console.error('[Spelling] Error getting user spelling preference:', error);
    return 'UK'; // Default to UK English on error
  }
}

/**
 * Get user's spelling preference using admin client (for background jobs)
 */
export async function getUserSpellingPreferenceAdmin(userId: string): Promise<SpellingPreference> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Check if user is a teacher
    const { data: teacherProfile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('country_code')
      .eq('user_id', userId)
      .single();
    
    if (teacherProfile?.country_code) {
      return getSpellingFromCountryCode(teacherProfile.country_code);
    }
    
    // Check if user is a student
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('auth_user_id, country_code')
      .eq('auth_user_id', userId)
      .single();
    
    if (studentData?.country_code) {
      return getSpellingFromCountryCode(studentData.country_code);
    }
    
    // Default to UK English if no country found
    console.log(`[Spelling] No country found for user ${userId}, defaulting to UK English`);
    return 'UK';
    
  } catch (error) {
    console.error('[Spelling] Error getting user spelling preference (admin):', error);
    return 'UK'; // Default to UK English on error
  }
}

/**
 * Convert country code to spelling preference
 */
function getSpellingFromCountryCode(countryCode: string): SpellingPreference {
  const upperCode = countryCode.toUpperCase();
  
  if (US_ENGLISH_COUNTRIES.includes(upperCode)) {
    return 'US';
  }
  
  // Default to UK English for all other countries including UK/Commonwealth
  return 'UK';
}

/**
 * Get spelling instruction text for system prompts
 */
export function getSpellingInstruction(preference: SpellingPreference): string {
  switch (preference) {
    case 'US':
      return '\n\nSPELLING: Use American English spelling (e.g., "color", "center", "organize", "analyze", "recognize").';
    case 'UK':
    default:
      return '\n\nSPELLING: Use British English spelling (e.g., "colour", "centre", "organise", "analyse", "recognise").';
  }
}

/**
 * Get spelling examples for different preferences
 */
export function getSpellingExamples(preference: SpellingPreference): {
  color: string;
  center: string;
  organize: string;
  analyze: string;
  recognize: string;
  realize: string;
  theater: string;
  defense: string;
} {
  if (preference === 'US') {
    return {
      color: 'color',
      center: 'center',
      organize: 'organize',
      analyze: 'analyze',
      recognize: 'recognize',
      realize: 'realize',
      theater: 'theater',
      defense: 'defense'
    };
  }
  
  // UK English (default)
  return {
    color: 'colour',
    center: 'centre',
    organize: 'organise',
    analyze: 'analyse',
    recognize: 'recognise',
    realize: 'realise',
    theater: 'theatre',
    defense: 'defence'
  };
}