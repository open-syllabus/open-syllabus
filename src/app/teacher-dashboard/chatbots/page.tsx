// src/app/teacher-dashboard/chatbots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BotList, { type ChatbotListProps } from '@/components/teacher/BotList';
import type { Chatbot, BotTypeEnum } from '@/types/database.types';
import { StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import { 
  FiGrid, 
  FiList, 
  FiSearch, 
  FiPlus,
  FiActivity,
  FiBook,
  FiCheckCircle,
  FiBookOpen,
  FiVideo,
  FiArchive,
  FiFilter,
  FiMessageSquare,
  FiClipboard,
  FiHome
} from 'react-icons/fi';

// Modern styled components with pastel theme
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
  margin-bottom: 32px;
`;

const Title = styled(motion.h1)`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 32px;
    height: 32px;
    color: #7C3AED;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6B7280;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 24px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 24px;
  }
`;

const SearchContainer = styled(motion.div)`
  position: relative;
  flex: 1;
  max-width: 400px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-width: 100%;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #111827;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  width: 20px;
  height: 20px;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #F3F4F6;
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
`;

const ToggleButton = styled.button<{ $isActive: boolean }>`
  padding: 8px 12px;
  background: ${({ $isActive }) => $isActive ? 'white' : 'transparent'};
  color: ${({ $isActive }) => $isActive ? '#7C3AED' : '#6B7280'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
  
  &:hover {
    background: ${({ $isActive }) => $isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'};
    color: #7C3AED;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const FiltersContainer = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: flex-end;
`;

const FilterLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 8px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-top: 32px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
`;

// Removed custom StatCard components - using shared UI component instead

// Wrapper to add custom icon colors
const ColoredIconWrapper = styled.div<{ $color: string }>`
  color: ${({ $color }) => $color};
  
  svg {
    width: 24px;
    height: 24px;
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
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: #6B7280;
  font-size: 1rem;
  margin: 0 0 24px 0;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  background: white;
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #7C3AED;
  }
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  
  option {
    padding: 8px;
  }
`;

// Modal styled components with modern theme
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;

const ModalText = styled.p`
  margin: 0 0 24px 0;
  color: #6B7280;
  font-size: 1rem;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;


export default function ManageSkolrsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); 

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBotType, setSelectedBotType] = useState<BotTypeEnum | ''>('');
  const [selectedRagStatus, setSelectedRagStatus] = useState<'any' | 'true' | 'false'>('any');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    chatbotId: string | null;
    chatbotName: string;
  }>({ isOpen: false, chatbotId: null, chatbotName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Archive modal state
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    chatbotId: string | null;
    chatbotName: string;
  }>({ isOpen: false, chatbotId: null, chatbotName: '' });
  const [isArchiving, setIsArchiving] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchChatbots = useCallback(async () => {
    console.log('[SkolrsPage] Fetching Skolrs with filters:', 
        { debouncedSearchTerm, selectedBotType, selectedRagStatus, sortBy });
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('searchTerm', debouncedSearchTerm);
      }
      if (selectedBotType) {
        params.append('botType', selectedBotType);
      }
      if (selectedRagStatus !== 'any') {
        params.append('ragEnabled', selectedRagStatus);
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }

      const response = await fetch(`/api/teacher/chatbots?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = `Failed to fetch Skolrs (status ${response.status})`;
        try {
            const errData = await response.json();
            errorMessage = errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setChatbots(data as Chatbot[]);
        console.log('[SkolrsPage] Loaded chatbots:', data.map((c: any) => ({
          name: c.name,
          model: c.model,
          ai_model: c.ai_model
        })));
      } else {
        console.warn('[SkolrsPage] API returned non-array data for Skolrs:', data);
        setChatbots([]);
      }
    } catch (err) {
      console.error('[SkolrsPage] Error fetching Skolrs:', err);
      setError(err instanceof Error ? err.message : 'Could not load your Skolrs.');
      setChatbots([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, selectedBotType, selectedRagStatus, sortBy]);

  useEffect(() => {
    fetchChatbots();
  }, [fetchChatbots]);

  const handleEditChatbot = useCallback((chatbotId: string) => {
      // Navigate to the edit page instead of opening a modal
      router.push(`/teacher-dashboard/chatbots/${chatbotId}/edit`);
  }, [router]);

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
      fetchChatbots();
      setDeleteModal({ isOpen: false, chatbotId: null, chatbotName: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Skolr.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal, fetchChatbots]);
  
  const handleArchiveChatbot = useCallback((chatbotId: string, chatbotName: string) => {
    setArchiveModal({
      isOpen: true,
      chatbotId,
      chatbotName
    });
  }, []);
  
  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveModal.chatbotId) return;
    
    setIsArchiving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/teacher/chatbots/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbotId: archiveModal.chatbotId, archive: true })
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to archive Skolr (status ${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      alert(result.message || `Skolr "${archiveModal.chatbotName}" archived successfully.`);
      fetchChatbots();
      setArchiveModal({ isOpen: false, chatbotId: null, chatbotName: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive Skolr.';
      setError(errorMessage);
    } finally {
      setIsArchiving(false);
    }
  }, [archiveModal, fetchChatbots]); 
  
  const handleCreateNewChatbot = useCallback(() => {
      // Navigate to the new bot creation wizard
      router.push('/teacher-dashboard/create-bot');
  }, [router]);

  // Calculate stats
  const totalChatbots = chatbots.length;
  const learningBots = chatbots.filter(bot => bot.bot_type === 'learning').length;
  const assessmentBots = chatbots.filter(bot => bot.bot_type === 'assessment').length;
  const readingRoomBots = chatbots.filter(bot => bot.bot_type === 'reading_room').length;
  const viewingRoomBots = chatbots.filter(bot => bot.bot_type === 'viewing_room').length;
  const knowledgeBookBots = chatbots.filter(bot => bot.bot_type === 'knowledge_book').length;

  if (isLoading && chatbots.length === 0) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '16px' }}>Loading your Skolrs...</p>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }


  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FiMessageSquare />
            My Skolrs
          </Title>
          <Subtitle>Create and manage AI-powered teaching assistants</Subtitle>
        </Header>
        
        <HeaderActions>
          <SearchContainer
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search Skolrs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ActionButtonsContainer>
            <ViewToggle>
              <ToggleButton
                $isActive={viewMode === 'card'}
                onClick={() => setViewMode('card')}
              >
                <FiGrid />
                Cards
              </ToggleButton>
              <ToggleButton
                $isActive={viewMode === 'list'}
                onClick={() => setViewMode('list')}
              >
                <FiList />
                List
              </ToggleButton>
            </ViewToggle>
            
            <ModernButton
              variant="ghost"
              size="medium"
              onClick={() => router.push('/teacher-dashboard/chatbots/archived')}
              style={{ borderColor: '#E5E7EB' }}
            >
              <FiArchive />
              Archived
            </ModernButton>
            
            <ModernButton
              variant="primary"
              size="medium"
              onClick={() => router.push('/teacher-dashboard/rooms')}
            >
              <FiPlus />
              Create Skolr in Room
            </ModernButton>
          </ActionButtonsContainer>
        </HeaderActions>
      
      <StatsGrid>
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#3B82F6"><FiMessageSquare /></ColoredIconWrapper>}
          title="Learning Skolrs"
          value={learningBots}
          variant="primary"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#10B981"><FiClipboard /></ColoredIconWrapper>}
          title="Assessment Skolrs"
          value={assessmentBots}
          variant="secondary"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#EC4899"><FiBookOpen /></ColoredIconWrapper>}
          title="Reading Room"
          value={readingRoomBots}
          variant="success"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#F59E0B"><FiVideo /></ColoredIconWrapper>}
          title="Viewing Room"
          value={viewingRoomBots}
          variant="warning"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#6366F1"><FiBook /></ColoredIconWrapper>}
          title="Knowledge Book"
          value={knowledgeBookBots}
          variant="primary"
        />
      </StatsGrid>
      
      <FiltersContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <FilterGrid>
          <div>
            <FilterLabel htmlFor="botTypeFilter">
              <FiFilter style={{ display: 'inline', marginRight: '6px' }} />
              Bot Type
            </FilterLabel>
            <StyledSelect
              id="botTypeFilter"
              value={selectedBotType}
              onChange={(e) => setSelectedBotType(e.target.value as BotTypeEnum | '')}
            >
              <option value="">All Types</option>
              <option value="learning">Learning</option>
              <option value="assessment">Assessment</option>
              <option value="reading_room">Reading Room</option>
              <option value="viewing_room">Viewing Room</option>
              <option value="knowledge_book">Knowledge Book</option>
            </StyledSelect>
          </div>
          
          <div>
            <FilterLabel htmlFor="ragStatusFilter">
              Knowledge Base
            </FilterLabel>
            <StyledSelect
              id="ragStatusFilter"
              value={selectedRagStatus}
              onChange={(e) => setSelectedRagStatus(e.target.value as 'any' | 'true' | 'false')}
            >
              <option value="any">Any Status</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </StyledSelect>
          </div>
          
          <div>
            <FilterLabel htmlFor="sortBy">
              Sort By
            </FilterLabel>
            <StyledSelect
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="updated_at_desc">Last Modified</option>
            </StyledSelect>
          </div>
        </FilterGrid>
      </FiltersContainer>

      {error && <Alert variant="error" style={{ marginBottom: '24px' }}>{error}</Alert>}
      
      {chatbots.length === 0 && !isLoading ? (
        <EmptyState
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FiMessageSquare />
          <EmptyTitle>
            {debouncedSearchTerm ? 'No Skolrs found' : 'No Skolrs yet'}
          </EmptyTitle>
          <EmptyText>
            {debouncedSearchTerm 
              ? 'Try adjusting your search or filters'
              : 'Your Skolrs will appear here'
            }
          </EmptyText>
          {!debouncedSearchTerm && (
            <>
              <EmptyText style={{ marginTop: '16px', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Skolrs are created within rooms. Go to your rooms to add AI learning assistants.
              </EmptyText>
              <ModernButton
                variant="primary"
                onClick={() => router.push('/teacher-dashboard/rooms')}
                style={{ marginTop: '16px' }}
              >
                <FiHome />
                Go to Rooms to Create Skolr
              </ModernButton>
            </>
          )}
        </EmptyState>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <BotList 
            chatbots={chatbots}
            onEdit={handleEditChatbot}     
            onDelete={handleDeleteChatbot}
            onArchive={handleArchiveChatbot}
            viewMode={viewMode}
          />
        </motion.div>
      )}
      
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
              <ModalTitle>Delete Skolr</ModalTitle>
              <ModalText>
                Are you sure you want to delete the Skolr &quot;
                <strong>{deleteModal.chatbotName}</strong>
                &quot;? This will also delete associated documents and knowledge base entries if RAG was used. This action cannot be undone.
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
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Skolr'}
                </ModernButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Archive Modal */}
      <AnimatePresence>
        {archiveModal.isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setArchiveModal({ isOpen: false, chatbotId: null, chatbotName: '' })}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>Archive Skolr</ModalTitle>
              <ModalText>
                Are you sure you want to archive the Skolr &quot;
                <strong>{archiveModal.chatbotName}</strong>
                &quot;? The Skolr will be hidden from your active list but can be restored later.
              </ModalText>
              <ModalActions>
                <ModernButton 
                  variant="ghost" 
                  onClick={() => setArchiveModal({ isOpen: false, chatbotId: null, chatbotName: '' })} 
                  disabled={isArchiving}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="secondary"
                  onClick={handleArchiveConfirm}
                  disabled={isArchiving}
                >
                  {isArchiving ? 'Archiving...' : 'Archive Skolr'}
                </ModernButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      </Container>
    </PageWrapper>
  );
}