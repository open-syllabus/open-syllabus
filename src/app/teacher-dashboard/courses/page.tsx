'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlayCircle, FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiUsers, FiBookOpen, FiCheck } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Course, CourseWithDetails } from '@/types/database.types';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { UnifiedCourseCard } from '@/components/teacher/UnifiedCourseCard';
import { CourseForm } from '@/components/teacher/CourseForm';
import { StatsCard } from '@/components/ui/UnifiedCards';

// Modern styled components with pastel theme
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


const CoursesGrid = styled.div<{ $isGrid: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isGrid }) => 
    $isGrid ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr'
  };
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: ${({ $isGrid }) => 
      $isGrid ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr'
    };
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(152, 93, 215, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(152, 93, 215, 0.05);
  
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
    margin: 0 0 24px 0;
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithDetails | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/teacher/courses');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch courses:', data);
        throw new Error(data.error || 'Failed to fetch courses');
      }
      
      setCourses(data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate overall stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.is_published).length;
  const totalLessons = courses.reduce((sum, course) => sum + (course.lesson_count || 0), 0);
  const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowCreateForm(true);
  };
  
  const handleEditCourse = (course: CourseWithDetails) => {
    setEditingCourse(course);
    setShowCreateForm(true);
  };
  
  const handleDeleteCourse = async (course: CourseWithDetails) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teacher/courses?courseId=${course.course_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      
      // Refresh courses list
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };
  
  const handleSubmitCourse = async (courseData: Partial<Course>) => {
    setFormLoading(true);
    
    try {
      const isEditing = !!courseData.course_id;
      
      const response = await fetch('/api/teacher/courses', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to save course:', data);
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error || 'Failed to save course';
        throw new Error(errorMessage);
      }
      
      // Refresh courses list
      await fetchCourses();
      
      // Close form
      setShowCreateForm(false);
      setEditingCourse(null);
      
      // Navigate to course detail page if creating new course
      if (!isEditing) {
        router.push(`/teacher-dashboard/courses/${data.course.course_id}`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingContainer>
              <LoadingSpinner size="large" />
              <p>Loading courses...</p>
            </LoadingContainer>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <>
      <PageWrapper>
        <Container>
        <Header>
          <Title
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FiPlayCircle />
            My Courses
          </Title>
          <Subtitle>Create and manage your video courses</Subtitle>
        </Header>
        
        <StatsGrid>
          <StatsCard
            title="Total Courses"
            value={totalCourses}
            icon={<FiPlayCircle />}
            variant="primary"
          />
          
          <StatsCard
            title="Published Courses"
            value={publishedCourses}
            icon={<FiCheck />}
            variant="success"
          />
          
          <StatsCard
            title="Total Lessons"
            value={totalLessons}
            icon={<FiBookOpen />}
            variant="info"
          />
          
          <StatsCard
            title="Enrolled Students"
            value={totalStudents}
            icon={<FiUsers />}
            variant="warning"
          />
        </StatsGrid>
        
        <HeaderActions>
          <SearchContainer
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ActionButtonsContainer>
            <ViewToggle>
              <ToggleButton
                $isActive={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
                Grid
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
              onClick={handleCreateCourse}
            >
              <FiPlus />
              Create Course
            </ModernButton>
          </ActionButtonsContainer>
        </HeaderActions>

        {filteredCourses.length === 0 ? (
          <EmptyState
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <FiPlayCircle />
            <h3>{searchTerm ? 'No courses found' : 'No courses yet'}</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first video course to get started'
              }
            </p>
            {!searchTerm && (
              <ModernButton
                variant="primary"
                onClick={handleCreateCourse}
              >
                <FiPlus /> Create Your First Course
              </ModernButton>
            )}
          </EmptyState>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CoursesGrid $isGrid={viewMode === 'grid'}>
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (index * 0.05) }}
                >
                  <UnifiedCourseCard
                    course={course}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    onDuplicate={(course) => {
                      // TODO: Implement duplicate functionality
                      console.log('Duplicate course:', course);
                    }}
                  />
                </motion.div>
              ))}
            </CoursesGrid>
          </motion.div>
        )}
      </Container>
    </PageWrapper>
    
    <AnimatePresence>
      {showCreateForm && (
        <CourseForm
          course={editingCourse}
          onSubmit={handleSubmitCourse}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCourse(null);
          }}
          isLoading={formLoading}
        />
      )}
    </AnimatePresence>
    </>
  );
}