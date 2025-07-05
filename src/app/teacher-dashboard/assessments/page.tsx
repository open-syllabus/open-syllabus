// src/app/teacher-dashboard/assessments/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ModernButton } from '@/components/shared/ModernButton';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiBook, FiFilter, FiEye, FiAward, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
// Import types from your database.types.ts
import type { AssessmentListSummary, PaginatedAssessmentsResponse, AssessmentStatusEnum } from '@/types/database.types';

// Styled Components with modern pastel theme
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

const FilterControls = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
    color: #7C3AED;
  }
`;

const StyledSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  background: white;
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: all 0.2s ease;
  flex: 1;
  min-width: 200px;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
  
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

const ModernCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto; /* Enable horizontal scrolling on smaller viewports */
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  
  thead {
    background: #F9FAFB;
  }
  
  th, td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #E5E7EB;
  }

  th {
    color: #6B7280;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr {
    transition: background-color 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background: #F9FAFB;
    }
  }

  td {
    font-size: 0.875rem;
    color: #111827;
    font-weight: 500;
  }

  td.actions {
    text-align: right;
    white-space: nowrap;
  }
  
  .student-name {
    font-weight: 600;
    color: #111827;
  }
  
  .room-name {
    color: #6B7280;
  }
  
  .truncate {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const Badge = styled.span<{ $variant: 'success' | 'warning' | 'error' | 'default' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return '#ECFDF5';
      case 'warning': return '#FEF3C7';
      case 'error': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  }};
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyStateCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 60px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  svg {
    width: 64px;
    height: 64px;
    color: #E5E7EB;
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }
  
  p {
    color: #6B7280;
    font-size: 1rem;
    margin: 0;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  
  p {
    margin-top: 16px;
    color: #6B7280;
    font-weight: 500;
  }
`;

// Helper to get display text for status
const getStatusText = (status?: AssessmentStatusEnum): string => {
    if (!status) return 'N/A';
    switch (status) {
        case 'ai_processing': return 'AI Processing';
        case 'ai_completed': return 'AI Completed (Ready for Review)';
        case 'teacher_reviewed': return 'Teacher Reviewed';
        default: return status;
    }
};
const getStatusBadgeVariant = (status?: AssessmentStatusEnum): 'success' | 'warning' | 'error' | 'default' => {
    if (!status) return 'default';
    switch (status) {
        case 'ai_processing': return 'default';
        case 'ai_completed': return 'warning'; // Yellow/Orange indicating action needed
        case 'teacher_reviewed': return 'success';
        default: return 'default';
    }
};

const getStatusIcon = (status?: AssessmentStatusEnum) => {
    if (!status) return null;
    switch (status) {
        case 'ai_processing': return <FiClock />;
        case 'ai_completed': return <FiAlertCircle />;
        case 'teacher_reviewed': return <FiCheck />;
        default: return null;
    }
};


export default function AssessmentsListPage() {
  const [assessments, setAssessments] = useState<AssessmentListSummary[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AssessmentStatusEnum | ''>(''); // Empty string for 'all'

  const router = useRouter();

  const fetchAssessments = useCallback(async (pageToFetch: number, currentStatusFilter: AssessmentStatusEnum | '') => {
    setLoading(true);
    setError(null);
    console.log(`[AssessmentsPage] Fetching assessments. Page: ${pageToFetch}, Status: ${currentStatusFilter || 'all'}`);

    try {
      const queryParams = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: pagination.pageSize.toString(),
      });
      if (currentStatusFilter) {
        queryParams.append('status', currentStatusFilter);
      }

      const response = await fetch(`/api/teacher/assessments?${queryParams.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch assessments (status ${response.status})`);
      }
      const data: PaginatedAssessmentsResponse = await response.json();
      setAssessments(data.assessments || []);
      setPagination(data.pagination || { currentPage: 0, pageSize: 10, totalCount: 0, totalPages: 0 });
    } catch (err) {
      console.error("Error fetching assessments:", err);
      setError(err instanceof Error ? err.message : 'Could not load assessments.');
      setAssessments([]); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]); // pageSize can be a dependency if you allow changing it

  useEffect(() => {
    fetchAssessments(0, statusFilter); // Fetch initial page on mount or when filter changes
  }, [statusFilter, fetchAssessments]); // fetchAssessments is stable due to useCallback

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchAssessments(newPage, statusFilter);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as AssessmentStatusEnum | '');
    // useEffect will trigger refetch due to statusFilter change
  };

  const handleViewDetails = (assessmentId: string) => {
    router.push(`/teacher-dashboard/assessments/${assessmentId}`);
  };

  if (loading && assessments.length === 0) { // Show full page loader only on initial load
    return (
      <PageWrapper>
        <Container>
          <EmptyStateCard
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingContainer>
              <LoadingSpinner size="large" />
              <p>Loading assessments...</p>
            </LoadingContainer>
          </EmptyStateCard>
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
            <FiBook />
            Student Assessments
          </Title>
          <Subtitle>Review and manage student assessment results</Subtitle>
        </Header>

      <FilterControls
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <FilterLabel htmlFor="statusFilter">
          <FiFilter />
          Filter by Status:
        </FilterLabel>
        <StyledSelect id="statusFilter" value={statusFilter} onChange={handleFilterChange} disabled={loading}>
          <option value="">All Statuses</option>
          <option value="ai_processing">AI Processing</option>
          <option value="ai_completed">AI Completed (Ready for Review)</option>
          <option value="teacher_reviewed">Teacher Reviewed</option>
        </StyledSelect>
      </FilterControls>

      {error && <Alert variant="error" style={{ marginBottom: '16px' }}>{error}</Alert>}
      
      {loading && assessments.length > 0 && <Alert variant='info' style={{textAlign:'center'}}>Loading more...</Alert>} {/* Subtle loading more indicator */}


      {!loading && assessments.length === 0 && !error ? (
        <EmptyStateCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FiBook />
          <h3>No Assessments Found</h3>
          <p>There are no assessments matching your current filters, or no assessments have been processed yet.</p>
        </EmptyStateCard>
      ) : assessments.length > 0 ? (
        <ModernCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Assessment Skolr</th>
                  <th>AI Grade</th>
                  <th>Teacher Grade</th>
                  <th>Status</th>
                  <th>Date Assessed</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((asmnt) => (
                  <tr key={asmnt.assessment_id} onClick={() => handleViewDetails(asmnt.assessment_id)}>
                    <td className="student-name truncate" title={asmnt.student_name || undefined}>{asmnt.student_name || 'N/A'}</td>
                    <td className="room-name truncate" title={asmnt.room_name || undefined}>{asmnt.room_name || 'N/A'}</td>
                    <td className="truncate" title={asmnt.chatbot_name || undefined}>{asmnt.chatbot_name || 'N/A'}</td>
                    <td>{asmnt.ai_grade_raw || '-'}</td>
                    <td>{asmnt.teacher_override_grade || '-'}</td>
                    <td>
                      <Badge $variant={getStatusBadgeVariant(asmnt.status)}>
                        {getStatusIcon(asmnt.status)}
                        {getStatusText(asmnt.status)}
                      </Badge>
                    </td>
                    <td>{new Date(asmnt.assessed_at).toLocaleDateString()}</td>
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <ModernButton 
                        size="small" 
                        onClick={() => handleViewDetails(asmnt.assessment_id)}
                        style={{ 
                          fontSize: '0.75rem',
                          padding: '6px 16px',
                          gap: '4px'
                        }}
                      >
                        <FiEye /> Review
                      </ModernButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </ModernCard>
      ) : null}

      {pagination.totalPages > 1 && (
        <PaginationControls>
          <ModernButton
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 0 || loading}
            variant="ghost"
            style={{ borderColor: '#E5E7EB' }}
          >
            Previous
          </ModernButton>
          <span style={{ 
            color: '#6B7280', 
            fontWeight: 500,
            fontSize: '0.875rem'
          }}>
            Page {pagination.currentPage + 1} of {pagination.totalPages}
          </span>
          <ModernButton
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages - 1 || loading}
            variant="ghost"
            style={{ borderColor: '#E5E7EB' }}
          >
            Next
          </ModernButton>
        </PaginationControls>
      )}
      </Container>
    </PageWrapper>
  );
}