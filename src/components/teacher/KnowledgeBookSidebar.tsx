'use client';

import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { FiPlus, FiFile, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import AddKnowledgeModal from './AddKnowledgeModal';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const SidebarContainer = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.ui.background};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.125rem;
  font-weight: 600;
`;

const AddButton = styled(ModernButton)`
  width: 100%;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
`;

const DocumentList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

const DocumentItem = styled.div`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DocumentHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DocumentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DocumentName = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-word;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocumentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const DocumentType = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const DocumentSize = styled.span``;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.status.danger};
    background: ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.1)};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    opacity: 0.3;
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'ready':
      case 'completed':
        return `
          background: ${hexToRgba(theme.colors.status.success, 0.2)};
          color: ${theme.colors.status.success};
        `;
      case 'processing':
        return `
          background: ${hexToRgba(theme.colors.status.warning, 0.2)};
          color: ${theme.colors.status.warning};
        `;
      case 'error':
        return `
          background: ${hexToRgba(theme.colors.status.danger, 0.2)};
          color: ${theme.colors.status.danger};
        `;
      default:
        return `
          background: ${hexToRgba(theme.colors.text.secondary, 0.2)};
          color: ${theme.colors.text.secondary};
        `;
    }
  }}
`;

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.brand.accent};
  margin-top: 8px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface Document {
  document_id: string;
  chatbot_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  original_url?: string;
}

interface KnowledgeBookSidebarProps {
  chatbotId: string;
  showDeleteButtons?: boolean;
}

export default function KnowledgeBookSidebar({ chatbotId, showDeleteButtons = true }: KnowledgeBookSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      // Check if we have a user ID in the URL (for direct access)
      const urlParams = new URLSearchParams(window.location.search);
      const directUserId = urlParams.get('uid');
      
      // Use API endpoint to fetch documents (works for both teachers and students)
      let url = `/api/teacher/chatbots/${chatbotId}/documents`;
      if (directUserId) {
        url += `?userId=${directUserId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Error fetching documents:', response.status);
        return;
      }

      const data = await response.json();
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) {
      fetchDocuments();
      
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchDocuments, 5000);
      
      return () => clearInterval(interval);
    }
  }, [chatbotId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('url')) return '🌐';
    return '📎';
  };

  const handleDelete = async (documentId: string) => {
    if (!showDeleteButtons) return;
    
    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/teacher/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <SidebarContainer>
      <Header>
        <Title>Knowledge Base</Title>
        {showDeleteButtons && (
          <AddButton 
            variant="primary" 
            size="medium"
            onClick={() => setShowAddModal(true)}
          >
            <FiPlus size={16} />
            Add Knowledge
          </AddButton>
        )}
      </Header>

      <DocumentList>
        {loading ? (
          <EmptyState>
            <p>Loading documents...</p>
          </EmptyState>
        ) : documents && documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentItem key={doc.document_id}>
              <DocumentHeader>
                <DocumentInfo>
                  <DocumentName>{doc.file_name}</DocumentName>
                  <DocumentMeta>
                    <DocumentType>
                      {getFileIcon(doc.file_type)}
                      {doc.file_type}
                    </DocumentType>
                    <DocumentSize>{formatFileSize(doc.file_size)}</DocumentSize>
                    <StatusBadge $status={doc.status}>
                      {getStatusLabel(doc.status)}
                    </StatusBadge>
                  </DocumentMeta>
                </DocumentInfo>
                {showDeleteButtons && (
                  <DeleteButton
                    onClick={() => handleDelete(doc.document_id)}
                    disabled={deletingId === doc.document_id}
                    title="Delete document"
                  >
                    <FiTrash2 size={16} />
                  </DeleteButton>
                )}
              </DocumentHeader>
              {doc.original_url && (
                <SourceLink 
                  href={doc.original_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FiExternalLink size={12} />
                  View source
                </SourceLink>
              )}
            </DocumentItem>
          ))
        ) : (
          <EmptyState>
            <FiFile />
            <p>No documents uploaded yet</p>
            {showDeleteButtons && (
              <p style={{ marginTop: '8px' }}>
                Click "Add Knowledge" to get started
              </p>
            )}
          </EmptyState>
        )}
      </DocumentList>

      {showAddModal && (
        <AddKnowledgeModal
          chatbotId={chatbotId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchDocuments();
          }}
        />
      )}
    </SidebarContainer>
  );
}