// src/components/teacher/EmbeddingStatus.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Card, Alert } from '@/styles/StyledComponents';
import { GlassCard } from '@/components/shared/GlassCard';
import { Document, ProcessingStats } from '@/types/knowledge-base.types';

const StatusContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelGreen}20 0%, 
    ${({ theme }) => theme.colors.ui.pastelBlue}20 100%);
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
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
    opacity: 0.5;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
  z-index: 1;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.25rem;
  font-weight: 600;
`;

const ProgressContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ProgressBar = styled.div`
  height: 16px;
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
`;

const ProgressFill = styled.div<{ $progress: number; $hasErrors: boolean }>`
  height: 100%;
  width: ${({ $progress }) => `${$progress}%`};
  background: ${({ theme, $hasErrors }) => 
    $hasErrors 
      ? `linear-gradient(90deg, ${theme.colors.ui.pastelOrange} 0%, ${theme.colors.ui.pastelPink} 100%)`
      : `linear-gradient(90deg, ${theme.colors.ui.pastelGreen} 0%, ${theme.colors.ui.pastelBlue} 100%)`
  };
  transition: width 0.5s ease;
  border-radius: 20px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.4) 50%, 
      transparent 100%);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100px); }
    100% { transform: translateX(100px); }
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.ui.pastelPurple}10 0%, 
      ${({ theme }) => theme.colors.ui.pastelPink}10 100%);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.brand.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: ${({ theme }) => theme.fonts.body};
`;

const StatusText = styled.div<{ $isComplete: boolean; $hasErrors: boolean }>`
  color: ${({ theme, $isComplete, $hasErrors }) => 
    $isComplete 
      ? $hasErrors ? theme.colors.status.danger : theme.colors.status.success 
      : theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
`;

interface EmbeddingStatusProps {
  document: Document;
  chatbotId: string;
  onRefresh?: () => void;
}

export default function EmbeddingStatus({ 
  document, 
  chatbotId,
  onRefresh
}: EmbeddingStatusProps) {
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/teacher/chatbots/${chatbotId}/vectorize?documentId=${document.document_id}`
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch processing status');
      }
      
      const data = await response.json();
      setStats(data.processingStats);
      
      // Update document with latest status
      if (data.document.status !== document.status && onRefresh) {
        onRefresh();
      }
      
      // If processing is complete, stop polling
      if (data.document.status === 'completed' || data.document.status === 'error') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch processing status');
    } finally {
      setLoading(false);
    }
  }, [document.document_id, document.status, chatbotId, onRefresh, pollingInterval]);

  useEffect(() => {
    fetchStatus();
    
    // Set up polling for processing status
    if (document.status === 'processing' && !pollingInterval) {
      const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
      setPollingInterval(interval);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [document.status, fetchStatus, pollingInterval]);

  if (loading) {
    return (
      <StatusContainer>
        <p>Loading processing status...</p>
      </StatusContainer>
    );
  }

  if (error) {
    return (
      <StatusContainer>
        <Alert variant="error">{error}</Alert>
      </StatusContainer>
    );
  }

  if (!stats) {
    return (
      <StatusContainer>
        <p>No processing statistics available</p>
      </StatusContainer>
    );
  }

  const progressPercent = stats.totalChunks > 0
    ? Math.round((stats.processedChunks / stats.totalChunks) * 100)
    : 0;
  
  const hasErrors = stats.errorChunks > 0;
  const isComplete = document.status === 'completed' || 
                     (document.status === 'processing' && progressPercent === 100);

  return (
    <StatusContainer>
      <Header>
        <Title>Document Processing Status</Title>
      </Header>
      
      <ProgressContainer>
        <ProgressBar>
          <ProgressFill $progress={progressPercent} $hasErrors={hasErrors} />
        </ProgressBar>
        <StatusText 
          $isComplete={isComplete} 
          $hasErrors={hasErrors}
        >
          {document.status === 'error' ? 'Processing failed' :
           isComplete ? 'Processing complete' : 'Processing in progress'}
           {hasErrors && ' (with some errors)'}
           {document.status === 'processing' && ` - ${progressPercent}%`}
        </StatusText>
      </ProgressContainer>
      
      <StatsContainer>
        <StatCard>
          <StatValue>{stats.totalChunks}</StatValue>
          <StatLabel>Total Chunks</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.processedChunks}</StatValue>
          <StatLabel>Processed</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.errorChunks}</StatValue>
          <StatLabel>Errors</StatLabel>
        </StatCard>
      </StatsContainer>
      
      {document.error_message && (
        <Alert variant="error">Error: {document.error_message}</Alert>
      )}
    </StatusContainer>
  );
}