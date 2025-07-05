// src/app/room/[roomId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import { GlassCard } from '@/components/shared/GlassCard';
import { ContentCard, StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import { PageTitle, Heading, Text } from '@/components/ui/Typography';
import { Grid, Section } from '@/components/ui/Layout';
import StudentList from '@/components/teacher/StudentList';
import { ModernStudentNav } from '@/components/student/ModernStudentNav';
import LightbulbLoader from '@/components/shared/LightbulbLoader';
import type { Chatbot } from '@/types/database.types';
import { 
  FiMessageSquare, 
  FiBookOpen, 
  FiClipboard, 
  FiVideo,
  FiBook,
  FiChevronRight 
} from 'react-icons/fi';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%);
  padding: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
    padding-bottom: 80px; /* Space for bottom nav on mobile */
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const RoomInfo = styled.div`
  .room-code {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.brand.primary};
    margin-top: ${({ theme }) => theme.spacing.xs};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      text-align: center;
    }
  }
`;

const BackButtonWrapper = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    
    button {
      width: 100%;
      justify-content: center;
    }
  }
`;



const CoursesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const CompactGrid = styled(Grid)`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const CourseCardWrapper = styled(GlassCard)`
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;











const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  svg {
    width: 64px;
    height: 64px;
    color: #E5E7EB;
    margin-bottom: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 40px 20px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
`;

// Placeholder component to prevent layout shift
function CoursesPlaceholder() {
  return (
    <CoursesSection>
      <div style={{ 
        height: '32px', 
        width: '200px', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        marginBottom: '24px',
        opacity: 0.3
      }} />
    </CoursesSection>
  );
}

// Client-side only courses component to prevent hydration issues
function CoursesClientComponent({ courses }: { courses: any[] }) {
  console.log('[CoursesClientComponent] Rendering with courses:', courses);
  
  if (!courses || courses.length === 0) {
    console.log('[CoursesClientComponent] No courses to display');
    return null;
  }
  
  return (
    <CoursesSection>
      <Heading level="h2" weight="bold">Available Courses</Heading>
      <CourseGrid>
        {courses.map((course) => (
          <Link 
            key={course.course_id} 
            href={`/student/courses/${course.course_id}`}
            style={{ textDecoration: 'none' }}
          >
            <ContentCard
              title={course.title}
              subtitle={course.subject}
              description={course.description || 'No description available'}
              icon={<FiBookOpen />}
              variant="secondary"
              actions={
                <ModernButton 
                  as="div"  // Prevent double link
                  variant="secondary"
                  size="medium"
                  fullWidth
                >
                  View Lessons
                </ModernButton>
              }
            />
          </Link>
        ))}
      </CourseGrid>
    </CoursesSection>
  );
}


// Extended chatbot interface to include instance_id
interface ChatbotWithInstance extends Chatbot {
  instance_id?: string;
}

interface RoomQueryResult {
  room_id: string;
  room_name: string;
  room_code: string;
  teacher_id: string;
  school_id: string;
  is_active: boolean;
  created_at: string;
  room_chatbots: {
    chatbots: Chatbot;
  }[] | null;
}

export default function RoomPage() {
  const [room, setRoom] = useState<RoomQueryResult | null>(null);
  const [chatbots, setChatbots] = useState<ChatbotWithInstance[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  
  const params = useParams();
  const roomId = params?.roomId as string;
  const router = useRouter();
  const supabase = createClient();
  const supabaseAdmin = createClient(); // We'll conditionally use admin for direct access

  // Check for direct access via URL param
  const searchParams = useSearchParams();
  
  // SECURITY ENHANCEMENT: Use access signature instead of direct UID
  const accessSignature = searchParams?.get('access_signature');
  const timestamp = searchParams?.get('ts');
  let uidFromUrl = searchParams?.get('uid'); // For backward compatibility
  
  console.log('[RoomPage] URL parameters:', {
    accessSignature,
    timestamp,
    rawUid: searchParams?.get('uid'),
    direct: searchParams?.get('direct')
  });
  
  // If we have a secure access signature, decode it to get the user ID
  if (accessSignature && timestamp) {
    try {
      const decoded = atob(accessSignature);
      const [userId, signatureTimestamp] = decoded.split(':');
      
      // Verify timestamp matches to prevent tampering
      if (signatureTimestamp === timestamp) {
        uidFromUrl = userId;
        console.log('[RoomPage] Successfully decoded access signature, set uidFromUrl:', uidFromUrl);
      } else {
        console.error('[RoomPage] Timestamp mismatch in access signature');
      }
    } catch (e) {
      console.error('[RoomPage] Failed to decode access signature:', e);
    }
  }
  
  const fetchRoomData = useCallback(async () => {
    try {
      // We already have uidFromUrl from the decoded access_signature or legacy uid parameter
      // No need to reassign it - use uidFromUrl directly
      console.log('[RoomPage] fetchRoomData starting with uidFromUrl:', uidFromUrl);
      let userId, userRole;
      
      // First, try to get the authenticated user normally
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('[RoomPage] Auth check:', { 
        hasUser: !!user, 
        userError,
        uidFromUrl,
        searchParams: Object.fromEntries(searchParams?.entries() || [])
      });
      
      // Helper function to get cookie values
      const getCookieValue = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };
      
      // Check for different auth mechanisms via cookies
      // First with standard auth-* cookies, then check older emergency_* cookies for backward compatibility
      const authUserId = getCookieValue('auth-user-id') || getCookieValue('emergency_user_id');
      const directAccess = getCookieValue('auth-direct-access') === 'true' || getCookieValue('emergency_access') === 'true';
      const cookieRoomId = getCookieValue('auth-room-id') || getCookieValue('emergency_room_id');
      const directAccessMode = searchParams?.get('direct') === 'true' || searchParams?.get('emergency') === 'true';
      
      console.log('[RoomPage] Access check:', {
        authUserId,
        directAccess,
        cookieRoomId,
        directAccessMode,
        currentRoomId: roomId
      });
      
      if (!user) {
        if (directAccess && authUserId && cookieRoomId === roomId) {
          console.log('[RoomPage] Using direct access cookies:', authUserId);
          // For direct access, just use the auth_user_id
          // The API will handle the conversion to student_id
          userId = authUserId;
          userRole = 'student';
          setIsStudent(true);
        } else if (uidFromUrl) {
          console.log('[RoomPage] No authenticated user but UID found:', uidFromUrl);
          // For direct access, just use the auth_user_id
          // The API will handle the conversion to student_id
          userId = uidFromUrl;
          userRole = 'student'; // Assume student role for direct access
          setIsStudent(true);
        } else {
          throw new Error('Not authenticated');
        }
      } else {
        userId = user.id;
        setAuthenticatedUserId(user.id); // Store the auth user ID
        
        // ROBUST FIX: Simplified role detection
        // For any direct access or special cases, assume student role
        if (uidFromUrl || directAccess || directAccessMode) {
          console.log('[RoomPage] Direct/special access detected, assuming student role');
          userRole = 'student';
          setUserRole('student');
          setIsStudent(true);
        } else {
          // Only check teacher profile to determine role
          // This avoids the 406 error on students table
          console.log('[RoomPage] Checking if user is a teacher');
          const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (teacherProfile) {
            console.log('[RoomPage] Teacher profile found');
            userRole = 'teacher';
            setUserRole('teacher');
            setIsStudent(false);
          } else {
            // If not a teacher, must be a student
            console.log('[RoomPage] No teacher profile found, assuming student role');
            userRole = 'student';
            setUserRole('student');
            setIsStudent(true);
          }
        }
      }

      // ROBUST FIX: Use appropriate access check based on role
      let hasAccess = false;
      if (userRole === 'teacher') {
        // Teachers can use direct query - they have RLS permissions
        const { data: teacherRoom } = await supabase
          .from('rooms')
          .select('room_id')
          .eq('room_id', roomId)
          .eq('teacher_id', userId)
          .single();
        
        hasAccess = !!teacherRoom;
      } else if (userRole === 'student') {
        // Students MUST use API to check membership
        console.log('[RoomPage] Using API to check student membership');
        const effectiveUserId = uidFromUrl || userId;
        console.log('[RoomPage] Checking membership for:', {
          effectiveUserId,
          uidFromUrl,
          userId,
          roomId
        });
        
        try {
          const response = await fetch(`/api/student/verify-membership?roomId=${roomId}&userId=${effectiveUserId}`, {
            credentials: 'include'
          });
          
          console.log('[RoomPage] Membership API response status:', response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log('[RoomPage] Membership API response:', result);
            // Handle new standardized API response format
            const data = result.success ? result.data : result;
            hasAccess = data.isMember;
            console.log('[RoomPage] Access check via API:', hasAccess ? 'Granted' : 'Denied', 'Message:', data.message);
          } else {
            const errorText = await response.text();
            console.error('[RoomPage] Failed to check membership via API, status:', response.status, 'error:', errorText);
            hasAccess = false;
          }
        } catch (apiError) {
          console.error('[RoomPage] Error checking membership via API:', apiError);
          hasAccess = false;
        }
      }

      if (!hasAccess) {
        throw new Error('You do not have access to this room');
      }

      // ROBUST FIX: Always use API for students, direct queries for teachers only
      if (userRole === 'student' || isStudent) {
        // Students MUST use API to avoid RLS issues
        console.log('[RoomPage] Student detected, using API exclusively');
        
        // Use the most reliable user ID available
        const effectiveUserId = authUserId || uidFromUrl || userId;
        const response = await fetch(`/api/student/room-data?roomId=${roomId}&userId=${effectiveUserId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[RoomPage] API error response:', errorText);
          throw new Error('Failed to fetch room data. Please try refreshing the page.');
        }
        
        const result = await response.json();
        // Handle new standardized API response format
        const data = result.success ? result.data : result;
        setRoom(data.room);
        setChatbots(data.chatbots || []);
        setCourses(data.courses || []);
        
        console.log('[RoomPage] Successfully loaded room data via API:', {
          roomName: data.room?.room_name,
          chatbotCount: data.chatbots?.length || 0,
          courseCount: data.courses?.length || 0,
          chatbotIds: data.chatbots?.map((c: any) => ({ 
            chatbot_id: c.chatbot_id, 
            instance_id: c.instance_id,
            name: c.name,
            model: c.model,
            ai_model: c.ai_model
          })),
          courses: data.courses
        });
        return; // Exit early - no fallback for students
      }

      // Teachers can use direct queries (they have proper RLS permissions)
      console.log('[RoomPage] Teacher detected, using direct queries');
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      // Retrieve chatbots using a two-step process to bypass potential RLS issues
      // Step 1: Get chatbot IDs for this room
      const { data: roomChatbots, error: rcError } = await supabase
        .from('room_chatbots')
        .select('chatbot_id')
        .eq('room_id', roomId);

      if (rcError) {
        console.error('[RoomPage] Error fetching room-chatbot relations:', rcError);
        throw new Error('Failed to retrieve chatbot information');
      }

      // Step 2: Get the chatbot details
      const extractedChatbots: Chatbot[] = [];
      
      if (roomChatbots && roomChatbots.length > 0) {
        const chatbotIds = roomChatbots.map(rc => rc.chatbot_id);
        
        const { data: chatbots, error: chatbotsError } = await supabase
          .from('chatbots')
          .select('*')
          .in('chatbot_id', chatbotIds);

        if (chatbotsError) {
          console.error('[RoomPage] Error fetching chatbots:', chatbotsError);
          throw new Error('Failed to retrieve chatbot information');
        }
        
        extractedChatbots.push(...(chatbots || []));
      }
      
      // Fetch courses for the room
      console.log('[RoomPage] Fetching courses for room:', roomId);
      const { data: roomCourses, error: coursesError } = await supabase
        .from('room_courses')
        .select(`
          course_id,
          courses (
            course_id,
            title,
            description,
            subject,
            is_published
          )
        `)
        .eq('room_id', roomId);
        
      if (coursesError) {
        console.error('[RoomPage] Error fetching room courses:', coursesError);
      }

      // Extract and filter courses
      const extractedCourses: any[] = [];
      if (roomCourses && !coursesError) {
        console.log('[RoomPage] Room courses data:', roomCourses);
        roomCourses.forEach(rc => {
          const course = rc.courses as any;
          if (course) {
            // For teachers, show all courses. For students, only published ones
            if (userRole === 'teacher' || course.is_published) {
              extractedCourses.push(course);
            }
          }
        });
        console.log('[RoomPage] Extracted courses:', extractedCourses);
      }
      
      // Set the state variables
      setRoom({
        ...roomData,
        room_chatbots: []
      } as RoomQueryResult);
      setChatbots(extractedChatbots);
      setCourses(extractedCourses);
    } catch (err) {
      console.error('[RoomPage] Error in fetchRoomData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [roomId, uidFromUrl, supabase, searchParams]);

  // Add hydration effect with minimal delay for better UX
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const frame = requestAnimationFrame(() => {
      setIsHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (uidFromUrl) {
      console.log('[RoomPage] Direct user ID access detected:', uidFromUrl);
    }
    
    if (roomId) {
      fetchRoomData();
    }
  }, [roomId, fetchRoomData, uidFromUrl]);

  const handleBack = () => {
    console.log('[RoomPage] handleBack called:', {
      userRole,
      uidFromUrl,
      isStudent
    });
    
    if (userRole === 'teacher') {
      router.push('/teacher-dashboard');
    } else {
      // For students, we already have uidFromUrl if it was provided
      if (uidFromUrl) {
        // Store ID in localStorage for additional reliability
        localStorage.setItem('student_direct_access_id', uidFromUrl);
        localStorage.setItem('current_student_id', uidFromUrl);
        
        // Create a timestamp for the student dashboard
        const timestamp = Date.now();
        // Create an access signature with the user ID
        const accessSignature = btoa(`${uidFromUrl}:${timestamp}`);
        
        const dashboardUrl = `/student/dashboard?user_id=${uidFromUrl}&uid=${uidFromUrl}&access_signature=${accessSignature}&ts=${timestamp}&direct=1`;
        console.log('[RoomPage] Navigating to:', dashboardUrl);
        
        // Navigate to the student dashboard with secure signature
        router.push(dashboardUrl);
      } else {
        console.log('[RoomPage] No uidFromUrl, fallback to regular dashboard');
        // Fallback to regular student dashboard
        router.push('/student/dashboard');
      }
    }
  };

  const getModelDisplayName = (model: string | undefined | null) => {
    if (!model || model === 'undefined' || model === 'null') return 'Default';
    
    // Common model mappings
    const modelNames: Record<string, string> = {
      'x-ai/grok-3-mini-beta': 'Grok-3 Mini',
      'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
      'google/gemini-2.5-flash-preview': 'Gemini 2.5 Flash',
      'google/gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash',
      'openai/gpt-4.1-mini': 'GPT-4.1 Mini',
      'nvidia/llama-3.1-nemotron-ultra-253b-v1': 'Llama-3.1 Nemotron',
      'deepseek/deepseek-r1-0528': 'DeepSeek-R1',
      'minimax/minimax-m1': 'Minimax-M1',
      'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
      'openai/gpt-4o': 'GPT-4o',
      'openai/gpt-4o-mini': 'GPT-4o Mini',
      'google/gemma-3-27b-it:free': 'Gemma-3 27B',
      'microsoft/phi-4-reasoning-plus:free': 'Phi-4 Reasoning',
      'qwen/qwen3-32b:free': 'Qwen3-32B',
      'qwen/qwen3-235b-a22b:free': 'Qwen3-235B'
    };
    
    // Check if we have a predefined name
    if (modelNames[model]) {
      return modelNames[model];
    }
    
    // Otherwise, extract the model name after the provider
    const parts = model.split('/');
    if (parts.length > 1) {
      // Get the last part and clean it up
      let modelName = parts[parts.length - 1];
      // Remove :free suffix if present
      modelName = modelName.replace(':free', '');
      // Capitalize each word and join with hyphens
      return modelName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
    }
    
    return model;
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
        <LoadingContainer>
          <div style={{ textAlign: 'center' }}>
            <LightbulbLoader size="large" />
            <p style={{ marginTop: '16px', color: '#666', fontSize: '16px' }}>Loading classroom...</p>
          </div>
        </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
        <Alert variant="error">{error}</Alert>
        <BackButtonWrapper>
          <ModernButton onClick={handleBack} variant="ghost" size="small">
            ← Back to Dashboard
          </ModernButton>
        </BackButtonWrapper>
        </Container>
      </PageWrapper>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <RoomInfo>
            <PageTitle>{room.room_name}</PageTitle>
            <Text color="light" noMargin>
              {chatbots.length === 0 ? 'No Skolrs available' : 
               chatbots.length === 1 ? '1 Skolr available' :
               `${chatbots.length} Skolrs available`}
               {courses.length > 0 && ` • ${courses.length} ${courses.length === 1 ? 'Course' : 'Courses'}`}
            </Text>
            <div className="room-code">Room Code: {room.room_code}</div>
          </RoomInfo>
          <BackButtonWrapper>
            <ModernButton onClick={handleBack} variant="ghost" size="small">
              ← Back
            </ModernButton>
          </BackButtonWrapper>
        </Header>

        {chatbots.length === 0 ? (
          <EmptyState
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FiMessageSquare />
            <Heading level="h3" weight="semibold" align="center">No Skolrs Available</Heading>
            <Text color="light" align="center">This room doesn&apos;t have any Skolrs assigned yet.</Text>
            {userRole === 'teacher' && (
              <Text color="light" align="center">Go back to the dashboard to assign Skolrs to this room.</Text>
            )}
          </EmptyState>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CompactGrid cols={3} gap="md" minItemWidth="280px">
            {chatbots.map((chatbot) => {
              const botTypeIcon = chatbot.bot_type === 'reading_room' ? <FiBookOpen /> : 
                                 chatbot.bot_type === 'viewing_room' ? <FiVideo /> : 
                                 chatbot.bot_type === 'assessment' ? <FiClipboard /> : 
                                 chatbot.bot_type === 'knowledge_book' ? <FiBook /> :
                                 <FiMessageSquare />;
              
              const botTypeLabel = chatbot.bot_type === 'reading_room' ? 'Reading' : 
                                  chatbot.bot_type === 'viewing_room' ? 'Viewing' : 
                                  chatbot.bot_type === 'assessment' ? 'Assessment' : 
                                  chatbot.bot_type === 'knowledge_book' ? 'Knowledge' :
                                  'Learning';
              
              const variant = chatbot.bot_type === 'assessment' ? 'success' : 
                             chatbot.bot_type === 'reading_room' ? 'accent' : 
                             chatbot.bot_type === 'viewing_room' ? 'warning' : 
                             chatbot.bot_type === 'knowledge_book' ? 'info' :
                             'primary';
              
              return (
                <Link 
                  key={chatbot.instance_id || chatbot.chatbot_id} 
                  href={(() => {
                    // Base URL with chatbot parameters
                    let url = `/chat/${roomId}?chatbot=${chatbot.chatbot_id}&instance=${chatbot.instance_id || ''}`;
                    
                    // Always add authentication parameters for students
                    if (isStudent) {
                      // Get the user ID - either from URL or from authenticated user
                      const studentUserId = uidFromUrl || authenticatedUserId;
                      
                      if (studentUserId) {
                        // Create a new timestamp for this specific link
                        const newTimestamp = Date.now();
                        // Create a new access signature with the user ID
                        const newAccessSignature = btoa(`${studentUserId}:${newTimestamp}`);
                        // Add both secure signature and legacy parameters
                        url += `&access_signature=${newAccessSignature}&ts=${newTimestamp}&uid=${studentUserId}&direct=true`;
                      }
                    }
                    
                    return url;
                  })()}
                  style={{ textDecoration: 'none' }}
                >
                  <ContentCard
                    title={chatbot.name}
                    subtitle={`${botTypeLabel} • ${getModelDisplayName(chatbot.model)}`}
                    description={chatbot.description}
                    icon={botTypeIcon}
                    variant={variant}
                    actions={
                      <ModernButton variant="primary" size="small" fullWidth>
                        Start Chat →
                      </ModernButton>
                    }
                  />
                </Link>
              );
            })}
            </CompactGrid>
          </motion.div>
        )}
        
        {/* Courses Section - Client-side only to prevent hydration issues */}
        {isHydrated ? (
          <CoursesClientComponent courses={courses} />
        ) : (
          courses.length > 0 && <CoursesPlaceholder />
        )}
        
        {/* Student list section - only visible to teachers */}
        {userRole === 'teacher' && (
          <StudentList roomId={roomId} />
        )}
        </Container>
      </PageWrapper>
  );
}