// src/app/join/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import styled from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Container, Card, Input, Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';

const PageWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.xxl};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
`;

const JoinCard = styled(Card)`
  max-width: 400px;
  margin: 4rem auto;
  text-align: center;
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.brand.primary};
`;

const Form = styled.form`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const RoomCodeInput = styled(Input)`
  text-align: center;
  text-transform: uppercase;
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Text = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LoadingFallback = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.muted};
`;

function JoinPageContent() {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Added for better loading UI
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const checkAuthentication = useCallback(async () => {
    setIsCheckingAuth(true); // Start auth check
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          
          // Check if user is a student
          const { data: studentProfile } = await supabase
            .from('students')
            .select('auth_user_id')
            .eq('auth_user_id', user.id)
            .single();
          
          if (studentProfile) {
            setUserRole('student');
          } else {
            // Check if user is a teacher
            const { data: teacherProfile } = await supabase
              .from('teacher_profiles')
              .select('user_id')
              .eq('user_id', user.id)
              .single();
            
            if (teacherProfile) {
              setUserRole('teacher');
            }
          }
        } else {
            setIsAuthenticated(false);
            setUserRole(null);
        }
    } catch (e) {
        console.error("Error during auth check on join page:", e);
        setIsAuthenticated(false); // Assume not authenticated on error
        setUserRole(null);
    } finally {
        setIsCheckingAuth(false); // End auth check
    }
  }, [supabase]);

  useEffect(() => {
    const codeFromUrl = searchParams?.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
    checkAuthentication();
  }, [searchParams, checkAuthentication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formattedCode = roomCode.toUpperCase();

    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('room_id, is_active')
        .eq('room_code', formattedCode)
        .single();

      if (roomError || !room) {
        throw new Error('Room not found. Please check the code and try again.');
      }

      if (!room.is_active) {
        throw new Error('This room is currently inactive. Please contact your teacher.');
      }

      if (isAuthenticated && userRole === 'student') {
        const response = await fetch('/api/student/join-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_code: formattedCode }),
        });
        const result = await response.json();
        if (!response.ok) {
          // Handle error from standardized response format
          const errorMessage = result.error || result.message || 'Failed to join room. You might already be a member or the room is full.';
          throw new Error(errorMessage);
        }
        // Redirect to student dashboard
        console.log('[Join Page] Student joined successfully, redirecting to /student/dashboard');
        router.push('/student/dashboard'); // <<< MODIFIED LINE
        router.refresh(); // Ensure page reloads to reflect new state if needed
      } else if (!isAuthenticated) {
        console.log('[Join Page] User not authenticated, redirecting to student signup.');
        // The redirect param ensures they come back here with the code after signup/login
        router.push(`/auth?type=student&redirect=/join?code=${formattedCode}`);
      } else if (isAuthenticated && userRole !== 'student') {
         throw new Error('Only student accounts can join rooms this way. Please log in with a student account.');
      } else {
        // This case should ideally not be hit if logic is correct (e.g. authenticated but no role yet)
        // Prompt to re-authenticate or re-check role
        setError('Authentication issue. Please try logging out and back in, or contact support if this persists.');
        console.warn('[Join Page] Unexpected auth state:', {isAuthenticated, userRole});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while trying to join the room.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading UI while checking authentication
  if (isCheckingAuth) {
    return (
        <PageWrapper><Container><JoinCard><Title>Loading...</Title></JoinCard></Container></PageWrapper>
    );
  }


  // If not authenticated, show simplified "Create Account" view
  if (!isAuthenticated) {
    return (
      <PageWrapper>
        <Container>
          <JoinCard>
            <Title>Join Your Class</Title>
            <Text>
              To join the room with code <strong>{roomCode || '...'}</strong>, you&apos;ll need a student account.
            </Text>
            <ModernButton 
              onClick={() => router.push(`/auth?type=student&redirect=/join?code=${roomCode}`)}
              style={{ width: '100%' }}
              size="large"
            >
              Create or Log In to Student Account
            </ModernButton>
            {roomCode && (
              <Text style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                You are trying to join room: <strong>{roomCode}</strong>
              </Text>
            )}
          </JoinCard>
        </Container>
      </PageWrapper>
    );
  }

  // If authenticated (and presumably as a student, though `handleSubmit` re-checks role)
  return (
    <PageWrapper>
      <Container>
        <JoinCard>
          <Title>Join Your Class</Title>
          <Text>Enter the room code your teacher provided, or confirm the code from the link.</Text>
          
          {error && <Alert variant="error">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <RoomCodeInput
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              maxLength={6}
              required
            />
            <ModernButton type="submit" disabled={isLoading} style={{ width: '100%' }} size="large">
              {isLoading ? 'Joining...' : 'Join Class'}
            </ModernButton>
          </Form>
        </JoinCard>
      </Container>
    </PageWrapper>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback>Loading join page...</LoadingFallback>}>
      <JoinPageContent />
    </Suspense>
  );
}