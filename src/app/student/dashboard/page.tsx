// src/app/student/dashboard/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import type { AssessmentStatusEnum } from '@/types/database.types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatsCard as UnifiedStatsCard, ContentCard } from '@/components/ui/UnifiedCards';
import { PageTitle, Heading, Text } from '@/components/ui/Typography';
import { 
  FiUser, 
  FiHome, 
  FiAward, 
  FiBook, 
  FiArrowRight,
  FiLock,
  FiKey,
  FiInfo,
  FiBookOpen,
  FiVideo,
  FiPlus,
  FiChevronRight
} from 'react-icons/fi';

// Fun, quirky welcome messages for students (UK spelling)
const studentWelcomeMessages = [
  "Ready to level up your brain today",
  "Time to unlock some knowledge",
  "Your learning adventure awaits",
  "Let's make those neurons sparkle",
  "Ready to become even more brilliant",
  "Time to feed your curiosity",
  "Another day, another chance to be awesome",
  "Let's turn questions into answers",
  "Your brain is about to thank you",
  "Time to collect some wisdom points",
  "Ready to conquer today's challenges",
  "Let's make learning legendary",
  "Time to power up your mind",
  "Your knowledge quest continues",
  "Ready to discover something amazing",
  "Let's light up those lightbulbs",
  "Time to grow those brain muscles",
  "Ready to ace today's learning",
  "Your favourite subjects are waiting",
  "Time to show what you're made of",
  "Let's unlock today's mysteries",
  "Ready to impress yourself",
  "Time to become a knowledge ninja",
  "Your brain gym is open",
  "Let's collect some achievement badges",
  "Ready to master new skills",
  "Time to explore and discover",
  "Your learning superpowers activate now",
  "Let's solve some puzzles today",
  "Ready to climb the knowledge mountain",
  "Time to fill up your wisdom tank",
  "Your curiosity meter is charging",
  "Let's decode today's lessons",
  "Ready to become unstoppable",
  "Time to unleash your potential",
  "Your brain adventure starts here",
  "Let's make today count",
  "Ready to surprise your teachers",
  "Time to show off those skills",
  "Your learning journey continues",
  "Let's crack the code of knowledge",
  "Ready to level up in real life",
  "Time to become a learning legend",
  "Your mind palace awaits",
  "Let's build something brilliant",
  "Ready to connect the dots",
  "Time to activate study mode",
  "Your future self will thank you",
  "Let's turn confusion into clarity",
  "Ready to expand your horizons",
  "Time to be absolutely brilliant"
];

// Get a different message based on the day
const getDailyStudentWelcome = (name?: string): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const messageIndex = dayOfYear % studentWelcomeMessages.length;
  const message = studentWelcomeMessages[messageIndex];
  
  return name ? `${message}, ${name.split(' ')[0]}!` : `${message}!`;
};

// Get formatted date with fun day name
const getFormattedDate = (): { day: string, date: string } => {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const funDayNames = [
    'Super Sunday',
    'Marvellous Monday', 
    'Terrific Tuesday',
    'Wonderful Wednesday',
    'Thrilling Thursday',
    'Fantastic Friday',
    'Spectacular Saturday'
  ];
  
  const dayIndex = today.getDay();
  const dateStr = today.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return {
    day: funDayNames[dayIndex],
    date: dateStr
  };
};

// Lazy load heavy components
const AssessmentList = dynamic(() => import('@/components/student/AssessmentList'), {
  loading: () => <AssessmentSkeleton />,
  ssr: false
});

// Types
interface DashboardData {
  user: {
    id: string; // This is now the auth_user_id
    student_id: string; // The actual student_id
    full_name: string | null;
    first_name: string | null;
    surname: string | null;
    username?: string | null;
    pin_code?: string | null;
  };
  rooms: Array<{
    room_id: string;
    is_active: boolean;
    joined_at: string;
    chatbot_count: number;
    course_count: number;
    courses: Array<{
      course_id: string;
      title: string;
      description?: string;
      subject?: string;
    }>;
    rooms: {
      id: string;
      name: string;
      room_code: string;
      created_at: string;
      is_active: boolean;
    };
  }>;
  assessments: Array<{
    id: string;
    title: string;
    status: AssessmentStatusEnum;
    score: number | null;
    feedback: string | null;
    created_at: string;
    student_id: string;
    chatbot_id: string;
    chatbots: {
      id: string;
      name: string;
      subject: string | null;
    } | null;
  }>;
  stats: {
    totalRooms: number;
    totalAssessments: number;
    averageScore: number;
    recentActivity: number;
  };
}

// Loading Skeletons
function DashboardSkeleton() {
  return (
    <PageWrapper>
      <Container>
        <LoadingContainer>
          <LoadingSpinner size="large" />
          <LoadingText>Loading your dashboard...</LoadingText>
        </LoadingContainer>
      </Container>
    </PageWrapper>
  );
}

function AssessmentSkeleton() {
  return (
    <SectionCard variant="light">
      <LoadingContainer style={{ minHeight: '200px' }}>
        <LoadingSpinner size="medium" />
      </LoadingContainer>
    </SectionCard>
  );
}

// Styled components - Updated to match teacher dashboard
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%);
  padding: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 40px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-bottom: 32px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: 24px;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 24px;
`;

const Subtitle = styled(Text)`
  font-size: 1rem;
  margin-top: 8px;
`;

const DateSubtext = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 4px 0 0 0;
  
  span {
    color: #111827;
    font-weight: 600;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    gap: 16px;
  }
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoCard = styled(GlassCard)`
  height: 100%;
`;

const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const InfoIcon = styled.div<{ $variant?: 'warning' | 'info' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $variant }) => 
    $variant === 'warning' ? '#FEF3C7' : '#E0E7FF'};
  color: ${({ $variant }) => 
    $variant === 'warning' ? '#F59E0B' : '#6366F1'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const InfoTitle = styled(Heading)`
  font-size: 1.125rem;
`;

const InfoText = styled(Text)`
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  
  strong {
    color: #374151;
    font-weight: 600;
  }
`;


const SectionCard = styled(GlassCard)`
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;










const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6B7280;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: #F3F4F6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  
  svg {
    width: 40px;
    height: 40px;
  }
`;

const EmptyStateText = styled(Text)`
  font-size: 1rem;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6B7280;
  font-size: 1rem;
`;

const JoinRoomCard = styled(GlassCard)`
  background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%);
  border: 2px solid #D8B4FE;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }
`;

const JoinRoomForm = styled.form`
  margin-top: 16px;
  position: relative;
  z-index: 1;
`;

const RoomCodeInput = styled.input`
  width: 100%;
  padding: 14px 20px;
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2px;
  text-transform: uppercase;
  border: 2px solid #D8B4FE;
  border-radius: 12px;
  background: white;
  color: #7C3AED;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  
  &::placeholder {
    color: #D8B4FE;
    letter-spacing: 1px;
    text-transform: none;
  }
`;

const JoinError = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #DC2626;
  font-size: 0.875rem;
  text-align: center;
`;

const JoinSuccess = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #D1FAE5;
  border: 1px solid #A7F3D0;
  border-radius: 8px;
  color: #059669;
  font-size: 0.875rem;
  text-align: center;
  font-weight: 500;
`;

// Main component
export default function StudentDashboardPage() {
  const [user, setUser] = useState<DashboardData['user'] | null>(null);
  const [rooms, setRooms] = useState<DashboardData['rooms']>([]);
  const [assessments, setAssessments] = useState<DashboardData['assessments']>([]);
  const [stats, setStats] = useState<DashboardData['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  const router = useRouter();
  
  // Get student ID from various sources
  const getStudentId = () => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('user_id');
    const urlUid = urlParams.get('uid');
    
    let decodedUserId = null;
    const accessSignature = urlParams.get('access_signature');
    const timestamp = urlParams.get('ts');
    
    if (accessSignature && timestamp) {
      try {
        const decoded = atob(accessSignature);
        const [userId, signatureTimestamp] = decoded.split(':');
        if (signatureTimestamp === timestamp) {
          decodedUserId = userId;
        }
      } catch (e) {
        console.error('Failed to decode access signature:', e);
      }
    }
    
    const storedDirectId = localStorage.getItem('student_direct_access_id');
    const storedCurrentId = localStorage.getItem('current_student_id');
    const storedPinLoginId = localStorage.getItem('direct_pin_login_user');
    
    const id = decodedUserId || urlUserId || urlUid || storedDirectId || storedCurrentId || storedPinLoginId;
    
    if (id) {
      localStorage.setItem('student_direct_access_id', id);
      localStorage.setItem('current_student_id', id);
    }
    
    return id;
  };
  
  // Handle room join
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !user) return;
    
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(false);
    
    try {
      const response = await fetch('/api/student/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_code: roomCode.toUpperCase().trim(),
          student_id: user.student_id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room');
      }
      
      setJoinSuccess(true);
      setRoomCode('');
      
      // Reload dashboard after a short delay
      setTimeout(() => {
        loadDashboard();
        setJoinSuccess(false);
      }, 2000);
      
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  };
  
  // Load all dashboard data
  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // No need to get student ID - the API will use the authenticated session
      const response = await fetch('/api/student/dashboard-all', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/student-access');
          throw new Error('Not authenticated. Please log in.');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to load dashboard');
      }
      
      const data = await response.json();
      
      console.log('[Student Dashboard] Data loaded successfully:', {
        hasUser: !!data.user,
        roomCount: data.rooms?.length || 0,
        assessmentCount: data.assessments?.length || 0
      });
      
      setUser(data.user);
      setRooms(data.rooms);
      setAssessments(data.assessments);
      setStats(data.stats);
      
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  
  // Enter a specific room
  const enterRoom = (roomId: string) => {
    // Include authentication parameters for better compatibility
    if (user?.id) {
      const timestamp = Date.now();
      const accessSignature = btoa(`${user.id}:${timestamp}`);
      router.push(`/room/${roomId}?access_signature=${accessSignature}&ts=${timestamp}&uid=${user.id}`);
    } else {
      router.push(`/room/${roomId}`);
    }
  };
  
  // Load dashboard on mount
  useEffect(() => {
    console.log('[Student Dashboard] Component mounted, loading dashboard...');
    loadDashboard();
  }, []);
  
  // Show skeleton while loading
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  // Error state
  if (error || !user || !stats) {
    return (
      <PageWrapper>
        <Container>
          <Alert variant="error" style={{ marginBottom: '16px' }}>{error || 'Failed to load dashboard'}</Alert>
          <ModernButton onClick={() => loadDashboard()} variant="primary">
            Retry
          </ModernButton>
        </Container>
      </PageWrapper>
    );
  }
  
  const isAnonymousUser = !user.pin_code || !user.username;
  
  // Main dashboard content
  return (
    <PageWrapper>
      <Container>
        <Header>
          <WelcomeSection>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <PageTitle>{getDailyStudentWelcome(user.first_name || user.full_name || 'Student')}</PageTitle>
              <DateSubtext>
                It's <span>{getFormattedDate().day}</span>, {getFormattedDate().date}
              </DateSubtext>
              <Subtitle color="light">
                {stats.totalRooms > 0 
                  ? `You're enrolled in ${stats.totalRooms} ${stats.totalRooms === 1 ? 'classroom' : 'classrooms'}`
                  : "You'll see your classrooms here once your teacher adds you."
                }
              </Subtitle>
            </motion.div>
          </WelcomeSection>
        </Header>

        <StatsGrid>
          <UnifiedStatsCard
            icon={<FiHome />}
            title="Classrooms"
            value={stats.totalRooms}
            variant="primary"
          />
          
          <UnifiedStatsCard
            icon={<FiAward />}
            title="Assessments"
            value={stats.totalAssessments}
            variant="secondary"
          />
          
          <UnifiedStatsCard
            icon={<FiBook />}
            title="Average Score"
            value={`${stats.averageScore}%`}
            variant="success"
          />
          
          <UnifiedStatsCard
            icon={<FiUser />}
            title="Recent Activities"
            value={stats.recentActivity}
            variant="warning"
          />
        </StatsGrid>
      
        <TopRow>
          {/* Account Information */}
          <InfoCard variant="light">
            {isAnonymousUser ? (
              <>
                <InfoHeader>
                  <InfoIcon $variant="warning">
                    <FiLock />
                  </InfoIcon>
                  <InfoTitle level="h3" weight="semibold" noMargin>Secure Your Account</InfoTitle>
                </InfoHeader>
                <InfoText color="light">
                  Your account is currently only accessible on this device.
                </InfoText>
                <InfoText color="light">
                  Create a PIN code to access your classrooms from any device and never lose your progress.
                </InfoText>
                <ModernButton 
                  onClick={() => router.push('/student/pin-setup')}
                  variant="primary" 
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  <FiKey />
                  Create PIN Code
                </ModernButton>
              </>
            ) : (
              <>
                <InfoHeader>
                  <InfoIcon>
                    <FiInfo />
                  </InfoIcon>
                  <InfoTitle level="h3" weight="semibold" noMargin>Account Details</InfoTitle>
                </InfoHeader>
                <InfoDetail>
                  <strong>Username:</strong> {user.username}
                </InfoDetail>
                <InfoDetail>
                  <strong>PIN Code:</strong> {user.pin_code}
                </InfoDetail>
                <InfoText color="light">
                  <span style={{ display: 'block', marginTop: '16px', fontSize: '0.75rem' }}>
                    Use these credentials to log in from any device
                  </span>
                </InfoText>
              </>
            )}
          </InfoCard>
          
          {/* Join Room Card */}
          <JoinRoomCard variant="light">
            <InfoHeader>
              <InfoIcon>
                <FiPlus />
              </InfoIcon>
              <InfoTitle level="h3" weight="semibold" noMargin>Join a Classroom</InfoTitle>
            </InfoHeader>
            <InfoText color="default">
              Have a room code from your teacher? Enter it below to join their classroom.
            </InfoText>
            
            <JoinRoomForm onSubmit={handleJoinRoom}>
              <RoomCodeInput
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={joinLoading}
                required
              />
              <ModernButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={joinLoading || !roomCode.trim()}
                style={{ marginTop: '12px' }}
              >
                {joinLoading ? 'Joining...' : 'Join Classroom'}
              </ModernButton>
            </JoinRoomForm>
            
            {joinError && (
              <JoinError>{joinError}</JoinError>
            )}
            
            {joinSuccess && (
              <JoinSuccess>
                Successfully joined classroom! Refreshing...
              </JoinSuccess>
            )}
          </JoinRoomCard>
        </TopRow>
      
        {/* My Classrooms */}
        <SectionCard variant="light">
          <SectionHeader>
            <Heading level="h2" weight="semibold" noMargin>My Classrooms</Heading>
          </SectionHeader>
          {rooms.length > 0 ? (
            <RoomGrid>
              {rooms.map((room) => {
                const roomDescription = [
                  `${room.chatbot_count} ${room.chatbot_count === 1 ? 'Skolr' : 'Skolrs'}`,
                  room.course_count > 0 ? `${room.course_count} ${room.course_count === 1 ? 'Course' : 'Courses'}` : null
                ].filter(Boolean).join(' • ');

                return (
                  <ContentCard
                    key={room.room_id}
                    title={room.rooms.name}
                    subtitle={`Room Code: ${room.rooms.room_code}`}
                    description={roomDescription}
                    icon={<FiHome />}
                    variant="primary"
                    onClick={() => enterRoom(room.room_id)}
                    metadata={room.courses && room.courses.length > 0 ? 
                      room.courses.slice(0, 3).map(course => ({
                        label: "Course",
                        value: course.title,
                        icon: <FiBookOpen />
                      })) : undefined
                    }
                    actions={
                      <ModernButton 
                        variant="primary" 
                        size="small" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          enterRoom(room.room_id);
                        }}
                      >
                        Enter Classroom →
                      </ModernButton>
                    }
                  />
                );
              })}
            </RoomGrid>
          ) : (
            <EmptyState>
              <EmptyStateIcon>
                <FiHome />
              </EmptyStateIcon>
              <EmptyStateText color="light" noMargin>
                You haven't been added to any classrooms yet. Your teacher will add you when they're ready.
              </EmptyStateText>
            </EmptyState>
          )}
        </SectionCard>
      
        {/* Assessments */}
        {assessments.length > 0 && (
          <div id="assessments">
            <Suspense fallback={<AssessmentSkeleton />}>
              <AssessmentList assessments={assessments.map(a => ({
                assessment_id: a.id,
                room_id: (a as any).room_id || '',
                room_name: (a as any).room_name || null,
                chatbot_id: a.chatbot_id,
                chatbot_name: a.chatbots?.name || null,
                ai_grade_raw: typeof a.score === 'number' ? a.score.toString() : a.score || null,
                ai_feedback_student: a.feedback,
                assessed_at: a.created_at,
                status: a.status,
                teacher_override_grade: null,
                teacher_override_notes: null
              }))} />
            </Suspense>
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}