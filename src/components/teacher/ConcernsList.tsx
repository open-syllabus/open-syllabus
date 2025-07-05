// src/components/teacher/ConcernsList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/navigation';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { ConcernStatus, FlaggedMessage } from '@/types/database.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
// Custom styled components for specific needs
const FilterSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const StyledSelect = styled.select`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.ui.background};
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all 0.2s ease;
  min-width: 200px;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

const StatsText = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-weight: 500;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin: 0 -${({ theme }) => theme.spacing.lg};
    padding: 0 ${({ theme }) => theme.spacing.lg};
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 0.8125rem;
  }
`;

const TableHeader = styled.thead`
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-bottom: 2px solid ${({ theme }) => theme.colors.ui.border};
`;

const TableHeaderCell = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  transition: background-color ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  }
`;

const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  vertical-align: middle;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;

const MessagePreview = styled.div`
  max-width: 250px; 
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  font-size: 0.875rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: 150px;
  }
`;

interface ConcernBadgeProps {
  $level: number; 
}

const ConcernBadge = styled.span<ConcernBadgeProps>`
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

const StatusBadge = styled.span<{ $status: ConcernStatus }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ theme, $status }) => {
    switch ($status) {
      case 'pending': return theme.colors.ui.pastelPink;
      case 'reviewing': return theme.colors.ui.pastelYellow;
      case 'resolved': return theme.colors.ui.pastelGreen;
      case 'false_positive': return theme.colors.ui.pastelGray;
      default: return theme.colors.ui.pastelGray;
    }
  }};
  color: ${({ theme, $status }) => {
    switch ($status) {
      case 'pending': return theme.colors.brand.coral;
      case 'reviewing': return theme.colors.brand.secondary;
      case 'resolved': return theme.colors.brand.green;
      case 'false_positive': return theme.colors.text.secondary;
      default: return theme.colors.text.secondary;
    }
  }};
`;

const LoadingContainer = styled.div`
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const EmptyStateContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl};
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 2px dashed ${({ theme }) => theme.colors.ui.border};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xxl};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const LoadingText = styled.span`
  margin-left: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.status.danger};
`;

const EmptyStateText = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

interface ConcernDetails extends FlaggedMessage {
  student_name: string | null;
  room_name: string | null;
  message_content: string | null;
}

function getConcernTypeText(type: string): string {
  if (!type) return 'Unknown';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getConcernLevelText(level: number): string {
  if (level >= 5) return 'Critical';
  if (level >= 4) return 'High';
  if (level >= 3) return 'Significant';
  if (level >= 2) return 'Moderate';
  if (level >= 1) return 'Minor';
  return 'Low';
}

function getStatusText(status: ConcernStatus): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'reviewing': return 'Reviewing';
    case 'resolved': return 'Resolved';
    case 'false_positive': return 'False Positive';
    default: return status || 'Unknown';
  }
}

interface ConcernsListProps {
  limit?: number; 
  accentColor?: string;
}

export default function ConcernsList({ limit, accentColor }: ConcernsListProps) {
  const [concerns, setConcerns] = useState<ConcernDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending'); 
  const [pagination, setPagination] = useState({ currentPage: 0, hasMore: false, totalCount: 0 });
  const router = useRouter();

  const fetchConcerns = useCallback(async (page = 0, filter = statusFilter, isNewFilter = false) => {
    setLoading(true); 
    if (isNewFilter) {
      setConcerns([]); 
      setPagination(prev => ({ ...prev, currentPage: 0, hasMore: false })); 
    }
    setError(null);

    try {
      const itemsPerPage = limit || 10; 
      const url = new URL('/api/teacher/concerns', window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', itemsPerPage.toString());
      if (filter) {
        url.searchParams.append('status', filter);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch concerns (status: ${response.status})`);
      }

      const data = await response.json();
      setConcerns(prev => (page > 0 && !isNewFilter) ? [...prev, ...(data.concerns || [])] : (data.concerns || []));
      setPagination({
        currentPage: data.pagination?.currentPage ?? 0,
        hasMore: data.pagination?.hasMore ?? false,
        totalCount: data.pagination?.totalCount ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading concerns');
      setConcerns([]); 
      setPagination({ currentPage: 0, hasMore: false, totalCount: 0 }); 
    } finally {
      setLoading(false);
    }
  }, [limit, statusFilter]); 

  useEffect(() => {
    fetchConcerns(0, statusFilter, true); 
  }, [fetchConcerns, statusFilter]); 

  const handleViewConversation = (concern: ConcernDetails) => {
    router.push(`/teacher-dashboard/concerns/${concern.flag_id}`);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setStatusFilter(newFilter);
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchConcerns(pagination.currentPage + 1, statusFilter, false); 
    }
  };

  const renderContent = () => {
    if (loading && concerns.length === 0) { 
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading concerns...</LoadingText>
        </LoadingContainer>
      );
    }

    if (error) {
      return (
        <EmptyStateContainer>
          <ErrorText>{error}</ErrorText>
        </EmptyStateContainer>
      );
    }

    if (concerns.length === 0) {
      return (
        <EmptyStateContainer>
          <EmptyStateText>
            No concerns {statusFilter ? `with status "${getStatusText(statusFilter as ConcernStatus)}"` : ''} found.
          </EmptyStateText>
        </EmptyStateContainer>
      );
    }

    return (
      <>
        <TableWrapper>
          <StyledTable>
            <TableHeader>
              <tr>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Room</TableHeaderCell>
                <TableHeaderCell>Concern Type</TableHeaderCell>
                <TableHeaderCell>Level</TableHeaderCell>
                <TableHeaderCell>Message Preview</TableHeaderCell>
                <TableHeaderCell>Date Flagged</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <tbody>
              {concerns.map((concern) => (
                <TableRow key={concern.flag_id}>
                  <TableCell>{concern.student_name || 'N/A'}</TableCell>
                  <TableCell>{concern.room_name || 'N/A'}</TableCell>
                  <TableCell>{getConcernTypeText(concern.concern_type)}</TableCell>
                  <TableCell>
                    <ConcernBadge $level={concern.concern_level}>
                      {getConcernLevelText(concern.concern_level)} ({concern.concern_level})
                    </ConcernBadge>
                  </TableCell>
                  <TableCell>
                    <MessagePreview title={concern.message_content || ''}>
                      {concern.message_content || '[N/A]'}
                    </MessagePreview>
                  </TableCell>
                  <TableCell>
                    {new Date(concern.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge $status={concern.status}>
                      {getStatusText(concern.status)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <ModernButton
                      size="small"
                      variant="primary"
                      onClick={() => handleViewConversation(concern)}
                    >
                      Review
                    </ModernButton>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </StyledTable>
        </TableWrapper>

        {!limit && pagination.hasMore && ( 
          <PaginationContainer>
            <ModernButton onClick={handleLoadMore} variant="ghost" disabled={loading}>
              {loading ? 'Loading...' : 'Load More Concerns'}
            </ModernButton>
          </PaginationContainer>
        )}
      </>
    );
  };

  return (
    <div>
      {!limit && (
        <FilterSection>
          <label htmlFor="status-filter" style={{ fontWeight: 600 }}>Filter by status:</label>
          <StyledSelect 
            id="status-filter"
            value={statusFilter}
            onChange={handleFilterChange}
            disabled={loading}
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
            <option value="">All</option>
          </StyledSelect>
          {!loading && <StatsText>Total Found: {pagination.totalCount}</StatsText>}
        </FilterSection>
      )}
      {renderContent()}
    </div>
  );
}