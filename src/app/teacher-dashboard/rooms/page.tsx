// src/app/teacher-dashboard/rooms/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import EditRoomModal from '@/components/teacher/EditRoomModal';
import ArchivePanel from '@/components/teacher/ArchivePanel';
// import RoomForm from '@/components/teacher/RoomForm'; // No longer used - we redirect to Students page
import { FullPageLoader } from '@/components/shared/AnimatedLoader';
import { ModernRoomsList } from '@/components/teacher/ModernRoomsList';
import type { Room as BaseRoom, Chatbot, Course, TeacherRoom } from '@/types/database.types';
import { StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';
import { 
  FiArchive, 
  FiHome, 
  FiUsers, 
  FiActivity, 
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiMoreVertical,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

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
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled(motion.div)`
  position: relative;
  flex: 1;
  
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
  margin-top: 32px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
`;

// Removed custom StatCard components - using shared UI component instead

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

const RoomsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

// Define room color scheme
const ROOM_COLORS = {
  default: {
    accent: '#7C3AED',  // Purple
    background: '#EDE9FE',  // Light Purple
    border: '#DDD6FE'  // Purple border
  }
};

const RoomCard = styled(motion.div)`
  background: white;
  border: 2px solid ${ROOM_COLORS.default.accent};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: ${ROOM_COLORS.default.background};
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const RoomInfo = styled.div`
  flex: 1;
`;

const RoomName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const RoomCode = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.brand.primary}20;
  color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RoomDescription = styled.p`
  color: #6B7280;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
`;

const RoomStats = styled.div`
  display: flex;
  gap: 16px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
`;

const RoomStat = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  color: #6B7280;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const MenuButton = styled.button`
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  svg {
    width: 14px;
    height: 14px;
    color: #6B7280;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: fixed;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 10000;
  min-width: 180px;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #111827;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: rgba(124, 58, 237, 0.05);
    color: #7C3AED;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 60px;
  
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

const ArchiveButton = styled(ModernButton)`
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 100;
  background: white;
  color: #6B7280;
  border: 2px solid #E5E7EB;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #F3F4F6;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: #7C3AED;
    color: #7C3AED;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    bottom: 30px;
    right: 30px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    bottom: 20px;
    right: 20px;
  }
`;

// Modal styled components with modern theme
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;

const ModalText = styled.p`
  margin: 0 0 24px 0;
  color: #6B7280;
  font-size: 1rem;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

interface DeleteModalProps {
  isOpen: boolean;
  itemType: 'Room';
  itemName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteModal({ isOpen, itemType, itemName, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalTitle>Delete {itemType}</ModalTitle>
            <ModalText>
              Are you sure you want to delete the {itemType.toLowerCase()} &quot;
              <strong>{itemName}</strong>
              &quot;? This action cannot be undone and may affect associated data (e.g., student memberships, chat history).
            </ModalText>
            <ModalActions>
              <ModernButton variant="ghost" onClick={onCancel} disabled={isDeleting}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="danger"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : `Yes, Delete ${itemType}`}
              </ModernButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}


export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState<TeacherRoom[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<BaseRoom | null>(null);
  const [showArchivedRooms, setShowArchivedRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [unassignedStudentsCount, setUnassignedStudentsCount] = useState<number>(0);
  const router = useRouter();
  const { currentStep, isOnboarding, completeStep } = useOnboarding();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'Room';
    id: string | null;
    name: string;
  }>({ isOpen: false, type: 'Room', id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    id: string | null;
    name: string;
  }>({ isOpen: false, id: null, name: '' });
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const coursesResponse = await fetch('/api/teacher/courses');
      if (!coursesResponse.ok) {
        const errData = await coursesResponse.json().catch(()=>({error: `Failed to parse courses error response (status ${coursesResponse.status})`}));
        throw new Error(errData.error || `Failed to fetch courses (status ${coursesResponse.status})`);
      }
      const coursesJson = await coursesResponse.json();
      // The API returns { courses: Course[] }
      const coursesData: Course[] = coursesJson.courses || [];
      // Only show published courses for room assignment
      const publishedCourses = Array.isArray(coursesData) ? coursesData.filter(course => course.is_published) : [];
      setCourses(publishedCourses);
    } catch (err) {
      console.error("Error fetching courses:", err);
      // Don't set error state for courses failure, just log it
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roomsResponse, chatbotsResponse, studentsResponse] = await Promise.all([
        fetch('/api/teacher/rooms'),
        fetch('/api/teacher/chatbots'),
        fetch('/api/teacher/students')
      ]);

      if (!roomsResponse.ok) {
        const errData = await roomsResponse.json().catch(()=>({error: `Failed to parse rooms error response (status ${roomsResponse.status})`}));
        throw new Error(errData.error || `Failed to fetch rooms (status ${roomsResponse.status})`);
      }
      if (!chatbotsResponse.ok) {
        const errData = await chatbotsResponse.json().catch(()=>({error: `Failed to parse chatbots error response (status ${chatbotsResponse.status})`}));
        throw new Error(errData.error || `Failed to fetch chatbots (status ${chatbotsResponse.status})`);
      }

      const roomsData: TeacherRoom[] = await roomsResponse.json();
      const chatbotsData: Chatbot[] = await chatbotsResponse.json();
      
      setRooms(roomsData);
      setChatbots(chatbotsData);
      
      // Check for unassigned students (optional - don't fail if it errors)
      if (studentsResponse.ok) {
        try {
          const studentsData = await studentsResponse.json();
          const unassignedCount = studentsData.students?.filter((s: any) => !s.room_count || s.room_count === 0).length || 0;
          setUnassignedStudentsCount(unassignedCount);
        } catch (e) {
          console.log('Could not fetch student data:', e);
        }
      }
      
      // Fetch courses separately
      await fetchCourses();
    } catch (err) {
      console.error("Error fetching page data:", err);
      setError(err instanceof Error ? err.message : 'Could not load data.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCourses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoomCreatedOrUpdated = () => {
    setShowRoomForm(false);
    setEditingRoom(null);
    fetchData();
  };


  const openDeleteModal = (room: BaseRoom) => {
    setDeleteModal({ isOpen: true, type: 'Room', id: room.room_id, name: room.room_name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: 'Room', id: null, name: '' });
  };
  
  const openArchiveModal = (room: BaseRoom) => {
    setArchiveModal({ isOpen: true, id: room.room_id, name: room.room_name });
  };
  
  const closeArchiveModal = () => {
    setArchiveModal({ isOpen: false, id: null, name: '' });
  };
  
  const handleArchiveRoom = async () => {
    if (!archiveModal.id) return;
    
    setIsArchiving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/teacher/rooms/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: archiveModal.id,
          archive: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to archive room`);
      }
      
      console.log(`Room ${archiveModal.id} archived successfully.`);
      closeArchiveModal();
      fetchData();
    } catch (error) {
      console.error(`Error archiving Room:`, error);
      setError(error instanceof Error ? error.message : `Failed to archive Room.`);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    setError(null);

    try {
        const response = await fetch(`/api/teacher/rooms/${deleteModal.id}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete room`);
        }

        console.log(`Room ${deleteModal.id} deleted successfully.`);
        closeDeleteModal();
        fetchData();
    } catch (error) {
        console.error(`Error deleting Room:`, error);
        setError(error instanceof Error ? error.message : `Failed to delete Room.`);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleEditRoom = (room: BaseRoom) => {
    setEditingRoom(room);
  };

  const handleCloseEditRoom = () => {
    setEditingRoom(null);
  };

  const handleRoomEditSuccess = () => {
    setEditingRoom(null);
    fetchData();
  };


  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate stats
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(room => room.is_active).length;
  const totalStudents = rooms.reduce((sum, room) => sum + (room.student_count || 0), 0);
  const totalChatbots = rooms.reduce((sum, room) => sum + (room.room_chatbots?.length || 0), 0);

  if (isLoading) {
    return <FullPageLoader message="Loading your classrooms..." variant="dots" />;
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
            <FiUsers />
            Rooms
          </Title>
          <Subtitle>Create rooms and add students from your roster</Subtitle>
        </Header>

        {/* Help text to explain the new flow */}
        <div style={{
          background: '#F3F4F6',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          <FiUsers style={{ color: '#7C3AED', flexShrink: 0 }} />
          <span>
            To create a room, go to <strong>Students</strong> → select students → click <strong>Assign to Rooms</strong>
          </span>
        </div>

        <HeaderActions>
          <SearchContainer
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

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
            variant="ghost"
            size="medium"
            onClick={() => setShowArchivedRooms(true)}
            style={{ borderColor: '#E5E7EB' }}
          >
            <FiArchive />
            Archived
          </ModernButton>

          <ModernButton
            variant="primary"
            size="medium"
            onClick={() => {
              if (isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS) {
                completeStep(OnboardingStep.ADD_STUDENTS);
              }
              
              // ALWAYS redirect to students page for the correct flow
              router.push('/teacher-dashboard/students');
              // Show a toast message to explain the flow
              setTimeout(() => {
                const event = new CustomEvent('showToast', {
                  detail: {
                    message: 'Select students first, then assign them to a room',
                    type: 'info'
                  }
                });
                window.dispatchEvent(event);
              }, 500);
            }}
            className="add-room-button"
            title="Create a room by selecting students first"
          >
            <FiUsers />
            Create Room with Students
          </ModernButton>
        </HeaderActions>


        {error && <Alert variant="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

        <StatsGrid>
          <UnifiedStatsCard
            icon={<FiHome />}
            title="Total Rooms"
            value={totalRooms}
            variant="primary"
            onClick={() => router.push('/teacher-dashboard/rooms')}
          />

          <UnifiedStatsCard
            icon={<FiActivity />}
            title="Active Rooms"
            value={activeRooms}
            variant="success"
          />

          <UnifiedStatsCard
            icon={<FiUsers />}
            title="Total Students"
            value={totalStudents}
            variant="secondary"
            onClick={() => router.push('/teacher-dashboard/students')}
          />

          <UnifiedStatsCard
            icon={<FiMessageSquare />}
            title="Active Skolrs"
            value={totalChatbots}
            variant="warning"
            onClick={() => router.push('/teacher-dashboard/chatbots')}
          />
        </StatsGrid>

        <ContentSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SectionHeader>
            <SectionTitle>
              <FiHome />
              {searchTerm ? `Search Results (${filteredRooms.length})` : 'All Rooms'}
            </SectionTitle>
          </SectionHeader>

          {filteredRooms.length === 0 ? (
            <EmptyState
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiHome />
              <EmptyTitle>
                {searchTerm ? 'No rooms found' : 'No rooms yet'}
              </EmptyTitle>
              <EmptyText>
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : unassignedStudentsCount > 0 
                    ? 'Start by selecting students to add to your first classroom'
                    : 'Create your first classroom to get started'
                }
              </EmptyText>
              {!searchTerm && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                  {unassignedStudentsCount > 0 && (
                    <ModernButton
                      variant="primary"
                      onClick={() => router.push('/teacher-dashboard/students')}
                    >
                      <FiUsers />
                      Select Students ({unassignedStudentsCount})
                    </ModernButton>
                  )}
                  <ModernButton
                    variant={unassignedStudentsCount > 0 ? "secondary" : "primary"}
                    onClick={() => {
                      router.push('/teacher-dashboard/students');
                      setTimeout(() => {
                        const event = new CustomEvent('showToast', {
                          detail: {
                            message: 'Select students first, then assign them to a room',
                            type: 'info'
                          }
                        });
                        window.dispatchEvent(event);
                      }, 500);
                    }}
                    title="Go to Students page to create a room"
                  >
                    <FiUsers />
                    Go to Students → Create Room
                  </ModernButton>
                </div>
              )}
            </EmptyState>
          ) : (
            <ModernRoomsList
              rooms={filteredRooms}
              onCreateRoom={() => {
                router.push('/teacher-dashboard/students');
                setTimeout(() => {
                  const event = new CustomEvent('showToast', {
                    detail: {
                      message: 'Select students first, then assign them to a room',
                      type: 'info'
                    }
                  });
                  window.dispatchEvent(event);
                }, 500);
              }}
              onEditRoom={handleEditRoom}
              onDeleteRoom={openDeleteModal}
              onArchiveRoom={openArchiveModal}
              canCreateRoom={chatbots.length > 0}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </ContentSection>

        <AnimatePresence>
          {!showArchivedRooms && (
            <ArchiveButton
              as={motion.button}
              variant="secondary"
              size="large"
              onClick={() => setShowArchivedRooms(true)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiArchive />
              View Archive
            </ArchiveButton>
          )}
        </AnimatePresence>
        
        {showArchivedRooms && (
          <ArchivePanel 
            type="rooms"
            onItemRestored={fetchData}
          />
        )}

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          chatbots={chatbots}
          courses={courses}
          onClose={handleCloseEditRoom}
          onSuccess={handleRoomEditSuccess}
          onRefreshCourses={fetchCourses}
        />
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        itemType={deleteModal.type}
        itemName={deleteModal.name}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteModal}
        isDeleting={isDeleting}
      />
      
      {/* Archive Modal */}
      <AnimatePresence>
      {/* RoomForm is no longer used - we redirect to Students page for the correct flow */}
      {/* {showRoomForm && (
        <RoomForm
          chatbots={chatbots}
          courses={courses}
          onClose={() => setShowRoomForm(false)}
          onSuccess={handleRoomCreatedOrUpdated}
          onRefreshCourses={fetchCourses}
        />
      )} */}

        {archiveModal.isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeArchiveModal}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>Archive Room</ModalTitle>
              <ModalText>
                Are you sure you want to archive the room &quot;
                <strong>{archiveModal.name}</strong>
                &quot;? The room will still be accessible but won't appear in your active rooms list.
              </ModalText>
              <ModalActions>
                <ModernButton variant="ghost" onClick={closeArchiveModal} disabled={isArchiving}>
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="secondary"
                  onClick={handleArchiveRoom}
                  disabled={isArchiving}
                >
                  {isArchiving ? 'Archiving...' : 'Archive Room'}
                </ModernButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      </Container>

      {/* Onboarding Highlights */}
      <Highlight
        selector=".add-room-button"
        show={isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS}
      >
        <Tooltip
          selector=".add-room-button"
          title="Create Your First Room"
          text="Click 'Add Room' to create your first classroom. You'll be able to add students and assign Skolrs to this room."
          buttonText="Got it"
          onButtonClick={() => {
            // User acknowledged
          }}
          show={isOnboarding && currentStep === OnboardingStep.ADD_STUDENTS}
          placement="left"
        />
      </Highlight>
    </PageWrapper>
  );
}