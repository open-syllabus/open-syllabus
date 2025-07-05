// src/app/teacher-dashboard/concerns/[flagId]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ModernButton } from '@/components/shared/ModernButton';
import { ChatMessage as ChatMessageComponent } from '@/components/shared/ChatMessage';
import { SafetyMessage } from '@/components/shared/SafetyMessage';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { FlaggedMessage, ConcernStatus, ChatMessage as DatabaseChatMessage, Profile, Room } from '@/types/database.types';

interface FlagDetailsResponse extends FlaggedMessage {
    student: Pick<Profile, 'full_name' | 'email'> | null;
    room: Pick<Room, 'room_name'> | null;
    message: DatabaseChatMessage | null;
    student_name: string | null;
    student_email: string | null;
    room_name: string | null;
    message_content: string | null;
    surroundingMessages: DatabaseChatMessage[];
}

// Modern styled components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
  position: relative;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg} 0;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

const Header = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const Title = styled(motion.h1)`
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 32px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 28px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 2px solid ${({ theme }) => theme.colors.ui.border};
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ConversationCard = styled(Card)`
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.ui.border};
    border-radius: 4px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.ui.borderDark};
    }
  }
`;

const FlaggedMessageWrapper = styled(motion.div)`
  position: relative;
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.ui.pastelPink};
  border: 2px solid ${({ theme }) => theme.colors.brand.coral};
  
  &::before {
    content: 'FLAGGED MESSAGE';
    position: absolute;
    top: -10px;
    left: 20px;
    background: white;
    padding: 0 ${({ theme }) => theme.spacing.xs};
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
    color: ${({ theme }) => theme.colors.brand.coral};
  }
`;

const DetailsCard = styled(Card)`
  position: sticky;
  top: 100px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    position: static;
  }
`;

const DetailItem = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const DetailValue = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  
  span {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const AnalysisBox = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-style: italic;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.6;
`;

const ActionSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 2px solid ${({ theme }) => theme.colors.ui.border};
`;

const FormField = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: white;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: white;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  resize: vertical;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
`;

const ConcernBadge = styled.span<{ $level: number }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ theme, $level }) => {
    if ($level >= 4) return theme.colors.ui.pastelPink; 
    if ($level >= 3) return theme.colors.ui.pastelYellow;
    return theme.colors.ui.pastelBlue; 
  }};
  color: ${({ theme, $level }) => {
    if ($level >= 4) return theme.colors.brand.coral;
    if ($level >= 3) return theme.colors.brand.secondary; 
    return theme.colors.brand.accent;
  }};
`;

const Alert = styled(motion.div)<{ $variant?: 'error' | 'success' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $variant }) => 
    $variant === 'error' ? theme.colors.ui.pastelPink : theme.colors.ui.pastelGreen};
  color: ${({ theme, $variant }) => 
    $variant === 'error' ? theme.colors.brand.coral : theme.colors.brand.green};
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl};
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 1.125rem;
    margin: 0;
  }
`;

// Helper functions
function getConcernTypeText(type: string | undefined): string {
  if (!type) return 'Unknown';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getConcernLevelText(level: number | undefined): string {
  if (level === undefined) return 'N/A';
  if (level >= 5) return 'Critical';
  if (level >= 4) return 'High';
  if (level >= 3) return 'Significant';
  if (level >= 2) return 'Moderate';
  if (level >= 1) return 'Minor';
  return 'Low';
}

export default function ConcernDetailPage() {
  const [concern, setConcern] = useState<FlagDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ConcernStatus>('pending');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const params = useParams();
  const router = useRouter();
  const flagId = params?.flagId as string;
  const flaggedMessageRef = useRef<HTMLDivElement>(null);

  const fetchConcernDetails = useCallback(async () => {
    if (!flagId) {
      setError("Flag ID missing from page parameters.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setActionError(null);
    
    try {
      const response = await fetch(`/api/teacher/concerns?flagId=${flagId}`);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(data.error || `Failed to fetch concern details (status: ${response.status})`);
      }
      
      const data: FlagDetailsResponse = await response.json();
      setConcern(data);
      setSelectedStatus(data.status || 'pending');
      setNotes(data.notes || '');
    } catch (err) {
      console.error("Error fetching concern:", err);
      setError(err instanceof Error ? err.message : 'Failed to load concern details');
      setConcern(null);
    } finally {
      setLoading(false);
    }
  }, [flagId]);

  useEffect(() => {
    fetchConcernDetails();
  }, [fetchConcernDetails]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (concern && flaggedMessageRef.current) {
        flaggedMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [concern]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern?.flag_id) return;

    setIsSubmitting(true);
    setActionError(null);
    setShowSuccess(false);
    
    try {
      const response = await fetch(`/api/teacher/concerns`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagId: concern.flag_id,
          status: selectedStatus,
          notes: notes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.error || 'Failed to update status');
      }

      const updatedData = await response.json();
      setConcern(prev => prev ? ({ ...prev, ...updatedData }) : null);
      setSelectedStatus(updatedData.status);
      setNotes(updatedData.notes || '');
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render states
  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
            <span style={{ marginLeft: '16px', color: '#666' }}>Loading concern details...</span>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <Alert $variant="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </Alert>
          <ModernButton 
            variant="ghost" 
            onClick={() => router.back()} 
            style={{ marginTop: '16px' }}
          >
            ← Back
          </ModernButton>
        </Container>
      </PageWrapper>
    );
  }

  if (!concern) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <p>Concern not found or permission denied.</p>
          </EmptyState>
          <ModernButton 
            variant="ghost" 
            onClick={() => router.back()} 
            style={{ marginTop: '16px', display: 'block', margin: '16px auto 0' }}
          >
            ← Back
          </ModernButton>
        </Container>
      </PageWrapper>
    );
  }

  const actualFlaggedMessage = concern.surroundingMessages?.find(m => m.message_id === concern.message_id) || concern.message;

  return (
    <PageWrapper>
      <Container>
        <Header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Review Concern</Title>
          <ModernButton 
            variant="secondary" 
            onClick={() => router.push('/teacher-dashboard/concerns')}
          >
            ← Back to Concerns
          </ModernButton>
        </Header>

        <Grid>
          {/* Conversation Context */}
          <ConversationCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardHeader>
              <h2>Conversation Context</h2>
            </CardHeader>
            <MessagesList>
              {concern.surroundingMessages?.length > 0 ? (
                concern.surroundingMessages.map(msg => {
                  const isFlagged = msg.message_id === concern.message_id;
                  const chatbotName = concern.room_name || "Assistant";

                  // Check if this is a safety message
                  const isSafetyMessage = msg.role === 'system' && msg.metadata?.isSystemSafetyResponse === true;

                  if (isSafetyMessage) {
                    return (
                      <SafetyMessage 
                        key={msg.message_id} 
                        message={msg}
                        countryCode={msg.metadata?.countryCode as string | undefined}
                      />
                    );
                  }

                  const messageComponent = (
                    <ChatMessageComponent 
                      key={msg.message_id} 
                      message={msg} 
                      chatbotName={chatbotName}
                    />
                  );

                  return isFlagged ? (
                    <FlaggedMessageWrapper
                      key={msg.message_id}
                      ref={flaggedMessageRef}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {messageComponent}
                    </FlaggedMessageWrapper>
                  ) : messageComponent;
                })
              ) : (
                actualFlaggedMessage ? (
                  <FlaggedMessageWrapper 
                    ref={flaggedMessageRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ChatMessageComponent 
                      key={actualFlaggedMessage.message_id} 
                      message={actualFlaggedMessage} 
                      chatbotName={concern.room_name || "Assistant"}
                    />
                  </FlaggedMessageWrapper>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666' }}>
                    Conversation context unavailable.
                  </p>
                )
              )}
            </MessagesList>
          </ConversationCard>

          {/* Details & Actions */}
          <DetailsCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardHeader>
              <h2>Concern Details</h2>
            </CardHeader>
            <CardBody>
              <DetailItem>
                <DetailLabel>Student</DetailLabel>
                <DetailValue>
                  {concern.student_name || 'N/A'}
                  {concern.student_email && (
                    <span> ({concern.student_email})</span>
                  )}
                </DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Classroom</DetailLabel>
                <DetailValue>{concern.room_name || 'N/A'}</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Concern Type</DetailLabel>
                <DetailValue>{getConcernTypeText(concern.concern_type)}</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Assessed Level</DetailLabel>
                <DetailValue>
                  <ConcernBadge $level={concern.concern_level}>
                    {getConcernLevelText(concern.concern_level)} (Level {concern.concern_level})
                  </ConcernBadge>
                </DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>Detected At</DetailLabel>
                <DetailValue>{new Date(concern.created_at).toLocaleString()}</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>AI Analysis</DetailLabel>
                <AnalysisBox>
                  {concern.analysis_explanation || 
                   "This message was flagged by the automated safety system. Please review the conversation context."}
                </AnalysisBox>
              </DetailItem>

              {concern.reviewed_at && (
                <DetailItem>
                  <DetailLabel>Last Reviewed</DetailLabel>
                  <DetailValue>{new Date(concern.reviewed_at).toLocaleString()}</DetailValue>
                </DetailItem>
              )}

              <ActionSection>
                <form onSubmit={handleStatusUpdate}>
                  <FormField>
                    <Label htmlFor="status">Update Status</Label>
                    <Select 
                      id="status" 
                      value={selectedStatus} 
                      onChange={(e) => setSelectedStatus(e.target.value as ConcernStatus)}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="resolved">Resolved</option>
                      <option value="false_positive">False Positive</option>
                    </Select>
                  </FormField>

                  <FormField>
                    <Label htmlFor="notes">Review Notes</Label>
                    <TextArea 
                      id="notes" 
                      rows={5} 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Add notes on actions taken, observations, or decision rationale..."
                    />
                  </FormField>

                  {showSuccess && (
                    <Alert $variant="success"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Status updated successfully!
                    </Alert>
                  )}

                  {actionError && (
                    <Alert $variant="error">
                      {actionError}
                    </Alert>
                  )}

                  <ModernButton 
                    type="submit" 
                    variant="primary"
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? 'Updating...' : 'Update Status & Notes'}
                  </ModernButton>
                </form>
              </ActionSection>
            </CardBody>
          </DetailsCard>
        </Grid>
      </Container>
    </PageWrapper>
  );
}