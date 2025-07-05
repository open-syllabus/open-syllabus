// src/app/teacher-dashboard/chatbots/[chatbotId]/knowledge-book/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ModernButton } from '@/components/shared/ModernButton';
import { GlassCard } from '@/components/shared/GlassCard';
import { PageTransition } from '@/components/shared/PageTransition';
import Chat from '@/components/shared/Chat';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import KnowledgeBookSidebar from '@/components/teacher/KnowledgeBookSidebar';
import AddKnowledgeModal from '@/components/teacher/AddKnowledgeModal';
import type { Chatbot, Document as KnowledgeDocument } from '@/types/database.types';

const PageWrapper = styled.div`
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelPink}10 0%, 
    ${({ theme }) => theme.colors.ui.pastelPurple}10 50%, 
    ${({ theme }) => theme.colors.ui.pastelBlue}10 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -20%;
    width: 40%;
    height: 40%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
      transparent 70%);
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    right: -20%;
    width: 40%;
    height: 40%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelGreen}20 0%, 
      transparent 70%);
    opacity: 0.3;
    animation: float 25s ease-in-out infinite reverse;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }
`;

const Container = styled.div`
  height: 100vh;
  display: flex;
  position: relative;
  z-index: 1;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.3rem;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow: hidden;
  position: relative;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  color: ${({ theme }) => theme.colors.brand.primary};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.2rem;
  
  &::before {
    content: '📚';
    font-size: 3rem;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  
  h2 {
    color: ${({ theme }) => theme.colors.status.danger};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-family: ${({ theme }) => theme.fonts.heading};
  }
  
  p {
    color: ${({ theme }) => theme.colors.text.muted};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    font-family: ${({ theme }) => theme.fonts.body};
  }
`;

const BackButton = styled(ModernButton)`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 14px;
    padding: 8px 16px;
    white-space: nowrap;
  }
`;

export default function KnowledgeBookPage() {
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const chatbotId = params?.chatbotId as string;
  
  // Define a consistent room ID for KnowledgeBook interface
  const knowledgeBookRoomId = `knowledge_book_${chatbotId}`;

  const fetchChatbotData = useCallback(async () => {
    if (!chatbotId) {
      setError("Chatbot ID is missing.");
      setLoading(false);
      return;
    }
    
    try {
      // Check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication expired. Please log in again.');
      }
      
      // Fetch chatbot data
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch chatbot data (status ${response.status})`);
      }
      
      const chatbotData = await response.json();
      
      // Check if this is a KnowledgeBook type
      if (chatbotData.bot_type !== 'knowledge_book') {
        throw new Error('This interface is only available for KnowledgeBook type chatbots.');
      }
      
      setChatbot(chatbotData);
      
      // Fetch documents
      await fetchDocuments();
      
    } catch (err) {
      console.error('Error fetching chatbot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load KnowledgeBook.');
    } finally {
      setLoading(false);
    }
  }, [chatbotId, supabase]);

  const fetchDocuments = useCallback(async () => {
    if (!chatbotId) return;
    
    try {
      const response = await fetch(`/api/teacher/documents?chatbotId=${chatbotId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch documents');
      }
      const data: KnowledgeDocument[] = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [chatbotId]);

  useEffect(() => {
    fetchChatbotData();
  }, [fetchChatbotData]);

  const handleDocumentAdded = () => {
    setShowAddModal(false);
    fetchDocuments();
  };

  const handleDocumentDeleted = () => {
    fetchDocuments();
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingContainer>
          <LoadingSpinner />
          <p>Loading KnowledgeBook...</p>
        </LoadingContainer>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <ErrorContainer>
          <h2>Error</h2>
          <p>{error}</p>
          <BackButton onClick={() => router.push('/teacher-dashboard/chatbots')} variant="primary">
            Back to Chatbots
          </BackButton>
        </ErrorContainer>
      </PageWrapper>
    );
  }

  if (!chatbot) {
    return (
      <PageWrapper>
        <ErrorContainer>
          <h2>KnowledgeBook Not Found</h2>
          <p>The requested KnowledgeBook could not be found.</p>
          <BackButton onClick={() => router.push('/teacher-dashboard/chatbots')} variant="primary">
            Back to Chatbots
          </BackButton>
        </ErrorContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageTransition>
        <Container>
          <KnowledgeBookSidebar
            chatbotId={chatbotId}
          />
          
          <MainContent>
            <Header>
              <Title>{chatbot.name}</Title>
              <BackButton 
                variant="ghost" 
                size="medium"
                onClick={() => router.push(`/teacher-dashboard/chatbots/${chatbotId}/edit`)}
              >
                ← Back to Settings
              </BackButton>
            </Header>
            
            <ChatContainer>
              <Chat 
                roomId={knowledgeBookRoomId} 
                chatbot={chatbot}
              />
            </ChatContainer>
          </MainContent>
          
          {showAddModal && (
            <AddKnowledgeModal
              chatbotId={chatbotId}
              onClose={() => setShowAddModal(false)}
              onSuccess={handleDocumentAdded}
            />
          )}
        </Container>
      </PageTransition>
    </PageWrapper>
  );
}