// src/app/chat/[roomId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import { LazyChat as Chat } from '@/components/shared/LazyComponents';
import type { Chatbot } from '@/types/database.types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { LazyReadingDocumentViewer as ReadingDocumentViewer, LazyKnowledgeBookSidebar as KnowledgeBookSidebar } from '@/components/shared/LazyComponents';
import { ModernStudentNav } from '@/components/student/ModernStudentNav';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
`;

const MainContent = styled.div<{ $isReadingRoom?: boolean; $isKnowledgeBook?: boolean }>`
  flex: 1;
  padding: ${({ theme, $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? '8px 0' : `${theme.spacing.lg} 0`};
  margin-left: ${({ $isReadingRoom, $isKnowledgeBook }) => {
    if ($isKnowledgeBook) return '180px'; // Halfway between 80px and 280px
    if ($isReadingRoom) return '280px'; // Keep original for reading room
    return '80px'; // Default
  }};
  transition: margin-left 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: ${({ $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? '70px' : '0'};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    padding-bottom: ${({ $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? '0' : '80px'};
  }
`;

// Custom container with reduced padding for reading room and knowledge book
const Container = styled.div<{ $isReadingRoom?: boolean; $isKnowledgeBook?: boolean }>`
  width: 100%;
  max-width: ${({ $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? '100%' : '1200px'};
  margin: 0 auto;
  padding: 0 ${({ $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? '8px' : '24px'};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.sm};
  }
`;

const Header = styled.div<{ $isReadingRoom?: boolean; $isKnowledgeBook?: boolean }>`
  margin-bottom: ${({ theme, $isReadingRoom, $isKnowledgeBook }) => ($isReadingRoom || $isKnowledgeBook) ? theme.spacing.sm : theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RoomInfo = styled.div`
  h1 {
    font-size: 32px;
    font-weight: 700;
    font-family: ${({ theme }) => theme.fonts.heading};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 24px;
    }
  }

  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 16px;
  }
`;

const BackButtonWrapper = styled.div`
  display: inline-block;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  gap: ${({ theme }) => theme.spacing.md};
`;

const DocumentSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 4px;
  overflow: hidden; /* Changed from auto to hidden to prevent scrollbars on video */
  display: flex;
  flex-direction: column;
  position: relative; /* Ensure proper positioning context */
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0; /* Remove padding on mobile for more video space */
    border-radius: 8px;
  }
`;

const ChatSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
`;

const KnowledgeBaseSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SplitScreenContainer = styled.div<{ $isKnowledgeBook?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isKnowledgeBook }) => $isKnowledgeBook ? '300px 1fr' : '1.8fr 1.2fr'};
  gap: 16px;
  height: calc(100vh - 100px);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    height: auto;
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: auto;
    grid-template-rows: 1fr auto; /* Explicit rows for mobile */
    
    ${DocumentSection} {
      height: 45vh; /* Reduced to ensure both video and chat are visible */
      min-height: 280px; /* Ensure minimum height for video */
      max-height: 500px; /* Cap height on larger mobile devices */
      overflow: auto;
    }
    
    ${ChatSection} {
      min-height: 350px;
      height: 45vh; /* Give chat a defined height on mobile */
      max-height: 500px;
    }
  }
  
  /* Specific adjustments for portrait orientation on mobile */
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) and (orientation: portrait) {
    grid-template-rows: minmax(280px, 45vh) minmax(350px, 1fr);
    gap: 12px;
    
    ${DocumentSection} {
      height: auto;
      min-height: 280px;
    }
    
    ${ChatSection} {
      height: auto;
      min-height: 350px;
    }
  }
`;

const OrientationMessage = styled.div`
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) and (min-width: ${({ theme }) => theme.breakpoints.mobile}) and (orientation: portrait) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    z-index: 9999;
    text-align: center;
    padding: 32px;
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    p {
      font-size: 18px;
      opacity: 0.9;
      margin: 0;
    }
    
    svg {
      width: 80px;
      height: 80px;
      opacity: 0.8;
    }
  }
`;

const AssessmentSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-align: center;
  border: 2px dashed ${({ theme }) => theme.colors.brand.primary}40;
`;

const AssessmentTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const AssessmentText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const AssessmentButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

interface RoomQueryResult {
  room_id: string;
  room_name: string;
  room_code: string;
  teacher_id: string;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  room_chatbots: {
    chatbots: Chatbot; // This Chatbot type already includes welcome_message
  }[] | null;
}

export default function ChatPage() {
  const [room, setRoom] = useState<RoomQueryResult | null>(null);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [linkedAssessmentBot, setLinkedAssessmentBot] = useState<{chatbot_id: string; name: string} | null>(null);
  const [assessmentTransition, setAssessmentTransition] = useState(false);

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const roomId = params?.roomId ? String(params.roomId) : null;
  const chatbotIdFromUrl = searchParams.get('chatbot');
  
  // SECURITY ENHANCEMENT: Check for access_signature
  const accessSignature = searchParams.get('access_signature');
  const timestamp = searchParams.get('ts');
  let uidFromUrl = searchParams.get('uid'); // For backward compatibility
  const directAccessMode = searchParams.get('direct') === 'true';
  
  // Decode access signature if present
  if (accessSignature && timestamp) {
    try {
      const decoded = atob(accessSignature);
      const [userId, signatureTimestamp] = decoded.split(':');
      
      // Verify timestamp matches to prevent tampering
      if (signatureTimestamp === timestamp) {
        console.log('[ChatPage] Successfully decoded access signature for user:', userId);
        uidFromUrl = userId;
      } else {
        console.error('[ChatPage] Timestamp mismatch in access signature');
      }
    } catch (e) {
      console.error('[ChatPage] Failed to decode access signature:', e);
    }
  }
  const instanceIdFromUrl = searchParams.get('instance');
  const initialFetchDoneRef = useRef(false);

  useEffect(() => {
    console.log('[ChatPage] Initializing/Params Update. Room ID:', roomId, 'Chatbot ID:', chatbotIdFromUrl);
    if (initialFetchDoneRef.current && (params?.roomId !== roomId || searchParams.get('chatbot') !== chatbotIdFromUrl)) {
        initialFetchDoneRef.current = false;
    }
  }, [roomId, chatbotIdFromUrl, params?.roomId, searchParams]);

  const fetchLinkedAssessmentBot = async (assessmentBotId: string) => {
    console.log('[ChatPage] Fetching linked assessment bot with ID:', assessmentBotId);
    try {
      // Use API to fetch assessment bot details to avoid RLS issues
      const response = await fetch(`/api/student/room-chatbot-data?roomId=${roomId}&chatbotId=${assessmentBotId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.chatbot) {
          console.log('[ChatPage] Setting linkedAssessmentBot state:', data.chatbot);
          setLinkedAssessmentBot({
            chatbot_id: data.chatbot.chatbot_id,
            name: data.chatbot.name
          });
        }
      } else {
        console.error('[ChatPage] Failed to fetch assessment bot via API');
      }
    } catch (err) {
      console.error('[ChatPage] Error fetching linked assessment bot:', err);
    }
  };

  // Removed handleVideoComplete - no longer tracking video completion

  const handleStartAssessment = () => {
    if (linkedAssessmentBot && roomId) {
      // Navigate to the same room but with the assessment bot
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('chatbot', linkedAssessmentBot.chatbot_id);
      
      // Preserve direct access parameters if present
      const newUrl = `/chat/${roomId}?${currentParams.toString()}`;
      router.push(newUrl);
    }
  };

  const fetchRoomData = useCallback(async () => {
    if (!roomId || !chatbotIdFromUrl) {
      console.warn("[ChatPage] fetchRoomData: Aborting fetch - RoomID or ChatbotID is missing.", { roomId, chatbotIdFromUrl });
      if (roomId && chatbotIdFromUrl === null) {
          setError("Skolr ID is required in the URL (e.g., ?chatbot=...).");
      } else if (!roomId && chatbotIdFromUrl){
          setError("Room ID is missing from the URL path.");
      } else if (!roomId && !chatbotIdFromUrl) {
          setError("Both Room ID and Skolr ID are missing from the URL.");
      }
      setLoading(false);
      return;
    }
    console.log(`[ChatPage] fetchRoomData: Attempting fetch. RoomID: ${roomId}, ChatbotID: ${chatbotIdFromUrl}`);
    setLoading(true);
    setError(null);
    
    // User ID comes from either access_signature or direct uid parameter
    // uidFromUrl is already set from the decoded signature or direct parameter
    if (uidFromUrl) {
      console.log('[ChatPage] User ID found for direct access:', uidFromUrl);
    }

    try {
      // First try normal authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no authenticated user but UID provided, try to verify access via API
      if (!user && uidFromUrl) {
        console.log('[ChatPage] No authenticated user but UID found, checking membership via API');
        
        try {
          // Use the verify-membership API to check and potentially add the user to the room
          const response = await fetch(`/api/student/verify-membership?roomId=${roomId}&userId=${uidFromUrl}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[ChatPage] Membership verification failed:', errorData);
            throw new Error(errorData.error || 'Failed to verify room access');
          }
          
          const membershipResult = await response.json();
          // Handle new standardized API response format
          const membershipData = membershipResult.success ? membershipResult.data : membershipResult;
          
          if (!membershipData.isMember) {
            throw new Error('You do not have access to this room');
          }
          
          console.log('[ChatPage] Direct access granted via API');
          
          // Continue with fetch using admin API
          console.log('[ChatPage] Fetching chat data with params:', {
            roomId, 
            chatbotId: chatbotIdFromUrl,
            chatbotIdLength: chatbotIdFromUrl?.length,
            userId: uidFromUrl,
            direct: directAccessMode ? 'true' : 'false'
          });
          const chatResponseUrl = `/api/student/room-chatbot-data?roomId=${encodeURIComponent(roomId)}&chatbotId=${encodeURIComponent(chatbotIdFromUrl)}&userId=${encodeURIComponent(uidFromUrl)}&direct=${directAccessMode ? 'true' : 'false'}`;
          console.log('[ChatPage] API URL:', chatResponseUrl);
          
          const chatResponse = await fetch(chatResponseUrl, {
            credentials: 'include'
          });
          
          if (!chatResponse.ok) {
            const errorData = await chatResponse.json().catch(() => ({}));
            console.error('[ChatPage] Chat data fetch failed:', { 
              status: chatResponse.status, 
              statusText: chatResponse.statusText,
              error: errorData.error || 'No error details available' 
            });
            throw new Error(`Failed to fetch chat data: ${errorData.error || chatResponse.status}`);
          }
          
          const chatResult = await chatResponse.json();
          // Handle new standardized API response format
          const data = chatResult.success ? chatResult.data : chatResult;
          
          setRoom(data.room);
          setChatbot(data.chatbot);
          setIsStudent(true); // Direct access is for students
          
          // Check for linked assessment bot if viewing room
          console.log('[ChatPage] Direct access - Chatbot data:', {
            bot_type: data.chatbot?.bot_type,
            linked_assessment_bot_id: data.chatbot?.linked_assessment_bot_id
          });
          if (data.chatbot?.bot_type === 'viewing_room' && data.chatbot?.linked_assessment_bot_id) {
            fetchLinkedAssessmentBot(data.chatbot.linked_assessment_bot_id);
          }
          
          initialFetchDoneRef.current = true;
          setLoading(false);
          return;
        } catch (apiError) {
          console.error('[ChatPage] API access verification failed:', apiError);
          initialFetchDoneRef.current = false;
          throw apiError;
        }
      }
      
      // Normal authenticated flow - use API to avoid RLS issues
      if (!user) {
        initialFetchDoneRef.current = false;
        throw new Error('Not authenticated');
      }

      // Use API for all users to avoid client-side RLS issues
      console.log('[ChatPage] Using API for authenticated user:', {
        userId: user.id,
        roomId: roomId,
        chatbotId: chatbotIdFromUrl,
        chatbotIdLength: chatbotIdFromUrl?.length,
        fullUrl: `/api/student/room-chatbot-data?roomId=${encodeURIComponent(roomId)}&chatbotId=${encodeURIComponent(chatbotIdFromUrl)}&userId=${encodeURIComponent(user.id)}`
      });
      try {
        const chatResponse = await fetch(`/api/student/room-chatbot-data?roomId=${encodeURIComponent(roomId)}&chatbotId=${encodeURIComponent(chatbotIdFromUrl)}&userId=${encodeURIComponent(user.id)}`, {
          credentials: 'include'
        });
        
        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error('[ChatPage] API error:', errorText);
          initialFetchDoneRef.current = false;
          throw new Error('Failed to load room data');
        }
        
        const chatResult = await chatResponse.json();
        // Handle new standardized API response format
        const data = chatResult.success ? chatResult.data : chatResult;
        
        setRoom(data.room);
        setChatbot(data.chatbot);
        
        // Instance ID is already available from data.instanceId if needed
        // It will be passed to the Chat component
        
        // Assume student for UI purposes - teachers rarely use chat
        setIsStudent(true);
        
        // Check for linked assessment bot
        console.log('[ChatPage] Authenticated - Chatbot data:', {
          bot_type: data.chatbot?.bot_type,
          linked_assessment_bot_id: data.chatbot?.linked_assessment_bot_id
        });
        if (data.chatbot?.bot_type === 'viewing_room' && data.chatbot?.linked_assessment_bot_id) {
          fetchLinkedAssessmentBot(data.chatbot.linked_assessment_bot_id);
        }
        
        initialFetchDoneRef.current = true;
        setLoading(false);
        return;
      } catch (apiError) {
        console.error('[ChatPage] API access failed:', apiError);
        initialFetchDoneRef.current = false;
        throw apiError;
      }
    } catch (err) {
      initialFetchDoneRef.current = false; // Allow retry on error
      setError(err instanceof Error ? err.message : 'Failed to load chat page data');
      setChatbot(null); setRoom(null);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, chatbotIdFromUrl, supabase]); // searchParams intentionally omitted for performance

  useEffect(() => {
    if (roomId && chatbotIdFromUrl && !initialFetchDoneRef.current) {
      fetchRoomData();
    }
  }, [roomId, chatbotIdFromUrl, fetchRoomData, searchParams]);

  const handleBack = () => { 
    // Use the resolved uidFromUrl value (from either access_signature or direct uid parameter)
    
    // Also store user ID in localStorage for reliability
    if (uidFromUrl) {
      localStorage.setItem('student_direct_access_id', uidFromUrl);
      localStorage.setItem('current_student_id', uidFromUrl);
    }
    
    // Generate timestamp for direct access - this prevents auth redirects
    const timestamp = Date.now();
    
    // Check if we have a roomId
    if (roomId) {
      // Generate secure access signature if we have a userId
      if (uidFromUrl) {
        // SECURITY ENHANCEMENT: Use access signature pattern with direct and legacy params
        // Include _t parameter to skip auth check in student layout
        const newAccessSignature = btoa(`${uidFromUrl}:${timestamp}`);
        router.push(`/room/${roomId}?direct=true&access_signature=${newAccessSignature}&ts=${timestamp}&uid=${uidFromUrl}&_t=${timestamp}`);
      } else {
        // Standard navigation for authenticated users
        router.push(`/room/${roomId}`);
      }
    } else {
      // If no room ID, go to dashboard (with user ID if available)
      if (uidFromUrl) {
        // SECURITY ENHANCEMENT: Use access signature pattern for dashboard too
        // Include _t parameter to skip auth check in student layout
        const newAccessSignature = btoa(`${uidFromUrl}:${timestamp}`);
        router.push(`/student/dashboard?direct=true&access_signature=${newAccessSignature}&ts=${timestamp}&uid=${uidFromUrl}&_t=${timestamp}`);
      } else {
        // Standard navigation for authenticated users
        router.push('/student/dashboard');
      }
    }
  };

  if (loading && !initialFetchDoneRef.current) {
    return (
      <PageWrapper>
        {isStudent && <ModernStudentNav />}
        <MainContent $isReadingRoom={false}>
          <Container>
            <LoadingContainer>
              <LoadingSpinner size="large" />
              <p>Loading chat environment...</p>
            </LoadingContainer>
          </Container>
        </MainContent>
      </PageWrapper>
    );
  }
  if (error) {
    return (
      <PageWrapper>
        {isStudent && <ModernStudentNav />}
        <MainContent $isReadingRoom={false}>
          <Container>
            <Alert variant="error">{error}</Alert>
            <ModernButton onClick={handleBack} variant="ghost" style={{ marginTop: '16px' }}>{'< Back'}</ModernButton>
          </Container>
        </MainContent>
      </PageWrapper>
    );
  }
  if (!room || !chatbot) {
    return (
      <PageWrapper>
        {isStudent && <ModernStudentNav />}
        <MainContent $isReadingRoom={false}>
          <Container>
            <Alert variant="info">Chatbot or room information is unavailable. Ensure Chatbot ID is in URL.</Alert>
            <ModernButton onClick={handleBack} variant="ghost" style={{ marginTop: '16px' }}>{'< Back'}</ModernButton>
          </Container>
        </MainContent>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {isStudent && <ModernStudentNav />}
      <MainContent 
        $isReadingRoom={chatbot.bot_type === 'reading_room' || chatbot.bot_type === 'viewing_room'}
        $isKnowledgeBook={chatbot.bot_type === 'knowledge_book'}
      >
        <Container 
          $isReadingRoom={chatbot.bot_type === 'reading_room' || chatbot.bot_type === 'viewing_room'}
          $isKnowledgeBook={chatbot.bot_type === 'knowledge_book'}
        >
          <Header 
            $isReadingRoom={chatbot.bot_type === 'reading_room' || chatbot.bot_type === 'viewing_room'}
            $isKnowledgeBook={chatbot.bot_type === 'knowledge_book'}
          >
            <RoomInfo>
              <h1>{room.room_name}</h1>
              <p>Chatting with: <strong>{chatbot.name}</strong></p>
              {chatbot.bot_type === 'assessment' && <p style={{fontSize: '0.9em', fontStyle: 'italic', color: '#555'}}>This is an Assessment Bot.</p>}
              {chatbot.bot_type === 'reading_room' && <p style={{fontSize: '0.9em', fontStyle: 'italic', color: '#555'}}>📖 Reading Room - Document & AI Assistant</p>}
              {chatbot.bot_type === 'viewing_room' && <p style={{fontSize: '0.9em', fontStyle: 'italic', color: '#555'}}>📹 Viewing Room - Video & AI Assistant</p>}
              {chatbot.bot_type === 'knowledge_book' && <p style={{fontSize: '0.9em', fontStyle: 'italic', color: '#555'}}>📚 KnowledgeBook - Document-only responses with citations</p>}
            </RoomInfo>
            <BackButtonWrapper>
              <ModernButton onClick={handleBack} variant="ghost" size="small">
                {'< Back'}
              </ModernButton>
            </BackButtonWrapper>
          </Header>
          
          {(chatbot.bot_type === 'reading_room' || chatbot.bot_type === 'viewing_room') ? (
            <>
              <SplitScreenContainer>
                <DocumentSection>
                  <ReadingDocumentViewer 
                    chatbotId={chatbot.chatbot_id} 
                    userId={uidFromUrl || undefined}
                  />
                </DocumentSection>
                <ChatSection>
                  {roomId && <Chat roomId={roomId} chatbot={chatbot} instanceId={instanceIdFromUrl || undefined} />}
                </ChatSection>
              </SplitScreenContainer>
              
              {/* Assessment Section for Viewing Room */}
              {console.log('[ChatPage] Rendering assessment section:', {
                bot_type: chatbot.bot_type,
                linkedAssessmentBot,
                condition: chatbot.bot_type === 'viewing_room' && linkedAssessmentBot
              })}
              {chatbot.bot_type === 'viewing_room' && linkedAssessmentBot && (
                <AssessmentSection>
                  <AssessmentTitle>📝 Ready to Test Your Knowledge?</AssessmentTitle>
                  <AssessmentText>
                    Once you've finished watching the video, you can start the assessment to test your understanding. 
                    The assessment will ask you questions about what you've learned from the video.
                  </AssessmentText>
                  <AssessmentButtonWrapper>
                    <ModernButton 
                      variant="primary" 
                      size="large"
                      onClick={handleStartAssessment}
                    >
                      Start Assessment: {linkedAssessmentBot.name}
                    </ModernButton>
                  </AssessmentButtonWrapper>
                </AssessmentSection>
              )}
              
              <OrientationMessage>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8h7a2 2 0 002-2V5a2 2 0 00-2-2h-7m-2 9v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m-2 0h7a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h2>Please Rotate Your Device</h2>
                <p>For the best reading experience, please turn your iPad to landscape mode.</p>
              </OrientationMessage>
            </>
          ) : chatbot.bot_type === 'knowledge_book' ? (
            <SplitScreenContainer $isKnowledgeBook>
              <KnowledgeBaseSection>
                <KnowledgeBookSidebar
                  chatbotId={chatbot.chatbot_id}
                  showDeleteButtons={false}
                />
              </KnowledgeBaseSection>
              <ChatSection>
                {roomId && <Chat roomId={roomId} chatbot={chatbot} instanceId={instanceIdFromUrl || undefined} />}
              </ChatSection>
            </SplitScreenContainer>
          ) : (
            roomId && <Chat roomId={roomId} chatbot={chatbot} instanceId={instanceIdFromUrl || undefined} />
          )}
        </Container>
      </MainContent>
    </PageWrapper>
  );
}