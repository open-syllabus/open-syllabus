// src/app/api/auth/student-username-lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Public API to look up a student by name, username, or email and check if the PIN matches
// This avoids requiring client-side permissions to read from the profiles table
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    console.log('Student lookup API called');
    
    // Get identifier (name or email) and PIN from request body
    const { identifier, pin } = await request.json();
    
    if (!identifier) {
      return NextResponse.json({ 
        error: 'Name or email is required' 
      }, { status: 400 });
    }
    
    const cleanIdentifier = identifier.trim();
    console.log(`Looking up student: ${cleanIdentifier}`);
    
    // First, try to match by username (most specific)
    const { data: usernameProfiles } = await supabaseAdmin
      .from('students')
      .select('student_id, first_name, surname, pin_code, username')
      .ilike('username', cleanIdentifier)
      .limit(5);
      
    let profiles = usernameProfiles;
    
    // If not found by username, try full_name
    if (!profiles || profiles.length === 0) {
      console.log(`Not found by username, trying name: ${cleanIdentifier}`);
      // For name search, check both first_name and surname
      const { data: nameProfiles } = await supabaseAdmin
        .from('students')
        .select('student_id, first_name, surname, pin_code, username')
        .or(`first_name.ilike.%${cleanIdentifier}%,surname.ilike.%${cleanIdentifier}%`)
        .limit(5);
        
      if (nameProfiles && nameProfiles.length > 0) {
        profiles = nameProfiles;
      }
    }
      
    // If not found by name, try email
    if (!profiles || profiles.length === 0) {
      console.log(`Not found by name, trying email: ${cleanIdentifier}`);
      // Try to find by email in students table
      const { data: emailProfiles } = await supabaseAdmin
        .from('students')
        .select('student_id, first_name, surname, pin_code, username')
        .eq('email', cleanIdentifier);
        
      if (emailProfiles && emailProfiles.length > 0) {
        profiles = emailProfiles;
      }
    }
    
    // If still not found, try fuzzy matching on any field
    if (!profiles || profiles.length === 0) {
      console.log(`Not found by exact matches, trying fuzzy match: ${cleanIdentifier}`);
      
      // Get all students
      const { data: allStudents } = await supabaseAdmin
        .from('students')
        .select('student_id, first_name, surname, pin_code, username')
        .limit(30);
      
      if (allStudents && allStudents.length > 0) {
        console.log(`Searching among ${allStudents.length} student profiles`);
        console.log('Available usernames:', allStudents.map(s => s.username));
        
        // Try fuzzy matching on name or username
        const matches = allStudents.filter(student => {
          const fullName = `${student.first_name || ''} ${student.surname || ''}`.toLowerCase();
          const firstName = (student.first_name || '').toLowerCase();
          const surname = (student.surname || '').toLowerCase();
          const username = (student.username || '').toLowerCase();
          const searchTerm = cleanIdentifier.toLowerCase();
          
          return fullName.includes(searchTerm) || 
                 firstName.includes(searchTerm) ||
                 surname.includes(searchTerm) ||
                 username.includes(searchTerm) ||
                 searchTerm.includes(username);
        });
        
        if (matches.length > 0) {
          console.log(`Found ${matches.length} fuzzy matches`);
          console.log('Matched usernames:', matches.map(s => s.username));
          profiles = matches;
        }
      }
    }
    
    // If no profile found, return error
    if (!profiles || profiles.length === 0) {
      console.log('No matches found for:', cleanIdentifier);
      return NextResponse.json({
        error: 'Student not found',
        status: 'not_found',
        identifier: cleanIdentifier
      }, { status: 404 });
    }
    
    // Find the best match if we have multiple
    const bestMatch = profiles[0]; // Default to first match
    
    const bestMatchName = `${bestMatch.first_name} ${bestMatch.surname}`.trim();
    console.log(`Best match found: ${bestMatchName} (${bestMatch.username})`);
    
    // If PIN is provided, verify it matches
    if (pin) {
      console.log(`Verifying PIN for: ${bestMatchName}`);
      console.log(`Expected PIN: ${bestMatch.pin_code}, Provided PIN: ${pin}`);
      
      if (!bestMatch.pin_code) {
        return NextResponse.json({
          error: 'Student does not have a PIN set',
          status: 'no_pin',
          user_id: null
        }, { status: 401 });
      }
        
      if (bestMatch.pin_code !== pin) {
        return NextResponse.json({
          error: 'Incorrect PIN',
          status: 'incorrect_pin',
          user_id: null
        }, { status: 401 });
      }
      
      // PIN matches, return success with user_id for login
      return NextResponse.json({
        success: true,
        status: 'success',
        user_id: bestMatch.student_id,
        pin_verified: true,
        best_match: {
          full_name: `${bestMatch.first_name} ${bestMatch.surname}`.trim(),
          username: bestMatch.username
        }
      });
    }
    
    // If just looking up without verifying PIN, return info about matches
    return NextResponse.json({
      success: true,
      status: 'student_found',
      matches: profiles.map(p => ({
        full_name: `${p.first_name} ${p.surname}`.trim(),
        username: p.username
      })),
      match_count: profiles.length,
      best_match: {
        full_name: `${bestMatch.first_name} ${bestMatch.surname}`.trim(),
        username: bestMatch.username
      },
      user_id: null, // Don't leak the user_id if PIN wasn't verified
      pin_required: true
    });
    
  } catch (error) {
    console.error('Student lookup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Student lookup failed' },
      { status: 500 }
    );
  }
}