import ageMappings from '@/lib/config/age-mappings.json';

export interface AgeMapping {
  system: string;
  mappings: Record<string, number>;
}

export interface AgeMappingsConfig {
  [countryCode: string]: AgeMapping;
}

const typedAgeMappings = ageMappings as AgeMappingsConfig;

/**
 * Get the minimum age for a student based on their year/grade and country
 * @param yearGroup - The year/grade of the student (e.g., "7", "12")
 * @param countryCode - The country code (e.g., "UK", "US", "OTHER")
 * @returns The minimum age for that year group, or null if not found
 */
export function getStudentMinimumAge(yearGroup: string | number, countryCode: string): number | null {
  const normalizedYearGroup = yearGroup.toString().trim();
  const normalizedCountryCode = countryCode.toUpperCase();
  
  // Default to UK system if country not found
  const countryMapping = typedAgeMappings[normalizedCountryCode] || typedAgeMappings['OTHER'];
  
  if (!countryMapping || !countryMapping.mappings[normalizedYearGroup]) {
    console.warn(`No age mapping found for year group ${normalizedYearGroup} in country ${normalizedCountryCode}`);
    return null;
  }
  
  return countryMapping.mappings[normalizedYearGroup];
}

/**
 * Get the appropriate year/grade label for a country
 * @param countryCode - The country code
 * @returns The label to use (e.g., "Year" or "Grade")
 */
export function getYearGroupLabel(countryCode: string): string {
  const normalizedCountryCode = countryCode.toUpperCase();
  const countryMapping = typedAgeMappings[normalizedCountryCode] || typedAgeMappings['OTHER'];
  
  return countryMapping.system === 'grade' ? 'Grade' : 'Year';
}

/**
 * Get all valid year groups for a country
 * @param countryCode - The country code
 * @returns Array of valid year group values
 */
export function getValidYearGroups(countryCode: string): string[] {
  const normalizedCountryCode = countryCode.toUpperCase();
  const countryMapping = typedAgeMappings[normalizedCountryCode] || typedAgeMappings['OTHER'];
  
  return Object.keys(countryMapping.mappings).sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Create age context for AI prompts
 * @param age - The student's minimum age
 * @returns Age context string for AI prompts
 */
export function createAgeContext(age: number | null): string {
  if (!age) return '';
  
  // Create context that helps AI understand the student's developmental stage
  // without being patronizing
  if (age <= 7) {
    return `The student is approximately ${age} years old. Use clear, simple language but respect their intelligence and curiosity. Avoid complex abstract concepts but encourage their natural inquisitiveness.`;
  } else if (age <= 10) {
    return `The student is approximately ${age} years old. They can handle more complex ideas and enjoy exploring topics in depth. Use engaging language that respects their growing maturity.`;
  } else if (age <= 13) {
    return `The student is approximately ${age} years old. They are developing critical thinking skills and can engage with abstract concepts. Treat them as young scholars while being mindful of their developmental stage.`;
  } else if (age <= 15) {
    return `The student is approximately ${age} years old. They can engage with sophisticated concepts and appreciate nuanced discussions. Respect their intellectual capabilities while being age-appropriate in examples and context.`;
  } else {
    return `The student is approximately ${age} years old. Engage with them as mature learners capable of complex reasoning and analysis. Use sophisticated language while remaining accessible and supportive.`;
  }
}

/**
 * Check if content involves age-inappropriate relationships
 * @param studentAge - The student's minimum age
 * @param content - The content to check
 * @returns Object with safety concerns if any
 */
export function checkAgeAppropriateness(studentAge: number | null, content: string): {
  hasAgeInappropriateContent: boolean;
  concerns: string[];
} {
  if (!studentAge) {
    return { hasAgeInappropriateContent: false, concerns: [] };
  }
  
  const concerns: string[] = [];
  const lowerContent = content.toLowerCase();
  
  // Check for age-inappropriate relationship discussions
  const relationshipKeywords = ['boyfriend', 'girlfriend', 'dating', 'relationship', 'partner'];
  const ageKeywords = ['older', 'adult', 'age gap', 'years older', 'much older'];
  
  const hasRelationshipContent = relationshipKeywords.some(keyword => lowerContent.includes(keyword));
  const hasAgeGapContent = ageKeywords.some(keyword => lowerContent.includes(keyword));
  
  if (hasRelationshipContent && hasAgeGapContent && studentAge < 16) {
    concerns.push('Discussion of potentially inappropriate age-gap relationship');
  }
  
  // Check for substance use discussions
  const substanceKeywords = ['alcohol', 'drinking', 'drunk', 'drugs', 'smoking', 'vaping', 'weed', 'party', 'partying'];
  const hasSubstanceContent = substanceKeywords.some(keyword => lowerContent.includes(keyword));
  
  if (hasSubstanceContent) {
    if (studentAge < 21) {
      concerns.push('Discussion of underage substance use');
    }
    if (studentAge < 16 && hasSubstanceContent) {
      concerns.push('Concerning substance discussion for young age');
    }
  }
  
  // Check for other age-inappropriate content
  if (studentAge < 13) {
    const matureKeywords = ['suicide', 'self-harm', 'sexual', 'violence'];
    const hasMatureContent = matureKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasMatureContent) {
      concerns.push('Content may be too mature for student age');
    }
  }
  
  return {
    hasAgeInappropriateContent: concerns.length > 0,
    concerns
  };
}