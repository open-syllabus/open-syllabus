// src/app/teacher-dashboard/chatbots/archived/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/shared/PageStructure';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import { FullPageLoader } from '@/components/shared/AnimatedLoader';
import { ModernChatbotCard } from '@/components/teacher/ModernBotCard';
import type { Chatbot } from '@/types/database.types';
import { 
  FiArchive,
  FiArrowLeft,
  FiRefreshCw
} from 'react-icons/fi';

// Styled components
const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 32px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 28px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl};
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const EmptyIcon = styled.div`
  width: 100px;
  height: 100px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: ${({ theme }) => theme.shadows.soft};
  
  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const EmptyTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const EmptyText = styled.p`
  margin: 0 0 24px 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 16px;
`;

const ChatbotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const InfoBar = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelYellow};
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.status.warning};
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
  }
`;

// Modal styled components (matching main chatbots page)
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ModalText = styled.p`
  margin: 0 0 24px 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 16px;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

export default function ArchivedChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedChatbots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/teacher/chatbots/archived');
      
      if (!response.ok) {
        throw new Error('Failed to fetch archived chatbots');
      }
      
      const data = await response.json();
      setChatbots(data);
    } catch (err) {
      console.error('Error fetching archived chatbots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load archived chatbots');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchivedChatbots();
  }, [fetchArchivedChatbots]);

  // Modal state
  const [restoreModal, setRestoreModal] = useState<{
    isOpen: boolean;
    chatbotId: string | null;
    chatbotName: string;
  }>({ isOpen: false, chatbotId: null, chatbotName: '' });
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    chatbotId: string | null;
    chatbotName: string;
  }>({ isOpen: false, chatbotId: null, chatbotName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleRestoreChatbot = useCallback((chatbotId: string, chatbotName: string) => {
    setRestoreModal({
      isOpen: true,
      chatbotId,
      chatbotName
    });
  }, []);
  
  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreModal.chatbotId) return;
    
    setIsRestoring(true);
    setError(null);
    
    try {
      const response = await fetch('/api/teacher/chatbots/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbotId: restoreModal.chatbotId, archive: false })
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to restore Skolr (status ${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      alert(result.message || `Skolr "${restoreModal.chatbotName}" restored successfully.`);
      fetchArchivedChatbots();
      setRestoreModal({ isOpen: false, chatbotId: null, chatbotName: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore Skolr.';
      setError(errorMessage);
    } finally {
      setIsRestoring(false);
    }
  }, [restoreModal, fetchArchivedChatbots]);

  const handleDeleteChatbot = useCallback((chatbotId: string, chatbotName: string) => {
    setDeleteModal({
      isOpen: true,
      chatbotId,
      chatbotName
    });
  }, []);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.chatbotId) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teacher/chatbots?chatbotId=${deleteModal.chatbotId}`, { 
        method: 'DELETE' 
      }); 
      
      if (!response.ok) {
        let errorMessage = `Failed to delete Skolr (status ${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      alert(result.message || `Skolr "${deleteModal.chatbotName}" deleted successfully.`);
      fetchArchivedChatbots();
      setDeleteModal({ isOpen: false, chatbotId: null, chatbotName: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Skolr.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal, fetchArchivedChatbots]);

  // Dummy handlers for edit (archived chatbots shouldn't be edited)
  const handleEditChatbot = useCallback((chatbotId: string) => {
    alert("Archived Skolrs cannot be edited. Please restore the Skolr first.");
  }, []);

  if (isLoading) {
    return <FullPageLoader message="Loading archived Skolrs..." variant="dots" />;
  }

  return (
    <PageWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ListHeader>
        <Title>
          <FiArchive />
          Archived Skolrs
        </Title>
        <HeaderActions>
          <ModernButton
            variant="ghost"
            onClick={() => router.push('/teacher-dashboard/chatbots')}
          >
            <FiArrowLeft />
            Back to Active Skolrs
          </ModernButton>
        </HeaderActions>
      </ListHeader>

      <InfoBar>
        <FiArchive />
        <p>
          Archived Skolrs are hidden from your main list but can be restored at any time. 
          Perfect for seasonal content or Skolrs you want to keep for next year.
        </p>
      </InfoBar>

      {error && <Alert variant="error" style={{ marginBottom: '24px' }}>{error}</Alert>}
      
      {chatbots.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FiArchive />
          </EmptyIcon>
          <EmptyTitle>No Archived Skolrs</EmptyTitle>
          <EmptyText>
            You haven't archived any Skolrs yet. Archive Skolrs from your main list to save them for later.
          </EmptyText>
          <ModernButton
            variant="ghost"
            onClick={() => router.push('/teacher-dashboard/chatbots')}
          >
            <FiArrowLeft />
            Back to Skolrs
          </ModernButton>
        </EmptyState>
      ) : (
        <ChatbotGrid>
          {chatbots.map((chatbot) => (
            <ModernChatbotCard
              key={chatbot.chatbot_id}
              chatbot={chatbot}
              onEdit={handleEditChatbot}
              onDelete={handleDeleteChatbot}
              onArchive={handleRestoreChatbot} // Reusing onArchive for restore with archive: false
            />
          ))}
        </ChatbotGrid>
      )}
      
      {/* Restore Modal */}
      <AnimatePresence>
        {restoreModal.isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRestoreModal({ isOpen: false, chatbotId: null, chatbotName: '' })}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>Restore Skolr</ModalTitle>
              <ModalText>
                Are you sure you want to restore the Skolr &quot;
                <strong>{restoreModal.chatbotName}</strong>
                &quot;? It will appear in your active Skolrs list again.
              </ModalText>
              <ModalActions>
                <ModernButton 
                  variant="ghost" 
                  onClick={() => setRestoreModal({ isOpen: false, chatbotId: null, chatbotName: '' })} 
                  disabled={isRestoring}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleRestoreConfirm}
                  disabled={isRestoring}
                >
                  {isRestoring ? 'Restoring...' : 'Restore Skolr'}
                </ModernButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal({ isOpen: false, chatbotId: null, chatbotName: '' })}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>Delete Archived Skolr</ModalTitle>
              <ModalText>
                Are you sure you want to permanently delete the archived Skolr &quot;
                <strong>{deleteModal.chatbotName}</strong>
                &quot;? This action cannot be undone and will delete all associated data.
              </ModalText>
              <ModalActions>
                <ModernButton 
                  variant="ghost" 
                  onClick={() => setDeleteModal({ isOpen: false, chatbotId: null, chatbotName: '' })} 
                  disabled={isDeleting}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </ModernButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}