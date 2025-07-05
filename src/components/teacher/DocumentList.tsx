// src/components/teacher/DocumentList.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styled, { css } from 'styled-components';
import { Card } from '@/styles/StyledComponents';
import { GlassCard } from '@/components/shared/GlassCard';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Document as KnowledgeDocument, DocumentStatus, DocumentType } from '@/types/knowledge-base.types'; // MODIFIED: Added DocumentType
import { createClient } from '@/lib/supabase/client';
import { parseVideoUrl } from '@/lib/utils/video-utils';
import { useDocumentPolling } from '@/hooks/useDocumentPolling';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const ModernBadge = styled.span<{ $variant?: 'success' | 'warning' | 'error' | 'default' }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${hexToRgba(theme.colors.status.success, 0.5)};
          color: ${theme.colors.status.success};
          border: 1px solid ${hexToRgba(theme.colors.status.success, 0.3)};
        `;
      case 'warning':
        return `
          background: ${hexToRgba(theme.colors.status.warning, 0.5)};
          color: ${theme.colors.status.warning};
          border: 1px solid ${hexToRgba(theme.colors.status.warning, 0.3)};
        `;
      case 'error':
        return `
          background: ${hexToRgba(theme.colors.status.danger, 0.5)};
          color: ${theme.colors.status.danger};
          border: 1px solid ${hexToRgba(theme.colors.status.danger, 0.3)};
        `;
      default:
        return `
          background: ${hexToRgba(theme.colors.brand.primary, 0.5)};
          color: ${theme.colors.brand.primary};
          border: 1px solid ${hexToRgba(theme.colors.brand.primary, 0.3)};
        `;
    }
  }}
`;

const ListContainer = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  margin-top: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  overflow-x: auto;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.colors.ui.pastelPurple} 0%, 
      ${({ theme }) => theme.colors.ui.pastelPink} 50%, 
      ${({ theme }) => theme.colors.ui.pastelBlue} 100%);
    opacity: 0.6;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 700px; 
  border-collapse: separate;
  border-spacing: 0;
  
  thead {
    background: linear-gradient(135deg, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelPurple, 0.1)} 0%, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelBlue, 0.1)} 100%);
  }
  
  th, td {
    text-align: left;
    padding: ${({ theme }) => theme.spacing.md};
    border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
    vertical-align: middle; 
  }

  th {
    color: ${({ theme }) => theme.colors.brand.primary};
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
    font-family: ${({ theme }) => theme.fonts.heading};
  }

  tbody tr {
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, 
        ${({ theme }) => hexToRgba(theme.colors.ui.pastelPink, 0.1)} 0%, 
        ${({ theme }) => hexToRgba(theme.colors.ui.pastelYellow, 0.1)} 100%);
      
      td {
        color: ${({ theme }) => theme.colors.text.primary};
      }
    }
  }

  td {
    color: ${({ theme }) => theme.colors.text.muted};
    font-size: 0.875rem;
    font-family: ${({ theme }) => theme.fonts.body};
  }

  .actions-cell {
    width: 1%; 
    white-space: nowrap;
  }
  
  .filename-cell {
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    
    a {
      color: ${({ theme }) => theme.colors.brand.primary};
      text-decoration: none;
      transition: color 0.2s ease;
      
      &:hover {
        color: ${({ theme }) => theme.colors.brand.magenta};
      }
    }
  }
`;

const MobileList = styled.div`
  display: none; 
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    /* display: block; */
  }
`;

const MobileCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.08)};
  transition: background 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.02)};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FileNameMobile = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-all;
  font-family: ${({ theme }) => theme.fonts.heading};
  
  a {
    color: ${({ theme }) => theme.colors.brand.primary};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.brand.magenta};
    }
  }
`;

const MobileDetails = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.body};
  
  .label {
    color: ${({ theme }) => theme.colors.brand.primary};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.75rem;
  }
  
  .value {
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-all;
  }
`;

const MobileActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  button {
    flex-grow: 1;
    min-width: 100px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.fonts.body};
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const ModernAlert = styled.div<{ $variant?: 'success' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  backdrop-filter: blur(10px);
  font-family: ${({ theme }) => theme.fonts.body};
  animation: fadeIn 0.3s ease-in-out;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${hexToRgba(theme.colors.status.success, 0.1)};
          color: ${theme.colors.status.success};
          border: 1px solid ${hexToRgba(theme.colors.status.success, 0.2)};
        `;
      case 'error':
        return `
          background: ${hexToRgba(theme.colors.status.danger, 0.1)};
          color: ${theme.colors.status.danger};
          border: 1px solid ${hexToRgba(theme.colors.status.danger, 0.2)};
        `;
      default:
        return `
          background: ${hexToRgba(theme.colors.brand.primary, 0.1)};
          color: ${theme.colors.brand.primary};
          border: 1px solid ${hexToRgba(theme.colors.brand.primary, 0.2)};
        `;
    }
  }}
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.03)};
  border-radius: 12px;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${({ theme, $active }) => 
    $active 
      ? `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.magenta})`
      : theme.colors.ui.background};
  color: ${({ theme, $active }) => 
    $active ? '#fff' : theme.colors.text.primary};
  border: 1px solid ${({ theme, $active }) => 
    $active ? 'transparent' : theme.colors.ui.border};
  border-radius: 8px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme, $active }) => 
      $active ? hexToRgba(theme.colors.brand.primary, 0.3) : hexToRgba(theme.colors.brand.primary, 0.1)};
    background: ${({ theme, $active }) => 
      !$active && hexToRgba(theme.colors.brand.primary, 0.1)};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SearchInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.colors.text.primary};
  min-width: 200px;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
`;


// MODIFIED: getStatusBadgeVariant to include 'fetched' status
const getStatusBadgeVariant = (status: DocumentStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'default';
      case 'error': return 'error';
      case 'uploaded': return 'warning';
      case 'fetched': return 'warning'; // 'fetched' can also be warning or default
      default: return 'default';
    }
};


interface DocumentListProps {
  documents: KnowledgeDocument[];
  onProcessDocument: (documentId: string) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onViewStatus: (documentId: string) => void;
}

export default function DocumentList({
  documents: initialDocuments,
  onProcessDocument,
  onDeleteDocument,
  onViewStatus
}: DocumentListProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(initialDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState<KnowledgeDocument[]>(initialDocuments);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Initialize state with ref to avoid useEffect race conditions
  const isInitialMount = useRef(true);
  
  // Get document counts for filter badges
  const getFilterCounts = () => {
    const statusCounts: Record<DocumentStatus | 'all', number> = {
      'all': documents.length,
      'uploaded': documents.filter(d => d.status === 'uploaded').length,
      'fetched': documents.filter(d => d.status === 'fetched').length,
      'processing': documents.filter(d => d.status === 'processing').length,
      'completed': documents.filter(d => d.status === 'completed').length,
      'error': documents.filter(d => d.status === 'error').length
    };
    
    const typeCounts: Record<DocumentType | 'all', number> = {
      'all': documents.length,
      'pdf': documents.filter(d => d.file_type === 'pdf').length,
      'docx': documents.filter(d => d.file_type === 'docx').length,
      'txt': documents.filter(d => d.file_type === 'txt').length,
      'webpage': documents.filter(d => d.file_type === 'webpage').length
    };
    
    return { statusCounts, typeCounts };
  };
  
  const counts = getFilterCounts();
  
  // Filter documents based on current filter settings
  const applyFilters = useCallback((docs: KnowledgeDocument[]) => {
    let result = [...docs];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(doc => doc.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(doc => doc.file_type === typeFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.file_name.toLowerCase().includes(term) || 
        (doc.file_type === 'webpage' && doc.file_path.toLowerCase().includes(term))
      );
    }
    
    // Use functional update to ensure we're working with the latest state
    setFilteredDocuments(result);
  }, [statusFilter, typeFilter, searchTerm]);
  
  // Handle document updates from polling
  const handleDocumentUpdate = useCallback((updatedDocument: KnowledgeDocument) => {
    setDocuments(prevDocs => {
      const newDocs = prevDocs.map(doc => 
        doc.document_id === updatedDocument.document_id 
          ? { ...doc, ...updatedDocument } 
          : doc
      );
      // Re-apply filters when documents update
      applyFilters(newDocs);
      return newDocs;
    });
  }, [applyFilters]);
  
  // Handle status changes with notifications
  const handleStatusChange = useCallback((documentId: string, oldStatus: string, newStatus: string) => {
    const doc = documents.find(d => d.document_id === documentId);
    if (!doc) return;
    
    if (newStatus === 'completed') {
      setSubscriptionMessage(`Document "${doc.file_name}" processing completed!`);
      setTimeout(() => setSubscriptionMessage(null), 5000);
    } else if (newStatus === 'error') {
      setSubscriptionMessage(`Error processing document "${doc.file_name}". Check status for details.`);
      setTimeout(() => setSubscriptionMessage(null), 8000);
    }
  }, [documents]);
  
  // Use the document polling hook
  useDocumentPolling({
    documents,
    onDocumentUpdate: handleDocumentUpdate,
    onStatusChange: handleStatusChange,
    pollingInterval: 3000,
    enabled: true
  });
  
  // Update local state when prop documents change
  useEffect(() => {
    setDocuments(initialDocuments);
    // Apply current filters to new documents
    applyFilters(initialDocuments);
    
    // Mark initial mount as complete
    isInitialMount.current = false;
  }, [initialDocuments, applyFilters]);
  
  // Update filtered documents when filters change or documents update
  useEffect(() => {
    // If this is the initial mount, skip as we already set this in the initialDocuments effect
    if (isInitialMount.current) return;
    
    // Apply filters to the current document state
    applyFilters(documents);
  }, [documents, statusFilter, typeFilter, searchTerm, applyFilters]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Function to get display type (distinguish YouTube from other webpages)
  const getDisplayType = (doc: KnowledgeDocument): string => {
    if (doc.file_type === 'webpage') {
      // Extract the URL from file_path (remove timestamp if present)
      const url = doc.file_path.split('#timestamp=')[0];
      const videoInfo = parseVideoUrl(url);
      if (videoInfo.platform === 'youtube') {
        return 'YOUTUBE';
      } else if (videoInfo.platform === 'vimeo') {
        return 'VIMEO';
      }
      return 'WEBPAGE';
    }
    return doc.file_type.toUpperCase();
  };

  // MODIFIED: formatFileSize to handle webpage type (size is text length)
  const formatFileSize = (bytes: number, fileType: DocumentType): string => {
    if (fileType === 'webpage') {
        // For webpages, 'bytes' is actually character count of extracted text
        if (bytes === 0) return 'No text extracted';
        return `${bytes.toLocaleString()} chars`;
    }
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
  };

  // MODIFIED: getStatusLabel to include 'fetched'
  const getStatusLabel = (status: DocumentStatus): string => {
    const labels: Record<DocumentStatus, string> = {
      uploaded: 'Pending Processing',
      processing: 'Processing',
      completed: 'In Knowledge Base',
      error: 'Error',
      fetched: 'Pending Processing', // New label
    };
    return labels[status] || status;
  };

  const handleProcess = async (documentId: string) => {
    setProcessingId(documentId);
    setActionError(null);
    try {
      await onProcessDocument(documentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to start processing.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!window.confirm(`Are you sure you want to delete the document "${documentName}"? This action cannot be undone.`)) {
        return;
    }
    setDeletingId(documentId);
    setActionError(null);
    try {
      await onDeleteDocument(documentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <ListContainer>
        <EmptyState>
          <p>No documents have been added to this chatbot&apos;s knowledge base yet.</p>
        </EmptyState>
      </ListContainer>
    );
  }
  
  // Check if filtered documents is empty
  if (filteredDocuments.length === 0 && (statusFilter !== 'all' || typeFilter !== 'all' || searchTerm !== '')) {
    return (
      <ListContainer>
        {actionError && <ModernAlert $variant="error">{actionError}</ModernAlert>}
        {subscriptionMessage && <ModernAlert $variant="success">{subscriptionMessage}</ModernAlert>}
        
        <FilterBar>
          <FilterGroup>
            <FilterButton 
              $active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              All ({counts.statusCounts.all})
            </FilterButton>
            
            {counts.statusCounts.completed > 0 && (
              <FilterButton 
                $active={statusFilter === 'completed'}
                onClick={() => setStatusFilter('completed')}
              >
                In Knowledge Base ({counts.statusCounts.completed})
              </FilterButton>
            )}
            
            {counts.statusCounts.processing > 0 && (
              <FilterButton 
                $active={statusFilter === 'processing'}
                onClick={() => setStatusFilter('processing')}
              >
                Processing ({counts.statusCounts.processing})
              </FilterButton>
            )}
            
            {(counts.statusCounts.uploaded > 0 || counts.statusCounts.fetched > 0) && (
              <FilterButton 
                $active={statusFilter === 'uploaded' || statusFilter === 'fetched'}
                onClick={() => setStatusFilter(counts.statusCounts.uploaded > 0 ? 'uploaded' : 'fetched')}
              >
                Pending ({counts.statusCounts.uploaded + counts.statusCounts.fetched})
              </FilterButton>
            )}
            
            {counts.statusCounts.error > 0 && (
              <FilterButton 
                $active={statusFilter === 'error'}
                onClick={() => setStatusFilter('error')}
              >
                Failed ({counts.statusCounts.error})
              </FilterButton>
            )}
          </FilterGroup>
          
          <SearchInput
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterBar>
        
        <EmptyState>
          <p>No documents match your current filters.</p>
          <ModernButton size="small" variant="ghost" onClick={() => {
            setStatusFilter('all');
            setTypeFilter('all');
            setSearchTerm('');
          }}>Clear filters</ModernButton>
        </EmptyState>
      </ListContainer>
    );
  }

  const renderActions = (doc: KnowledgeDocument) => (
    <>
      {/* Show process button for pending/error documents */}
      {(doc.status === 'uploaded' || doc.status === 'fetched' || doc.status === 'error') && (
        <ModernButton           
          size="small"
          variant="ghost"
          onClick={() => handleProcess(doc.document_id)}
          disabled={processingId === doc.document_id}
          title="Process this document"
        >
          {processingId === doc.document_id ? 'Processing...' : 'Process'}
        </ModernButton>
      )}
      {(doc.status === 'processing' || doc.status === 'completed' || doc.status === 'error') && (
        <ModernButton           size="small"
          variant="ghost"
          onClick={() => onViewStatus(doc.document_id)}
          title="View detailed processing status"
        >
          View Status
        </ModernButton>
      )}
      <ModernButton         size="small"
        variant="danger" 
        onClick={() => handleDelete(doc.document_id, doc.file_name)}
        disabled={deletingId === doc.document_id}
        title="Delete this document/webpage"
      >
        {deletingId === doc.document_id ? 'Deleting...' : 'Delete'}
      </ModernButton>
    </>
  );


  return (
    <ListContainer>
      {actionError && <ModernAlert $variant="error">{actionError}</ModernAlert>}
      {subscriptionMessage && <ModernAlert $variant="success">{subscriptionMessage}</ModernAlert>}
      
      {documents.length > 0 && (
        <FilterBar>
          <FilterGroup>
            <FilterButton 
              $active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              All ({counts.statusCounts.all})
            </FilterButton>
            
            {counts.statusCounts.completed > 0 && (
              <FilterButton 
                $active={statusFilter === 'completed'}
                onClick={() => setStatusFilter('completed')}
              >
                In Knowledge Base ({counts.statusCounts.completed})
              </FilterButton>
            )}
            
            {counts.statusCounts.processing > 0 && (
              <FilterButton 
                $active={statusFilter === 'processing'}
                onClick={() => setStatusFilter('processing')}
              >
                Processing ({counts.statusCounts.processing})
              </FilterButton>
            )}
            
            {(counts.statusCounts.uploaded > 0 || counts.statusCounts.fetched > 0) && (
              <FilterButton 
                $active={statusFilter === 'uploaded' || statusFilter === 'fetched'}
                onClick={() => setStatusFilter(counts.statusCounts.uploaded > 0 ? 'uploaded' : 'fetched')}
              >
                Pending ({counts.statusCounts.uploaded + counts.statusCounts.fetched})
              </FilterButton>
            )}
            
            {counts.statusCounts.error > 0 && (
              <FilterButton 
                $active={statusFilter === 'error'}
                onClick={() => setStatusFilter('error')}
              >
                Failed ({counts.statusCounts.error})
              </FilterButton>
            )}
          </FilterGroup>
          
          <SearchInput
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterBar>
      )}
      <Table>
        <thead>
          <tr>
            <th>Name / URL</th> 
            <th>Type</th>
            <th>Size / Content Length</th>
            <th>Status</th>
            <th>Added</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.map((doc) => (
            <tr key={doc.document_id}>
              {/* MODIFIED: Display filename for files, and file_path (URL) for webpages */}
              <td className="filename-cell" title={doc.file_type === 'webpage' ? doc.file_path : doc.file_name}>
                {doc.file_type === 'webpage' ? 
                  <a href={doc.file_path} target="_blank" rel="noopener noreferrer" title={`Open: ${doc.file_path}`}>
                    {doc.file_name} {/* file_name for webpage is its title */}
                  </a>
                  : doc.file_name
                }
              </td>
              <td>{getDisplayType(doc)}</td>
              {/* MODIFIED: Pass file_type to formatFileSize */}
              <td>{formatFileSize(doc.file_size, doc.file_type)}</td>
              <td>
                <ModernBadge $variant={getStatusBadgeVariant(doc.status)}>
                  {getStatusLabel(doc.status)}
                </ModernBadge>
                {doc.status === 'error' && doc.error_message && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '0.75rem', 
                    color: '#dc2626',
                    maxWidth: '200px',
                    lineHeight: '1.3'
                  }}>
                    {doc.error_message}
                  </div>
                )}
              </td>
              <td>{formatDate(doc.created_at)}</td>
              <td className="actions-cell">
                <div style={{ display: 'flex', gap: '8px' }}>
                  {renderActions(doc)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <MobileList>
        {filteredDocuments.map((doc) => (
          <MobileCard key={`mobile-${doc.document_id}`}> {/* MODIFIED: Added unique key prefix for mobile */}
            <MobileHeader>
              {/* MODIFIED: Mobile display for filename/URL */}
              <FileNameMobile title={doc.file_type === 'webpage' ? doc.file_path : doc.file_name}>
                {doc.file_type === 'webpage' ? 
                  <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                    {doc.file_name}
                  </a>
                  : doc.file_name
                }
              </FileNameMobile>
              <ModernBadge $variant={getStatusBadgeVariant(doc.status)}>
                {getStatusLabel(doc.status)}
              </ModernBadge>
            </MobileHeader>
            <MobileDetails>
              <span className="label">Type:</span>
              <span className="value">{getDisplayType(doc)}</span>
              <span className="label">Size:</span>
              {/* MODIFIED: Pass file_type to formatFileSize for mobile */}
              <span className="value">{formatFileSize(doc.file_size, doc.file_type)}</span>
              <span className="label">Added:</span>
              <span className="value">{formatDate(doc.created_at)}</span>
              {doc.error_message && (
                <>
                    <span className="label" style={{color: 'red'}}>Error:</span>
                    <span className="value" style={{color: 'red', whiteSpace: 'normal'}}>{doc.error_message}</span>
                </>
              )}
            </MobileDetails>
            <MobileActions>
                {renderActions(doc)}
            </MobileActions>
          </MobileCard>
        ))}
      </MobileList>
    </ListContainer>
  );
}