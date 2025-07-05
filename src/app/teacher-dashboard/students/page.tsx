// src/app/teacher-dashboard/students/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AddStudentModal from '@/components/teacher/AddStudentModal';
import UploadStudentsModal from '@/components/teacher/UploadStudentsModal';
import RoomAssignmentModal from '@/components/teacher/RoomAssignmentModal';
import { StatsCard } from '@/components/ui/UnifiedCards';
import { 
  FiUsers, 
  FiHome, 
  FiActivity, 
  FiDownload, 
  FiFilter, 
  FiGrid, 
  FiList,
  FiSearch,
  FiUpload,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiArchive
} from 'react-icons/fi';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';
import { Toast } from '@/components/shared/Toast';

interface Student {
  student_id: string;
  first_name: string;
  surname: string;
  username: string;
  pin_code: string;
  year_group: string | null;
  created_at: string;
  room_count?: number;
  last_activity?: string;
}

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

const SearchContainer = styled.div`
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

const StudentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const StudentCard = styled(motion.div)`
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
`;

const StudentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const StudentMeta = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const StudentStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 16px;
    height: 16px;
    color: #6B7280;
  }
`;

const StatText = styled.span`
  font-size: 0.875rem;
  color: #374151;
`;

const GradeBadge = styled.span<{ $grade: number }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ $grade }) => {
    if ($grade >= 70) return '#D1FAE5';
    if ($grade >= 60) return '#FEF3C7';
    return '#FEE2E2';
  }};
  color: ${({ $grade }) => {
    if ($grade >= 70) return '#065F46';
    if ($grade >= 60) return '#78350F';
    return '#991B1B';
  }};
`;

const ConcernBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #FEE2E2;
  color: #991B1B;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #F9FAFB;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 0.875rem;
  color: #374151;
`;

const EmptyState = styled.div`
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
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6B7280;
  font-size: 1rem;
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

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-right: 12px;
  accent-color: #7C3AED;
`;

const FloatingActionBar = styled(motion.div)`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  border: 1px solid #E5E7EB;
`;

const SelectionCount = styled.span`
  font-weight: 600;
  color: #111827;
  margin-right: 8px;
`;

const ActionDivider = styled.div`
  width: 1px;
  height: 24px;
  background: #E5E7EB;
`;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>('all');
  const [yearGroups, setYearGroups] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showRoomAssignment, setShowRoomAssignment] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'no-rooms' | 'active' | 'inactive' | 'new'>('all');
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });
  const router = useRouter();
  const { currentStep, isOnboarding, completeStep } = useOnboarding();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const fetchStudents = useCallback(async () => {
    console.log('[Students Page] Fetching students...');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/teacher/students');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch students');
      }
      const data = await response.json();
      console.log('[Students Page] Fetched', data.students?.length || 0, 'students');
      setStudents(data.students || []);
      
      // Extract unique year groups
      const uniqueYearGroups = Array.from(new Set(
        data.students
          .map((s: Student) => s.year_group)
          .filter(Boolean)
      )) as string[];
      setYearGroups(uniqueYearGroups.sort());
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  // Handle onboarding progression when reaching this page
  useEffect(() => {
    console.log('[Onboarding Debug] Students page loaded:', {
      isOnboarding,
      currentStep
    });
    
    // When user arrives at students page during onboarding, complete the navigation step
    if (isOnboarding && currentStep === OnboardingStep.NAVIGATE_TO_STUDENTS) {
      // Complete the navigation step to move to ADD_STUDENTS
      completeStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
    }
  }, [isOnboarding, currentStep, completeStep]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
    }
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const handleArchiveStudents = async () => {
    if (selectedStudents.size === 0) return;
    
    const confirmMessage = `Are you sure you want to archive ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}? Archived students can be restored later.`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await fetch('/api/teacher/students/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive students');
      }

      // Refresh student list
      await fetchStudents();
      clearSelection();
      
      showToast(`Successfully archived ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Error archiving students:', error);
      showToast(`Failed to archive students: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteStudents = async () => {
    if (selectedStudents.size === 0) return;
    
    const confirmMessage = `Are you sure you want to permanently delete ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;
    
    // Double confirmation for delete
    const secondConfirm = prompt(`Type "DELETE" to confirm permanent deletion of ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}`);
    
    if (secondConfirm !== 'DELETE') {
      showToast('Deletion cancelled', 'info');
      return;
    }
    
    try {
      const response = await fetch('/api/teacher/students/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete students');
      }

      // Refresh student list
      await fetchStudents();
      clearSelection();
      
      showToast(`Successfully deleted ${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''}`, 'success');
    } catch (error) {
      console.error('Error deleting students:', error);
      showToast(`Failed to delete students: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const assignStudentsToRoom = async (roomId: string) => {
    try {
      const response = await fetch('/api/teacher/rooms/assign-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          studentIds: Array.from(selectedStudents)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign students');
      }

      // Refresh student list to update room counts
      await fetchStudents();
    } catch (error) {
      console.error('Error assigning students:', error);
      throw error;
    }
  };

  const createRoomAndGetId = async (roomName: string): Promise<string> => {
    try {
      const response = await fetch('/api/teacher/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      return data.room.room_id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.surname}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         student.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYearGroup = selectedYearGroup === 'all' || student.year_group === selectedYearGroup;
    
    // Apply filter type
    let matchesFilter = true;
    if (filterType !== 'all') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      switch (filterType) {
        case 'no-rooms':
          matchesFilter = (student.room_count || 0) === 0;
          break;
        case 'active':
          matchesFilter = !!student.last_activity && new Date(student.last_activity) >= oneWeekAgo;
          break;
        case 'inactive':
          matchesFilter = !student.last_activity || new Date(student.last_activity) < oneWeekAgo;
          break;
        case 'new':
          matchesFilter = new Date(student.created_at) >= oneWeekAgo;
          break;
      }
    }
    
    return matchesSearch && matchesYearGroup && matchesFilter;
  });

  const downloadCSV = () => {
    const headers = ['First Name', 'Surname', 'Username', 'PIN', 'Year Group', 'Rooms', 'Created'];
    const rows = filteredStudents.map(student => [
      student.first_name,
      student.surname,
      student.username,
      student.pin_code,
      student.year_group || 'N/A',
      (student.room_count || 0).toString(),
      new Date(student.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <LoadingText>Loading students...</LoadingText>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  const totalRooms = students.reduce((sum, s) => sum + (s.room_count || 0), 0);
  const studentsInRooms = students.filter(s => (s.room_count || 0) > 0).length;
  const studentsWithoutRooms = students.filter(s => (s.room_count || 0) === 0).length;
  const averageRoomsPerStudent = students.length > 0 ? (totalRooms / students.length).toFixed(1) : '0';
  
  // Calculate time-based metrics
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const studentsAddedThisWeek = students.filter(s => 
    new Date(s.created_at) >= oneWeekAgo
  ).length;
  
  // Calculate active/inactive students based on last_activity
  const activeThisWeek = students.filter(s => {
    if (!s.last_activity) return false;
    return new Date(s.last_activity) >= oneWeekAgo;
  }).length;
  
  const inactiveSevenDays = students.filter(s => {
    if (!s.last_activity) return true; // No activity = inactive
    return new Date(s.last_activity) < oneWeekAgo;
  }).length;

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FiUsers />
            Students
          </Title>
          <Subtitle>Manage your class list and assign students to rooms</Subtitle>
          {/* Debug info */}
          {isOnboarding && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 12px',
              background: '#7C3AED',
              color: 'white',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Onboarding Step: {currentStep}
            </div>
          )}
        </Header>

        <StatsGrid>
          <StatsCard
            title="Total Students"
            value={students.length}
            icon={<FiUsers />}
            variant="primary"
            onClick={() => setFilterType('all')}
          />
          
          <StatsCard
            title="Need Room Assignment"
            value={studentsWithoutRooms}
            icon={<FiHome />}
            variant="warning"
            onClick={() => setFilterType('no-rooms')}
          />
          
          <StatsCard
            title="Active This Week"
            value={activeThisWeek}
            icon={<FiActivity />}
            variant="success"
            onClick={() => setFilterType('active')}
          />
          
          <StatsCard
            title="Inactive 7+ Days"
            value={inactiveSevenDays}
            icon={<FiX />}
            variant="danger"
            onClick={() => setFilterType('inactive')}
          />
        </StatsGrid>

        {/* Prominent banner for unassigned students */}
        {studentsWithoutRooms > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '2px solid #F59E0B',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              marginTop: '24px',
              boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiHome style={{ color: '#F59E0B', fontSize: '1.5rem' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#92400E', fontSize: '1.125rem', fontWeight: 600 }}>
                    {studentsWithoutRooms} Student{studentsWithoutRooms !== 1 ? 's' : ''} Need{studentsWithoutRooms === 1 ? 's' : ''} Room Assignment
                  </h3>
                  <p style={{ margin: 0, color: '#78350F', fontSize: '0.875rem' }}>
                    Select students below and click "Assign to Rooms" to create or add to a room
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ActionButtonsContainer id="action-buttons-container">
            <ViewToggle>
              <ToggleButton
                $isActive={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
                Cards
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
              variant="secondary"
              size="medium"
              onClick={downloadCSV}
              disabled={filteredStudents.length === 0}
            >
              <FiDownload />
              Export CSV
            </ModernButton>
            
            <div id="add-students-buttons" style={{ display: 'flex', gap: '16px', position: 'relative' }}>
              <ModernButton
                id="upload-csv-button"
                variant="primary"
                size="medium"
                onClick={() => {
                  console.log('Import CSV button clicked. Current step:', currentStep);
                  setShowUploadModal(true);
                  // Progress onboarding when opening upload modal
                  if (isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS) {
                    completeStep(OnboardingStep.ADD_STUDENTS);
                  }
                }}
                style={{ position: 'relative' }}
              >
                <FiUpload />
                Import CSV
              </ModernButton>
              
              <ModernButton
                id="add-student-button"
                variant="secondary"
                size="medium"
                onClick={() => {
                  console.log('Add Student button clicked. Current step:', currentStep);
                  setShowAddModal(true);
                }}
                style={{ position: 'relative' }}
              >
                <FiPlus />
                Add Student
              </ModernButton>
            </div>
          </ActionButtonsContainer>
        </HeaderActions>

        <FilterCard>
          <FilterGrid>
            <div>
              <FilterLabel htmlFor="yearGroupFilter">
                Year Group
              </FilterLabel>
              <StyledSelect
                id="yearGroupFilter"
                value={selectedYearGroup}
                onChange={(e) => setSelectedYearGroup(e.target.value)}
              >
                <option value="all">All Years</option>
                {yearGroups.map(year => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </StyledSelect>
            </div>
          </FilterGrid>
        </FilterCard>

        {selectedStudents.size === 0 && filteredStudents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#F3E8FF',
              border: '1px solid #E9D5FF',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.875rem',
              color: '#6B21A8'
            }}
          >
            <FiCheckCircle style={{ flexShrink: 0, fontSize: '1.25rem' }} />
            <span>
              <strong>Tip:</strong> Select students using the checkboxes to assign them to rooms in bulk or perform other actions.
            </span>
          </motion.div>
        )}

        {filterType !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              color: '#374151'
            }}
          >
            <span>
              Showing {filterType === 'no-rooms' ? 'students without room assignments' : 
                       filterType === 'active' ? 'students active this week' :
                       filterType === 'inactive' ? 'students inactive for 7+ days' :
                       'new students this week'}
            </span>
            <span 
              style={{ cursor: 'pointer', textDecoration: 'underline', color: '#7C3AED' }} 
              onClick={() => setFilterType('all')}
            >
              Clear filter
            </span>
          </motion.div>
        )}

        {error && (
          <Alert variant="error" style={{ marginBottom: '24px' }}>
            {error}
            {error.includes('no school assigned') && (
              <div style={{ marginTop: '16px' }}>
                <ModernButton
                  variant="primary"
                  size="small"
                  onClick={async () => {
                    setError(null);
                    try {
                      const response = await fetch('/api/teacher/school/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ school_name: 'My School' })
                      });
                      
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to create school');
                      }
                      
                      const data = await response.json();
                      console.log('School created:', data);
                      
                      // Refresh the page to reload with the new school
                      window.location.reload();
                    } catch (err) {
                      console.error('Error creating school:', err);
                      setError(err instanceof Error ? err.message : 'Failed to create school');
                    }
                  }}
                >
                  Create School Now
                </ModernButton>
                <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6B7280' }}>
                  This will create a default school for you. You can update the name later in settings.
                </p>
              </div>
            )}
          </Alert>
        )}

        {filteredStudents.length === 0 ? (
          <EmptyState>
            <FiUsers />
            <EmptyTitle>
              {searchTerm || selectedYearGroup !== 'all'
                ? 'No students found'
                : 'No students yet'}
            </EmptyTitle>
            <EmptyText>
              {searchTerm || selectedYearGroup !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add students individually or import from CSV'}
            </EmptyText>
            {!searchTerm && selectedYearGroup === 'all' && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <ModernButton
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FiUpload />
                  Import CSV
                </ModernButton>
                <ModernButton
                  variant="secondary"
                  onClick={() => setShowAddModal(true)}
                >
                  <FiPlus />
                  Add Student
                </ModernButton>
              </div>
            )}
          </EmptyState>
        ) : viewMode === 'grid' ? (
          <StudentsGrid>
            <AnimatePresence>
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.student_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <StudentHeader>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Checkbox
                        checked={selectedStudents.has(student.student_id)}
                        onChange={() => handleSelectStudent(student.student_id)}
                        style={{ marginTop: '2px' }}
                      />
                      <StudentInfo>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StudentName>{student.first_name} {student.surname}</StudentName>
                          {(!student.room_count || student.room_count === 0) && (
                            <span style={{
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid #FCD34D'
                            }}>
                              No Room
                            </span>
                          )}
                        </div>
                      <StudentMeta>
                        <FiUsers />
                        {student.username}
                        {student.year_group && (
                          <>
                            <span>•</span>
                            Year {student.year_group}
                          </>
                        )}
                      </StudentMeta>
                      </StudentInfo>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ModernButton
                        variant="ghost"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(student.pin_code);
                          showToast(`PIN ${student.pin_code} copied to clipboard`, 'success');
                        }}
                        title="Copy PIN"
                      >
                        <FiCopy />
                      </ModernButton>
                    </div>
                  </StudentHeader>
                  
                  <StudentStats>
                    <StatItem>
                      <FiHome />
                      <StatText>{student.room_count || 0} rooms</StatText>
                    </StatItem>
                    <StatItem>
                      <StatText style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        PIN: {student.pin_code}
                      </StatText>
                    </StatItem>
                  </StudentStats>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <ModernButton
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/teacher-dashboard/students/${student.student_id}`);
                      }}
                      style={{ flex: 1 }}
                    >
                      <FiEdit2 />
                      View Details
                    </ModernButton>
                    {student.room_count && student.room_count > 0 && (
                      <ModernButton
                        variant="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/teacher-dashboard/students/${student.student_id}/stats`);
                        }}
                        style={{ flex: 1 }}
                      >
                        <FiActivity />
                        View Activity
                      </ModernButton>
                    )}
                  </div>
                </StudentCard>
              ))}
            </AnimatePresence>
          </StudentsGrid>
        ) : (
          <TableContainer>
            <StyledTable>
              <TableHeader>
                <tr>
                  <TableHeaderCell style={{ width: '50px' }}>
                    <Checkbox
                      id="select-all-checkbox"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => {
                        handleSelectAll();
                        if (isOnboarding && currentStep === OnboardingStep.SELECT_ALL_STUDENTS) {
                          completeStep(OnboardingStep.SELECT_ALL_STUDENTS);
                        }
                      }}
                      style={{ margin: 0 }}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Username</TableHeaderCell>
                  <TableHeaderCell>PIN</TableHeaderCell>
                  <TableHeaderCell>Year</TableHeaderCell>
                  <TableHeaderCell>Rooms</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.student_id}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.has(student.student_id)}
                        onChange={() => handleSelectStudent(student.student_id)}
                        style={{ margin: 0 }}
                      />
                    </TableCell>
                    <TableCell>{student.first_name} {student.surname}</TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {student.pin_code}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(student.pin_code);
                            showToast(`PIN ${student.pin_code} copied to clipboard`, 'success');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#6B7280'
                          }}
                          title="Copy PIN"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>{student.year_group || '-'}</TableCell>
                    <TableCell>
                      {student.room_count && student.room_count > 0 ? (
                        student.room_count
                      ) : (
                        <span style={{
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid #FCD34D',
                          display: 'inline-block'
                        }}>
                          No Room
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <ModernButton
                          variant="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/teacher-dashboard/students/${student.student_id}`);
                          }}
                        >
                          View
                        </ModernButton>
                        {student.room_count && student.room_count > 0 && (
                          <ModernButton
                            variant="secondary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/teacher-dashboard/students/${student.student_id}/stats`);
                            }}
                          >
                            Activity
                          </ModernButton>
                        )}
                        <ModernButton
                          variant="ghost"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const credentials = `Username: ${student.username}\nPIN: ${student.pin_code}`;
                            navigator.clipboard.writeText(credentials);
                            showToast('Login credentials copied to clipboard', 'success');
                          }}
                          title="Copy login credentials"
                        >
                          <FiCopy />
                        </ModernButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
          </TableContainer>
        )}
        
        {/* Floating Action Bar */}
        <AnimatePresence>
          {selectedStudents.size > 0 && (
            <FloatingActionBar
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <SelectionCount>
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </SelectionCount>
              <ActionDivider />
              <ModernButton
                id="assign-to-rooms-button"
                variant="primary"
                size="medium"
                onClick={() => setShowRoomAssignment(true)}
              >
                <FiHome />
                Assign to Rooms
              </ModernButton>
              <ModernButton
                variant="secondary"
                size="medium"
                onClick={() => {
                  const studentIds = Array.from(selectedStudents);
                  const selectedStudentData = students.filter(s => studentIds.includes(s.student_id));
                  const csvContent = selectedStudentData.map(s => 
                    `${s.first_name},${s.surname},${s.username},${s.pin_code}`
                  ).join('\n');
                  const blob = new Blob([`First Name,Surname,Username,PIN\n${csvContent}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `selected-students-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
              >
                <FiDownload />
                Export Selected
              </ModernButton>
              <ActionDivider />
              <ModernButton
                variant="secondary"
                size="medium"
                onClick={handleArchiveStudents}
                title="Archive selected students"
              >
                <FiArchive />
                Archive
              </ModernButton>
              <ModernButton
                variant="danger"
                size="medium"
                onClick={handleDeleteStudents}
                title="Permanently delete selected students"
              >
                <FiTrash2 />
                Delete
              </ModernButton>
              <ActionDivider />
              <ModernButton
                variant="ghost"
                size="medium"
                onClick={clearSelection}
              >
                <FiX />
                Clear
              </ModernButton>
            </FloatingActionBar>
          )}
        </AnimatePresence>
        
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchStudents}
        />
        
        <UploadStudentsModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            // If user closes modal during UPLOAD_STUDENTS step, go back to ADD_STUDENTS
            if (isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS) {
              // Note: We don't have a way to go back to previous step, so the highlight will disappear
              // This is acceptable as the user can still see the buttons
            }
          }}
          onSuccess={async (showRoomAssignment?: boolean) => {
            console.log('[Students Page] Upload success callback. Onboarding:', isOnboarding, 'Step:', currentStep);
            
            // Store current student IDs before refresh
            const previousStudentIds = new Set(students.map(s => s.student_id));
            
            // Fetch updated student list
            await fetchStudents();
            
            // Close the modal after fetching students
            setShowUploadModal(false);
            
            // During onboarding, don't immediately show room assignment
            if (isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS) {
              console.log('[Students Page] Completing UPLOAD_STUDENTS step');
              // Just complete the step, user needs to select students first
              completeStep(OnboardingStep.UPLOAD_STUDENTS);
              // The SELECT_ALL_STUDENTS tooltip will guide them next
            } else if (showRoomAssignment) {
              // Normal flow - select newly imported students and show room assignment
              setTimeout(() => {
                // Use the updated students from state after fetchStudents
                setStudents(currentStudents => {
                  const newUnassignedStudents = currentStudents
                    .filter(s => !previousStudentIds.has(s.student_id) || (!s.room_count || s.room_count === 0));
                  setSelectedStudents(new Set(newUnassignedStudents.map(s => s.student_id)));
                  return currentStudents;
                });
                setShowRoomAssignment(true);
              }, 500);
            }
            // Progress onboarding if on ADD_STUDENTS step
            else if (isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS) {
              console.log('[Students Page] Completing ADD_STUDENTS step');
              completeStep(currentStep);
            }
            
            // Ensure we stay on this page - log any unexpected navigation
            console.log('[Students Page] Still on students page. Path:', window.location.pathname);
          }}
        />
        
        <RoomAssignmentModal
          isOpen={showRoomAssignment}
          onClose={() => {
            setShowRoomAssignment(false);
            clearSelection();
            // If we just created a room during onboarding, refresh the page data
            if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
              fetchStudents(); // Refresh to show updated room counts
            }
          }}
          selectedStudentIds={Array.from(selectedStudents)}
          onAssign={assignStudentsToRoom}
          onCreateRoom={createRoomAndGetId}
        />
      </Container>
      
      {/* Onboarding Highlights and Tooltips */}
      <Highlight
        selector="#add-students-buttons"
        show={isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS}
        cutout={true}
      />
      <Tooltip
        key={`tooltip-${currentStep}`}
        selector="#add-students-buttons"
        title="Add Your First Students"
        text="Import a CSV file with multiple students (recommended) or add students one by one. Click Import CSV to get started."
        buttonText="Got it"
        onButtonClick={() => {}}
        show={isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS}
        placement="bottom"
      />
      
      <Highlight
        selector="#select-all-checkbox"
        show={isOnboarding && currentStep === OnboardingStep.SELECT_ALL_STUDENTS}
        cutout={true}
      />
      <Tooltip
        key={`tooltip-${currentStep}`}
        selector="#select-all-checkbox"
        title="Select Your Students"
        text="Use this checkbox to select all students, or select them individually. Once selected, you can assign them to rooms."
        buttonText="Got it"
        onButtonClick={() => {}}
        show={isOnboarding && currentStep === OnboardingStep.SELECT_ALL_STUDENTS}
        placement="right"
      />
      
      <Highlight
        selector="#assign-to-rooms-button"
        show={isOnboarding && currentStep === OnboardingStep.CREATE_ROOM && selectedStudents.size > 0}
        cutout={true}
      />
      <Tooltip
        key={`tooltip-${currentStep}`}
        selector="#assign-to-rooms-button"
        title="Create Your First Room"
        text="Now click here to create a room and assign your selected students to it."
        buttonText="Got it"
        onButtonClick={() => {}}
        show={isOnboarding && currentStep === OnboardingStep.CREATE_ROOM && selectedStudents.size > 0}
        placement="top"
      />
      
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </PageWrapper>
  );
}