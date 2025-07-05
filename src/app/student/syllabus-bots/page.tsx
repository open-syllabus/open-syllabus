// src/app/student/skolrs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { UnifiedStudentSkolrCard } from '@/components/student/UnifiedStudentBotCard';
import { StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import { 
  FiGrid, 
  FiList, 
  FiSearch, 
  FiActivity,
  FiBook,
  FiCheckCircle,
  FiBookOpen,
  FiVideo,
  FiFilter,
  FiMessageSquare,
  FiClipboard,
  FiHome
} from 'react-icons/fi';

interface StudentSkolr {
  instance_id: string;
  chatbot_id: string;
  room_id: string;
  room_name: string;
  room_code: string;
  name: string;
  description: string;
  model?: string;
  bot_type: string;
  welcome_message?: string;
  enable_rag: boolean;
  interaction_count: number;
  created_at: string;
}

// Modern styled components with pastel theme (identical to teacher's page)
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
  margin: 0 0 32px 0;
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

const SkolrGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin: 0 -16px;
    width: calc(100% + 32px);
    
    table {
      min-width: 800px;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #F3F4F6;
  transition: background 0.2s ease;
  
  &:hover {
    background: #F9FAFB;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: #111827;
  font-size: 0.875rem;
`;

const SkolrNameLink = styled.a`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    text-decoration: underline;
  }
`;

const Badge = styled.span<{ $variant: 'primary' | 'success' | 'warning' | 'info' | 'default' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: #EDE9FE;
          color: #6366F1;
        `;
      case 'success':
        return `
          background: #D1FAE5;
          color: #10B981;
        `;
      case 'warning':
        return `
          background: #FEF3C7;
          color: #F59E0B;
        `;
      case 'info':
        return `
          background: #DBEAFE;
          color: #3B82F6;
        `;
      default:
        return `
          background: #F3F4F6;
          color: #6B7280;
        `;
    }
  }}
`;

export default function StudentSkolrsPage() {
  const [skolrs, setSkolrs] = useState<StudentSkolr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBotType, setSelectedBotType] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [stats, setStats] = useState({
    total: 0,
    learning: 0,
    assessment: 0,
    readingRoom: 0,
    viewingRoom: 0,
    knowledgeBook: 0
  });
  const [totalRooms, setTotalRooms] = useState(0);
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchSkolrs = useCallback(async () => {
    console.log('[StudentSkolrsPage] Fetching Skolrs with filters:', 
        { debouncedSearchTerm, selectedBotType, sortBy });
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
      if (sortBy) {
        params.append('sortBy', sortBy);
      }

      const response = await fetch(`/api/student/skolrs?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = `Failed to fetch Skolrs (status ${response.status})`;
        try {
            const errData = await response.json();
            errorMessage = errData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setSkolrs(data.skolrs || []);
      setStats(data.stats || {
        total: 0,
        learning: 0,
        assessment: 0,
        readingRoom: 0,
        viewingRoom: 0,
        knowledgeBook: 0
      });
      setTotalRooms(data.totalRooms || 0);
    } catch (err) {
      console.error('[StudentSkolrsPage] Error fetching Skolrs:', err);
      setError(err instanceof Error ? err.message : 'Could not load your Skolrs.');
      setSkolrs([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, selectedBotType, sortBy]);

  useEffect(() => {
    fetchSkolrs();
  }, [fetchSkolrs]);

  const handleChatClick = (skolr: StudentSkolr) => {
    router.push(`/chat/${skolr.room_id}?instanceId=${skolr.instance_id}`);
  };

  const getBotTypeVariant = (botType: string): 'primary' | 'warning' | 'info' | 'success' => {
    if (botType === 'assessment') return 'success';
    if (botType === 'reading_room') return 'info';
    if (botType === 'viewing_room') return 'warning';
    if (botType === 'knowledge_book') return 'primary';
    return 'primary';
  };

  const getBotTypeLabel = (botType: string): string => {
    if (botType === 'reading_room') return 'Reading';
    if (botType === 'assessment') return 'Assessment';
    if (botType === 'viewing_room') return 'Viewing';
    if (botType === 'knowledge_book') return 'Knowledge';
    return 'Learning';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading && skolrs.length === 0) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '16px' }}>Loading your Syllabus Bots...</p>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Title
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <FiMessageSquare />
          My Syllabus Bots
        </Title>
        <Subtitle>Your AI learning assistants from all rooms</Subtitle>
        
        <HeaderActions>
          <SearchContainer
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search Syllabus Bots..."
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
              variant="primary"
              size="medium"
              onClick={() => router.push('/student/dashboard')}
            >
              <FiHome />
              Back to Dashboard
            </ModernButton>
          </ActionButtonsContainer>
        </HeaderActions>
      
      <StatsGrid>
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#3B82F6"><FiMessageSquare /></ColoredIconWrapper>}
          title="Learning Bots"
          value={stats.learning}
          variant="primary"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#10B981"><FiClipboard /></ColoredIconWrapper>}
          title="Assessment Bots"
          value={stats.assessment}
          variant="secondary"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#EC4899"><FiBookOpen /></ColoredIconWrapper>}
          title="Reading Room"
          value={stats.readingRoom}
          variant="success"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#F59E0B"><FiVideo /></ColoredIconWrapper>}
          title="Viewing Room"
          value={stats.viewingRoom}
          variant="warning"
        />
        
        <UnifiedStatsCard
          icon={<ColoredIconWrapper $color="#6366F1"><FiBook /></ColoredIconWrapper>}
          title="Knowledge Book"
          value={stats.knowledgeBook}
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
              onChange={(e) => setSelectedBotType(e.target.value)}
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
              <option value="interactions_desc">Most Active</option>
              <option value="room_name_asc">Room Name</option>
            </StyledSelect>
          </div>
          
          <div>
            <FilterLabel>Total Rooms</FilterLabel>
            <div style={{ 
              padding: '12px 16px', 
              background: '#F3F4F6', 
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: '#111827',
              fontWeight: '600'
            }}>
              {totalRooms} Room{totalRooms !== 1 ? 's' : ''}
            </div>
          </div>
        </FilterGrid>
      </FiltersContainer>

      {error && <Alert variant="error" style={{ marginBottom: '24px' }}>{error}</Alert>}
      
      {skolrs.length === 0 && !isLoading ? (
        <EmptyState
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FiMessageSquare />
          <EmptyTitle>
            {debouncedSearchTerm ? 'No Syllabus Bots found' : 'No Syllabus Bots yet'}
          </EmptyTitle>
          <EmptyText>
            {debouncedSearchTerm 
              ? 'Try adjusting your search or filters'
              : 'Join a room to start learning with Syllabus Bots!'
            }
          </EmptyText>
        </EmptyState>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {viewMode === 'card' ? (
            <SkolrGrid>
              {skolrs.map((skolr) => (
                <UnifiedStudentSkolrCard
                  key={skolr.instance_id}
                  skolr={skolr}
                />
              ))}
            </SkolrGrid>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Room</TableHeaderCell>
                    <TableHeaderCell>Description</TableHeaderCell>
                    <TableHeaderCell>Knowledge</TableHeaderCell>
                    <TableHeaderCell>Interactions</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skolrs.map((skolr) => (
                    <TableRow key={skolr.instance_id}>
                      <TableCell>
                        <SkolrNameLink onClick={() => handleChatClick(skolr)}>
                          {skolr.name}
                        </SkolrNameLink>
                      </TableCell>
                      <TableCell>
                        <Badge $variant={getBotTypeVariant(skolr.bot_type)}>
                          {getBotTypeLabel(skolr.bot_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{skolr.room_name}</TableCell>
                      <TableCell>{skolr.description || '-'}</TableCell>
                      <TableCell>
                        <Badge $variant={skolr.enable_rag ? 'success' : 'default'}>
                          {skolr.enable_rag ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{skolr.interaction_count}</TableCell>
                      <TableCell>
                        <ModernButton
                          size="small"
                          variant="primary"
                          onClick={() => handleChatClick(skolr)}
                        >
                          Chat
                        </ModernButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </motion.div>
      )}
      </Container>
    </PageWrapper>
  );
}