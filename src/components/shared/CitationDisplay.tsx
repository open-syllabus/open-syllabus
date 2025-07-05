// CitationDisplay component for showing document citations in KnowledgeBook responses
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiFile, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  text: string;
  score: number;
}

interface CitationDisplayProps {
  citations: Citation[];
  confidence?: number;
}

const CitationContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border}20;
  padding-top: ${({ theme }) => theme.spacing.md};
`;

const CitationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  user-select: none;
  
  &:hover {
    opacity: 0.8;
  }
`;

const CitationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ConfidenceBadge = styled.span<{ $confidence: number }>`
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme, $confidence }) => 
    $confidence >= 0.8 ? theme.colors.ui.pastelCyan :
    $confidence >= 0.6 ? theme.colors.ui.pastelYellow :
    theme.colors.ui.pastelPink
  };
  color: ${({ theme, $confidence }) => 
    $confidence >= 0.8 ? theme.colors.status.success :
    $confidence >= 0.6 ? theme.colors.brand.secondary :
    theme.colors.status.danger
  };
  font-weight: 500;
`;

const CitationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const CitationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border}20;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary}40;
    background: ${({ theme }) => theme.colors.ui.pastelPurple};
  }
`;

const CitationNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.75rem;
  font-weight: 600;
`;

const CitationContent = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 2px;
`;

const PageNumber = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const CitationText = styled.div`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.8125rem;
  line-height: 1.4;
  margin-top: 4px;
  
  /* Truncate long text */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.brand.primary};
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.7;
  }
`;

export function CitationDisplay({ citations, confidence }: CitationDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!citations || citations.length === 0) {
    return null;
  }
  
  const displayedCitations = isExpanded ? citations : citations.slice(0, 2);
  
  return (
    <CitationContainer>
      <CitationHeader onClick={() => setIsExpanded(!isExpanded)}>
        <CitationTitle>
          <FiFile size={16} />
          Sources ({citations.length})
        </CitationTitle>
        {confidence !== undefined && (
          <ConfidenceBadge $confidence={confidence}>
            {Math.round(confidence * 100)}% match
          </ConfidenceBadge>
        )}
      </CitationHeader>
      
      <CitationList>
        {displayedCitations.map((citation, index) => {
          // Extract just the number from citation.id (e.g., "[1]" -> "1")
          const citationNumber = citation.id.replace(/[\[\]]/g, '');
          
          return (
            <CitationItem key={citation.id}>
              <CitationNumber>{citationNumber}</CitationNumber>
              <CitationContent>
                <DocumentName>
                  {citation.documentName}
                  {citation.pageNumber && (
                    <PageNumber>(p. {citation.pageNumber})</PageNumber>
                  )}
                </DocumentName>
                <CitationText>{citation.text}</CitationText>
              </CitationContent>
            </CitationItem>
          );
        })}
      </CitationList>
      
      {citations.length > 2 && (
        <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <>Show less <FiChevronUp /></>
          ) : (
            <>Show {citations.length - 2} more <FiChevronDown /></>
          )}
        </ExpandButton>
      )}
    </CitationContainer>
  );
}