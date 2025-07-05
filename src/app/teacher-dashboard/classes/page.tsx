// src/app/teacher-dashboard/classes/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { TeacherClass } from '@/types/class.types';
import { 
  FiBookOpen, 
  FiUsers, 
  FiCalendar, 
  FiPlus,
  FiFilter,
  FiArchive,
  FiActivity,
  FiGrid,
  FiList,
  FiSearch
} from 'react-icons/fi';

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    margin-bottom: 24px;
  }
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#F3E8FF';
      case 'blue': return '#DBEAFE';
      case 'green': return '#D1FAE5';
      case 'orange': return '#FED7AA';
      default: return '#F3F4F6';
    }
  }};
  color: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#7C3AED';
      case 'blue': return '#3B82F6';
      case 'green': return '#10B981';
      case 'orange': return '#F97316';
      default: return '#6B7280';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 8px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
`;

const ContentSection = styled(motion.section)`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 24px;
    height: 24px;
    color: #7C3AED;
  }
`;

const ClassesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const ClassCard = styled(motion.div)`
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    background: white;
    border-color: #7C3AED;
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.1);
    transform: translateY(-2px);
    
    &::before {
      opacity: 1;
    }
  }
  
  &.archived {
    opacity: 0.7;
    background: #F3F4F6;
  }
`;

const ClassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
`;

const ClassName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const StudentCount = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #7C3AED;
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ClassStats = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
`;

const ClassStat = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6B7280;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ClassActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ArchivedBadge = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  background: #6B7280;
  color: white;
  padding: 4px 16px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FilterCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
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

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClasses();
  }, [showArchived]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (showArchived) params.append('includeArchived', 'true');
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedYear) params.append('academicYear', selectedYear);

      const response = await fetch(`/api/teacher/classes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    router.push('/teacher-dashboard/classes/create');
  };

  const handleClassClick = (classId: string) => {
    router.push(`/teacher-dashboard/classes/${classId}`);
  };

  // Get unique subjects and years for filtering
  const subjects = [...new Set(classes.map(c => c.subject).filter((s): s is string => s !== null && s !== undefined))];
  const years = [...new Set(classes.map(c => c.academic_year).filter((y): y is string => y !== null && y !== undefined))];

  const filteredClasses = classes.filter(cls => {
    if (selectedSubject && cls.subject !== selectedSubject) return false;
    if (selectedYear && cls.academic_year !== selectedYear) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return cls.name.toLowerCase().includes(search) ||
             (cls.description && cls.description.toLowerCase().includes(search)) ||
             (cls.subject && cls.subject.toLowerCase().includes(search));
    }
    return true;
  });

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
  const activeClasses = classes.filter(cls => !cls.is_archived).length;

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '16px' }}>Loading your classes...</p>
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
            <FiBookOpen />
            Classes
          </Title>
          <Subtitle>Organize your students into class groups</Subtitle>
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
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <ModernButton
            variant="ghost"
            size="medium"
            onClick={() => setShowArchived(!showArchived)}
            style={{ borderColor: '#E5E7EB' }}
          >
            <FiArchive />
            {showArchived ? 'Hide' : 'Show'} Archived
          </ModernButton>

          <ModernButton 
            variant="primary"
            size="medium"
            onClick={handleCreateClass}
          >
            <FiPlus />
            Create Class
          </ModernButton>
        </HeaderActions>

        {error && (
          <Alert variant="error" style={{ marginBottom: '24px' }}>
            {error}
          </Alert>
        )}

        <StatsGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatHeader>
              <StatIcon $color="purple">
                <FiBookOpen />
              </StatIcon>
            </StatHeader>
            <StatValue>{classes.length}</StatValue>
            <StatLabel>Total Classes</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <StatHeader>
              <StatIcon $color="green">
                <FiActivity />
              </StatIcon>
            </StatHeader>
            <StatValue>{activeClasses}</StatValue>
            <StatLabel>Active Classes</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatHeader>
              <StatIcon $color="blue">
                <FiUsers />
              </StatIcon>
            </StatHeader>
            <StatValue>{totalStudents}</StatValue>
            <StatLabel>Total Students</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <StatHeader>
              <StatIcon $color="orange">
                <FiCalendar />
              </StatIcon>
            </StatHeader>
            <StatValue>{selectedYear || 'All'}</StatValue>
            <StatLabel>Academic Year</StatLabel>
          </StatCard>
        </StatsGrid>

        {(subjects.length > 1 || years.length > 1) && (
          <FilterCard>
            <FilterGrid>
              {subjects.length > 1 && (
                <div>
                  <FilterLabel htmlFor="subjectFilter">
                    <FiFilter style={{ display: 'inline', marginRight: '6px' }} />
                    Subject
                  </FilterLabel>
                  <StyledSelect
                    id="subjectFilter"
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(e.target.value || null)}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </StyledSelect>
                </div>
              )}

              {years.length > 1 && (
                <div>
                  <FilterLabel htmlFor="yearFilter">
                    Academic Year
                  </FilterLabel>
                  <StyledSelect
                    id="yearFilter"
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value || null)}
                  >
                    <option value="">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </StyledSelect>
                </div>
              )}
            </FilterGrid>
          </FilterCard>
        )}

        <ContentSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SectionHeader>
            <SectionTitle>
              <FiBookOpen />
              {searchTerm ? `Search Results (${filteredClasses.length})` : 'All Classes'}
            </SectionTitle>
          </SectionHeader>

          {filteredClasses.length === 0 ? (
            <EmptyState
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiBookOpen />
              <EmptyTitle>
                {classes.length === 0 
                  ? 'No classes yet'
                  : 'No classes found'}
              </EmptyTitle>
              <EmptyText>
                {classes.length === 0 
                  ? "Create your first class to start organizing your students."
                  : "No classes match your current filters."}
              </EmptyText>
              {classes.length === 0 && (
                <ModernButton variant="primary" onClick={handleCreateClass}>
                  <FiPlus />
                  Create Your First Class
                </ModernButton>
              )}
            </EmptyState>
          ) : (
            <ClassesGrid>
              {filteredClasses.map((cls, index) => (
                <ClassCard
                  key={cls.class_id}
                  className={cls.is_archived ? 'archived' : ''}
                  onClick={() => handleClassClick(cls.class_id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + (index * 0.05) }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {cls.is_archived && <ArchivedBadge>Archived</ArchivedBadge>}
                  
                  <ClassHeader>
                    <ClassName>{cls.name}</ClassName>
                    <StudentCount>
                      <FiUsers />
                      {cls.student_count}
                    </StudentCount>
                  </ClassHeader>
                  
                  {cls.description && (
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '16px' }}>
                      {cls.description}
                    </p>
                  )}
                  
                  <ClassStats>
                    {cls.grade_level && (
                      <ClassStat>
                        <FiBookOpen />
                        Grade {cls.grade_level}
                      </ClassStat>
                    )}
                    {cls.subject && (
                      <ClassStat>
                        <FiBookOpen />
                        {cls.subject}
                      </ClassStat>
                    )}
                    {cls.academic_year && (
                      <ClassStat>
                        <FiCalendar />
                        {cls.academic_year}
                      </ClassStat>
                    )}
                  </ClassStats>

                  <ClassActions>
                    <ModernButton
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      Edit
                    </ModernButton>
                    <ModernButton
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle archive
                      }}
                    >
                      {cls.is_archived ? 'Restore' : 'Archive'}
                    </ModernButton>
                  </ClassActions>
                </ClassCard>
              ))}
            </ClassesGrid>
          )}
        </ContentSection>
      </Container>
    </PageWrapper>
  );
}