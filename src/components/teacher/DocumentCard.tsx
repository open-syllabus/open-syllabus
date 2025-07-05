// src/components/teacher/DocumentCard.tsx
'use client';

import styled, { css } from 'styled-components';
import { GlassCard } from '@/components/shared/GlassCard';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Document as KnowledgeDocument, DocumentStatus, DocumentType } from '@/types/knowledge-base.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const Card = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconWrapper = styled.div<{ $type: DocumentType }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  
  ${({ $type, theme }) => {
    const colors = {
      pdf: { bg: hexToRgba(theme.colors.status.danger, 0.1), color: theme.colors.status.danger },
      docx: { bg: hexToRgba(theme.colors.status.success, 0.1), color: theme.colors.status.success },
      txt: { bg: hexToRgba(theme.colors.brand.primary, 0.1), color: theme.colors.brand.primary },
      webpage: { bg: hexToRgba(theme.colors.status.warning, 0.1), color: theme.colors.status.warning }
    };
    
    const config = colors[$type] || colors.txt;
    return `
      background: ${config.bg};
      color: ${config.color};
      border: 1px solid ${config.color}20;
    `;
  }}
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.body};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span<{ $status: DocumentStatus }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  
  ${({ $status, theme }) => {
    const statusStyles = {
      completed: {
        bg: hexToRgba(theme.colors.status.success, 0.1),
        color: theme.colors.status.success,
        border: hexToRgba(theme.colors.status.success, 0.2)
      },
      processing: {
        bg: hexToRgba(theme.colors.brand.primary, 0.1),
        color: theme.colors.brand.primary,
        border: hexToRgba(theme.colors.brand.primary, 0.2)
      },
      error: {
        bg: hexToRgba(theme.colors.status.danger, 0.1),
        color: theme.colors.status.danger,
        border: hexToRgba(theme.colors.status.danger, 0.2)
      },
      uploaded: {
        bg: hexToRgba(theme.colors.status.warning, 0.1),
        color: theme.colors.status.warning,
        border: hexToRgba(theme.colors.status.warning, 0.2)
      },
      fetched: {
        bg: hexToRgba(theme.colors.status.warning, 0.1),
        color: theme.colors.status.warning,
        border: hexToRgba(theme.colors.status.warning, 0.2)
      }
    };
    
    const style = statusStyles[$status] || statusStyles.uploaded;
    return `
      background: ${style.bg};
      color: ${style.color};
      border: 1px solid ${style.border};
    `;
  }}
`;

const MetaInfo = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.body};
  
  svg {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.08)};
`;

const getFileIcon = (type: DocumentType): string => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    txt: '📃',
    webpage: '🌐'
  };
  return icons[type] || '📄';
};

const getStatusLabel = (status: DocumentStatus): string => {
  const labels: Record<DocumentStatus, string> = {
    uploaded: 'Pending',
    processing: 'Processing',
    completed: 'Ready',
    error: 'Failed',
    fetched: 'Pending'
  };
  return labels[status] || status;
};

const formatFileSize = (bytes: number, fileType: DocumentType): string => {
  if (fileType === 'webpage') {
    if (bytes === 0) return 'No content';
    return `${bytes.toLocaleString()} chars`;
  }
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  
  return date.toLocaleDateString();
};

interface DocumentCardProps {
  document: KnowledgeDocument;
  onView?: () => void;
  onProcess?: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
  isDeleting?: boolean;
}

export default function DocumentCard({
  document,
  onView,
  onProcess,
  onDelete,
  isProcessing = false,
  isDeleting = false
}: DocumentCardProps) {
  const showProcessButton = document.status === 'uploaded' || document.status === 'fetched';
  const canDelete = !isProcessing && !isDeleting;

  return (
    <Card variant="light" $hoverable onClick={onView}>
      <Header>
        <IconWrapper $type={document.file_type}>
          {getFileIcon(document.file_type)}
        </IconWrapper>
        <Content>
          <Title title={document.file_name}>
            {document.file_name}
          </Title>
          {document.file_type === 'webpage' && (
            <Subtitle title={document.file_path}>
              {document.file_path}
            </Subtitle>
          )}
        </Content>
        <StatusBadge $status={document.status}>
          {getStatusLabel(document.status)}
        </StatusBadge>
      </Header>
      
      <MetaInfo>
        <MetaItem>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a1 1 0 100-2H6V5z" clipRule="evenodd" />
          </svg>
          {formatFileSize(document.file_size, document.file_type)}
        </MetaItem>
        <MetaItem>
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          {formatDate(document.created_at)}
        </MetaItem>
      </MetaInfo>
      
      {document.error_message && (
        <Subtitle style={{ color: '#FE4372', marginTop: '8px' }}>
          Error: {document.error_message}
        </Subtitle>
      )}
      
      <Actions onClick={e => e.stopPropagation()}>
        {showProcessButton && (
          <ModernButton             size="small"
            variant="primary"
            onClick={onProcess}
            disabled={isProcessing}
            style={{ flex: 1 }}
          >
            {isProcessing ? 'Processing...' : 'Process'}
          </ModernButton>
        )}
        <ModernButton           size="small"
          variant="ghost"
          onClick={onDelete}
          disabled={!canDelete}
          style={{ flex: showProcessButton ? 0 : 1 }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </ModernButton>
      </Actions>
    </Card>
  );
}