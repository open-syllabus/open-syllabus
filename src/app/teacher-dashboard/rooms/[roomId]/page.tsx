// src/app/teacher-dashboard/rooms/[roomId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container as OldContainer, Card, Alert, Badge } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StudentCsvUpload from '@/components/teacher/StudentCsvUpload';
import ArchivePanel from '@/components/teacher/ArchivePanel';
import { AnimatePresence, motion } from 'framer-motion';
import { FiHome, FiUsers, FiMessageSquare, FiBookOpen, FiDownload, FiUpload, FiArchive, FiActivity, FiGrid, FiStar, FiClipboard, FiBook, FiEye, FiPlus } from 'react-icons/fi';
import type { Room, Chatbot, Course, Profile, CourseWithDetails } from '@/types/database.types'; // Base types
import { UnifiedChatbotCard } from '@/components/teacher/UnifiedBotCard';
import { UnifiedCourseCard } from '@/components/teacher/UnifiedCourseCard';
import BotTypeSelection from '@/components/teacher/BotTypeSelection';
import { StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { OnboardingPopup } from '@/components/onboarding/OnboardingPopup';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';

// --- Data Structure for the Page State ---
interface StudentInRoom extends Pick<Profile, 'user_id' | 'full_name'> {
  joined_at: string;
  email?: string; // Make email optional for backward compatibility
  username?: string;
}

interface LinkedClass {
  class_id: string;
  name: string;
  description?: string;
  grade_level?: string;
  subject?: string;
  student_count: number;
  linked_at?: string;
}

interface RoomDetailsData {
  room: Room;
  chatbots: Partial<Chatbot>[];
  courses: CourseWithDetails[];
  students: StudentInRoom[];
  linkedClasses?: LinkedClass[];
}

// MagicLinkResponse interface removed

// --- Styled Components ---

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
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
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  text-align: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
    margin: 16px;
  }
  
  h3 {
    margin-bottom: 16px;
    font-size: 24px;
    font-weight: 700;
    color: black;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 20px;
    }
  }
  
  p {
    margin-bottom: 24px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 14px;
      margin-bottom: 16px;
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    gap: 12px;
    
    button {
      width: 100%;
    }
  }
`;
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

const Header = styled.header`
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: 16px;
  }
`;

const Title = styled.h1`
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

const TitleSection = styled.div`
  flex: 1;
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

const ContentSection = styled.section`
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

// Chatbots Section
const ChatbotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

// ItemCard component removed - using UnifiedChatbotCard instead

// Students Section
const StudentListTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: ${({ theme }) => theme.spacing.md};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  }
  th {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  // Styled Link for student names in table
  td a { // Target <a> rendered by <Link>
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    font-weight: 500;
    &:hover {
      color: ${({ theme }) => theme.colors.brand.primary};
      text-decoration: underline;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none; // Hide table on smaller screens
  }
`;

const StudentListMobile = styled.div`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: block; // Show cards on smaller screens
  }
`;

const StudentCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  transition: all 0.3s ease;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  .student-name-link { // Use a class for the Link component itself
    font-weight: 600;
    color: ${({ theme }) => theme.colors.brand.primary};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    display: block;
    text-decoration: none;
     &:hover {
        text-decoration: underline;
     }
  }
  .student-email, .joined-at {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text.muted};
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;


const EmptyStateText = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.muted};
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SkolrModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const SkolrModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
`;

const AddSkolrSection = styled.div`
  margin-bottom: 24px;
`;

const SkolrCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const SkolrCard = styled(motion.button)<{ $color: string }>`
  background: #F9FAFB;
  border: 2px solid ${({ $color }) => $color}20;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
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
    background: ${({ $color }) => $color};
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  svg {
    width: 48px;
    height: 48px;
    color: ${({ $color }) => $color};
  }
  
  &:hover {
    background: white;
    border-color: ${({ $color }) => $color};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ $color }) => $color}20;
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SkolrCardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const SkolrCardDescription = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
`;

const SkolrModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  
  button {
    background: none;
    border: none;
    font-size: 24px;
    color: #6B7280;
    cursor: pointer;
    padding: 4px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: #F3F4F6;
      color: #111827;
    }
  }
`;

// Magic link styled components removed



export default function TeacherRoomDetailPage() {
  const [roomDetails, setRoomDetails] = useState<RoomDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<StudentInRoom | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showArchivedStudents, setShowArchivedStudents] = useState(false);
  const [archivingStudents, setArchivingStudents] = useState<Record<string, boolean>>({});
  const [deletingStudents, setDeletingStudents] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentInRoom | null>(null);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [showClassLink, setShowClassLink] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<LinkedClass[]>([]);
  const [linkedClassIds, setLinkedClassIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [linkingClasses, setLinkingClasses] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { currentStep, isOnboarding, completeStep } = useOnboarding();
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);

  const fetchRoomDetails = useCallback(async () => {
    if (!roomId) {
      setError("Room ID not found in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/room-details?roomId=${roomId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch room details (status ${response.status})`);
      }
      const data: RoomDetailsData = await response.json();
      // Room data fetched successfully
      setRoomDetails(data);
      
      // Check if we should show onboarding popup
      // Only show it if we haven't already shown it (to prevent duplicate tooltips)
      if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR && data.chatbots.length === 0 && !showOnboardingPopup) {
        setShowOnboardingPopup(true);
      }
    } catch (err) {
      // Error fetching room details
      setError(err instanceof Error ? err.message : "Could not load room details.");
      setRoomDetails(null);
    } finally {
      setLoading(false);
    }
  }, [roomId, isOnboarding, currentStep]);

  useEffect(() => {
    fetchRoomDetails();
    
    // Refresh every 30 seconds while page is open
    const interval = setInterval(() => {
      if (!document.hidden) {
        // Auto-refresh timer triggered
        fetchRoomDetails();
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [roomId, fetchRoomDetails]); // Only re-run when roomId changes

  // Fetch available classes when modal opens
  useEffect(() => {
    if (showClassLink) {
      fetchAvailableClasses();
    }
  }, [showClassLink]);

  // Debug: Monitor showCsvUpload state changes
  useEffect(() => {
    // showCsvUpload state changed
  }, [showCsvUpload]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };
  
  const openArchiveModal = (student: StudentInRoom) => {
    setStudentToArchive(student);
    setShowArchiveModal(true);
  };
  
  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setStudentToArchive(null);
  };
  
  const openDeleteModal = (student: StudentInRoom) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };
  
  const archiveStudent = async (studentId: string) => {
    // Mark student as archiving
    setArchivingStudents(prev => ({ ...prev, [studentId]: true }));
    
    try {
      const response = await fetch(`/api/teacher/students/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          roomId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to archive student (${response.status})`);
      }
      
      // Remove the student from the list
      if (roomDetails) {
        setRoomDetails({
          ...roomDetails,
          students: roomDetails.students.filter(s => s.user_id !== studentId)
        });
      }
      
      closeArchiveModal();
    } catch (err) {
      // Error archiving student
      setError(err instanceof Error ? err.message : 'Failed to archive student');
      
      // Reset archiving state
      setArchivingStudents(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });
      
      closeArchiveModal();
    }
  };
  
  const deleteStudent = async (studentId: string) => {
    // Mark student as deleting
    setDeletingStudents(prev => ({ ...prev, [studentId]: true }));
    
    try {
      const response = await fetch(`/api/teacher/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          roomId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete student (${response.status})`);
      }
      
      // Remove the student from the list
      if (roomDetails) {
        setRoomDetails({
          ...roomDetails,
          students: roomDetails.students.filter(s => s.user_id !== studentId)
        });
      }
      
      closeDeleteModal();
    } catch (err) {
      // Error deleting student
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      
      // Reset deleting state
      setDeletingStudents(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });
      
      closeDeleteModal();
    }
  };
  
  // Magic link related functions removed

  const fetchAvailableClasses = async () => {
    try {
      // Fetch teacher's classes
      const classesResponse = await fetch('/api/teacher/classes');
      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }
      const classesData = await classesResponse.json();
      
      // Fetch currently linked classes
      const linkedResponse = await fetch(`/api/teacher/rooms/${roomId}/classes`);
      if (!linkedResponse.ok) {
        throw new Error('Failed to fetch linked classes');
      }
      const linkedData = await linkedResponse.json();
      
      setAvailableClasses(classesData.classes || []);
      const linkedIds = linkedData.classes?.map((c: LinkedClass) => c.class_id) || [];
      setLinkedClassIds(linkedIds);
      setSelectedClassIds(linkedIds); // Pre-select already linked classes
    } catch (err) {
      // Error fetching classes
      setError('Failed to load classes');
    }
  };

  const handleArchiveChatbot = async (chatbotId: string, chatbotName: string) => {
    if (!confirm(`Are you sure you want to archive "${chatbotName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: true })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive chatbot');
      }

      // Refresh room details to update the chatbot list
      fetchRoomDetails();
    } catch (err) {
      console.error('Error archiving chatbot:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive chatbot');
    }
  };

  const handleDeleteChatbot = async (chatbotId: string, chatbotName: string) => {
    if (!confirm(`Are you sure you want to delete "${chatbotName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete chatbot');
      }

      // Refresh room details to update the chatbot list
      fetchRoomDetails();
    } catch (err) {
      console.error('Error deleting chatbot:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete chatbot');
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleLinkClasses = async () => {
    setLinkingClasses(true);
    setError(null);
    
    try {
      // Determine which classes to link and unlink
      const toLink = selectedClassIds.filter(id => !linkedClassIds.includes(id));
      const toUnlink = linkedClassIds.filter(id => !selectedClassIds.includes(id));
      
      // Link new classes
      for (const classId of toLink) {
        const response = await fetch(`/api/teacher/rooms/${roomId}/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ class_id: classId })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to link class');
        }
      }
      
      // Unlink removed classes
      for (const classId of toUnlink) {
        const response = await fetch(`/api/teacher/rooms/${roomId}/classes/${classId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unlink class');
        }
      }
      
      setShowClassLink(false);
      fetchRoomDetails(); // Refresh room data
    } catch (err) {
      console.error('Error linking/unlinking classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to update class links');
    } finally {
      setLinkingClasses(false);
    }
  };

  const downloadCSV = async () => {
    if (!roomDetails || downloadingCSV) return;
    
    setDownloadingCSV(true);
    setError(null);
    
    try {
      const { students, room } = roomDetails;
      
      // Prepare CSV data
      const csvHeader = 'Name,Username,PIN Code,Email,Joined Date\n';
      const csvRows = await Promise.all(
        students.map(async (student) => {
          // Fetch student PIN and username if not already available
          let username = student.username || 'N/A';
          let pin = 'N/A';
          let email = student.email || 'N/A';
          
          try {
            const response = await fetch(`/api/teacher/students/pin-code?studentId=${student.user_id}`);
            if (response.ok) {
              const pinData = await response.json();
              username = pinData.username || username;
              pin = pinData.pin_code || 'N/A';
            }
          } catch (err) {
            console.error(`Error fetching PIN for student ${student.user_id}:`, err);
          }
          
          const name = student.full_name || 'N/A';
          const joinedDate = student.joined_at ? new Date(student.joined_at).toLocaleDateString() : 'N/A';
          
          // Escape values that might contain commas
          const escapeCsvValue = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          };
          
          return `${escapeCsvValue(name)},${escapeCsvValue(username)},${pin},${escapeCsvValue(email)},${joinedDate}`;
        })
      );
      
      const csvContent = csvHeader + csvRows.join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with room name and current date
      const date = new Date().toISOString().split('T')[0];
      const roomName = room.room_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `students_${roomName}_${date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      // Error downloading CSV
      setError('Failed to download student data as CSV');
    } finally {
      setDownloadingCSV(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <p>Loading room details...</p>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <Container>
          <Alert variant="error">{error}</Alert>
          <ModernButton onClick={() => router.push('/teacher-dashboard/rooms')} variant="ghost" style={{ marginTop: '16px' }}>
            Back to Rooms
          </ModernButton>
        </Container>
      </PageWrapper>
    );
  }

  if (!roomDetails) {
    return (
      <PageWrapper>
        <Container>
          <Alert variant="info">Room details not found.</Alert>
           <ModernButton onClick={() => router.push('/teacher-dashboard/rooms')} variant="ghost" style={{ marginTop: '16px' }}>
            Back to Rooms
          </ModernButton>
        </Container>
      </PageWrapper>
    );
  }

  const { room, chatbots, courses, students, linkedClasses = [] } = roomDetails;

  return (
    <PageWrapper>
      <Container>
        <Header>
          <TitleSection>
            <Title>
              <FiHome />
              {room.room_name}
            </Title>
            <Subtitle>Room Code: {room.room_code}</Subtitle>
          </TitleSection>
          <ModernButton 
            variant="ghost"
            onClick={() => router.push('/teacher-dashboard/rooms')}
          >
            ← Back to Rooms
          </ModernButton>
        </Header>

        <StatsGrid>
          <UnifiedStatsCard
            icon={<FiActivity />}
            title="Room Status"
            value={room.is_active ? 'Active' : 'Inactive'}
            variant="primary"
          />
          
          <UnifiedStatsCard
            icon={<FiUsers />}
            title="Total Students"
            value={students.length}
            variant="secondary"
          />
          
          <UnifiedStatsCard
            icon={<FiMessageSquare />}
            title="Assigned Skolrs"
            value={chatbots.length}
            variant="success"
          />
          
          <UnifiedStatsCard
            icon={<FiBookOpen />}
            title="Assigned Courses"
            value={courses?.length || 0}
            variant="warning"
          />
        </StatsGrid>
        
        {/* Add Skolr Section */}
        <ContentSection as={motion.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="add-skolr-section"
        >
          <AddSkolrSection>
            <SectionTitle>
              <FiPlus />
              Add Skolr or Course
            </SectionTitle>
            <SkolrCardsGrid>
              <SkolrCard
                $color="#7C3AED"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=learning`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiStar />
                <SkolrCardTitle>Learning Skolr</SkolrCardTitle>
                <SkolrCardDescription>
                  An AI tutor that helps students learn through conversation. Perfect for explaining concepts, answering questions, and guiding discovery.
                </SkolrCardDescription>
              </SkolrCard>
              
              <SkolrCard
                $color="#EC4899"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=assessment`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiClipboard />
                <SkolrCardTitle>Assessment Skolr</SkolrCardTitle>
                <SkolrCardDescription>
                  Evaluates student understanding through interactive assessments. Provides detailed feedback and tracks learning progress.
                </SkolrCardDescription>
              </SkolrCard>
              
              <SkolrCard
                $color="#3B82F6"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=reading_room`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiBook />
                <SkolrCardTitle>Reading Room</SkolrCardTitle>
                <SkolrCardDescription>
                  Upload documents for students to read and discuss with AI. Great for analyzing texts, articles, and research papers.
                </SkolrCardDescription>
              </SkolrCard>
              
              <SkolrCard
                $color="#10B981"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=viewing_room`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiEye />
                <SkolrCardTitle>Viewing Room</SkolrCardTitle>
                <SkolrCardDescription>
                  Upload videos for students to watch and discuss. Perfect for flipped classroom content and video-based learning.
                </SkolrCardDescription>
              </SkolrCard>
              
              <SkolrCard
                $color="#F59E0B"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=knowledge_book`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiBookOpen />
                <SkolrCardTitle>Knowledge Book</SkolrCardTitle>
                <SkolrCardDescription>
                  A comprehensive knowledge base that students can query. Ideal for reference materials and study resources.
                </SkolrCardDescription>
              </SkolrCard>
              
              <SkolrCard
                $color="#8B5CF6"
                onClick={() => {
                  if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
                    completeStep(OnboardingStep.CREATE_SKOLR);
                  }
                  router.push(`/teacher-dashboard/courses/create?roomId=${roomId}`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiGrid />
                <SkolrCardTitle>Create Course</SkolrCardTitle>
                <SkolrCardDescription>
                  Design a structured learning path with lessons, assignments, and assessments. Perfect for comprehensive curriculum delivery.
                </SkolrCardDescription>
              </SkolrCard>
            </SkolrCardsGrid>
          </AddSkolrSection>
        </ContentSection>
        
        {/* Assigned Skolrs Section */}
        <ContentSection as={motion.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <SectionHeader>
            <SectionTitle>
              <FiMessageSquare />
              Assigned Skolrs ({chatbots.length})
            </SectionTitle>
          </SectionHeader>
          {chatbots.length > 0 ? (
            <ChatbotGrid>
              {chatbots.map((bot) => {
                // Rendering chatbot
                return (
                  <UnifiedChatbotCard
                    key={bot.chatbot_id}
                    chatbot={{
                      ...bot,
                      system_prompt: bot.system_prompt || 'You are a helpful teaching assistant.',
                      is_archived: bot.is_archived || false,
                      enable_rag: bot.enable_rag || false,
                      model: bot.model || 'openai/gpt-4.1-mini',
                      temperature: bot.temperature || 0.7,
                      max_tokens: bot.max_tokens || 1000,
                      teacher_id: bot.teacher_id || '',
                      created_at: bot.created_at || '',
                      updated_at: bot.updated_at || ''
                    } as Chatbot}
                    onEdit={(chatbotId) => router.push(`/teacher-dashboard/chatbots/${chatbotId}/edit`)}
                    onDelete={handleDeleteChatbot}
                    onArchive={handleArchiveChatbot}
                  />
                );
              })}
            </ChatbotGrid>
          ) : (
            <EmptyStateText>No Skolrs assigned yet. Use the buttons above to add your first Skolr.</EmptyStateText>
          )}
        </ContentSection>

        {/* Courses Section */}
        <ContentSection as={motion.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.375 }}
        >
          <SectionHeader>
            <SectionTitle>
              <FiBookOpen />
              Room Courses ({courses.length})
            </SectionTitle>
          </SectionHeader>
          {courses.length > 0 ? (
            <ChatbotGrid>
              {courses.map((course) => (
                <UnifiedCourseCard
                  key={course.course_id}
                  course={course}
                  onEdit={(course) => router.push(`/teacher-dashboard/courses/${course.course_id}`)}
                  onDelete={async (course) => {
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
                      
                      // Refresh room details
                      await fetchRoomDetails();
                    } catch (error) {
                      console.error('Error deleting course:', error);
                      alert('Failed to delete course. Please try again.');
                    }
                  }}
                />
              ))}
            </ChatbotGrid>
          ) : (
            <EmptyStateText>No courses created yet. Click "Create Course" above to add your first course.</EmptyStateText>
          )}
        </ContentSection>

        {/* Students Section */}
        <ContentSection as={motion.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SectionHeader>
            <SectionTitle>
              <FiUsers />
              Enrolled Students ({students.length})
            </SectionTitle>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {students.length > 0 && (
                <ModernButton 
                  variant="primary"
                  size="small"
                  onClick={downloadCSV}
                  disabled={downloadingCSV}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {downloadingCSV ? (
                    <>
                      <LoadingSpinner size="small" /> Downloading...
                    </>
                  ) : (
                    <><FiDownload /> Download CSV</>
                  )}
                </ModernButton>
              )}
              <ModernButton                 variant="ghost"
                size="small"
                onClick={() => setShowArchivedStudents(!showArchivedStudents)}
                style={{ whiteSpace: 'nowrap' }}
              >
                <FiArchive /> {showArchivedStudents ? 'Hide Archived' : 'View Archived'}
              </ModernButton>
              <ModernButton 
                variant="primary" 
                size="small"
                onClick={() => setShowCsvUpload(true)}
                type="button"
              >
                <FiUpload /> Import CSV
              </ModernButton>
              <ModernButton 
                variant="primary" 
                size="small"
                onClick={() => setShowClassLink(true)}
                type="button"
              >
                <FiUsers /> Link Classes
              </ModernButton>
            </div>
          </SectionHeader>
          
          {students.length > 0 ? (
            <>
              <StudentListTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Joined On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.user_id}>
                      <td>
                        {/* Corrected Link usage: No <a> child */}
                        <Link href={`/teacher-dashboard/students/${student.user_id}`}>
                           {student.full_name}
                        </Link>
                      </td>
                      <td>{student.username || 'N/A'}</td>
                      <td>{formatDate(student.joined_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ModernButton 
                            size="small"
                            onClick={() => router.push(`/teacher-dashboard/students/${student.user_id}`)}
                            variant="primary"
                          >
                            View Details
                          </ModernButton>
                          {archivingStudents[student.user_id] ? (
                            <ModernButton size="small" disabled>
                              <LoadingSpinner size="small" /> Archiving...
                            </ModernButton>
                          ) : (
                            <ModernButton                               size="small"
                              variant="secondary"
                              onClick={() => openArchiveModal(student)}
                            >
                              Archive
                            </ModernButton>
                          )}
                          {deletingStudents[student.user_id] ? (
                            <ModernButton size="small" disabled>
                              <LoadingSpinner size="small" /> Deleting...
                            </ModernButton>
                          ) : (
                            <ModernButton                               size="small"
                              variant="danger"
                              onClick={() => openDeleteModal(student)}
                              style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                              Delete
                            </ModernButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StudentListTable>

              <StudentListMobile>
                {students.map(student => (
                  <StudentCard key={`mobile-${student.user_id}`}>
                    {/* Corrected Link usage: No <a> child */}
                    <Link href={`/teacher-dashboard/students/${student.user_id}`} className="student-name-link">
                        {student.full_name}
                    </Link>
                    <p className="student-email">Username: {student.username || 'N/A'}</p>
                    <p className="joined-at">Joined: {formatDate(student.joined_at)}</p>
                     <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <ModernButton 
                          size="small"
                          onClick={() => router.push(`/teacher-dashboard/students/${student.user_id}`)}
                          variant="primary"
                          style={{flex: '1 1 100%'}}
                        >
                          View Details
                        </ModernButton>
                        <div style={{ display: 'flex', gap: '8px', flex: '1 1 100%' }}>
                          {archivingStudents[student.user_id] ? (
                            <ModernButton size="small" disabled style={{flex: 1}}>
                              Archiving...
                            </ModernButton>
                          ) : (
                            <ModernButton                               size="small"
                              variant="secondary"
                              onClick={() => openArchiveModal(student)}
                              style={{flex: 1}}
                            >
                              Archive
                            </ModernButton>
                          )}
                          {deletingStudents[student.user_id] ? (
                            <ModernButton size="small" disabled style={{flex: 1}}>
                              Deleting...
                            </ModernButton>
                          ) : (
                            <ModernButton                               size="small"
                              variant="danger"
                              onClick={() => openDeleteModal(student)}
                              style={{flex: 1, backgroundColor: '#dc3545', color: 'white'}}
                            >
                              Delete
                            </ModernButton>
                          )}
                        </div>
                      </div>
                      
                      {/* Magic link functionality removed */}
                  </StudentCard>
                ))}
              </StudentListMobile>
            </>
          ) : (
            <EmptyStateText>No students have joined this room yet.</EmptyStateText>
          )}
        </ContentSection>

        {showArchivedStudents && (
          <ArchivePanel 
            type="students"
            roomId={roomId}
            onItemRestored={fetchRoomDetails}
          />
        )}

      </Container>
      
      {/* CSV Upload Modal */}
      <AnimatePresence>
        {showCsvUpload && (
          <StudentCsvUpload
            roomId={roomId}
            roomName={room.room_name}
            onClose={() => {
              setShowCsvUpload(false);
              // Refresh the room details to show newly added students
              fetchRoomDetails();
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {showArchiveModal && studentToArchive && (
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
            <h3>Archive Student</h3>
            <p>Are you sure you want to remove <strong>{studentToArchive.full_name}</strong> from this room?</p>
            <p>The student will no longer have access to this room, but their account and data will be preserved.</p>
            <ModalActions>
              <ModernButton variant="ghost" onClick={closeArchiveModal}>
                Cancel
              </ModernButton>
              <ModernButton 
                variant="secondary" 
                onClick={() => archiveStudent(studentToArchive.user_id)}
              >
                Archive Student
              </ModernButton>
            </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && studentToDelete && (
          <ModalOverlay 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDeleteModal}
          >
            <ModalContent 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
            <h3>Delete Student</h3>
            <p>Are you sure you want to permanently delete <strong>{studentToDelete.full_name}</strong>?</p>
            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠️ This action cannot be undone. The student's account and all associated data will be permanently deleted.</p>
            <ModalActions>
              <ModernButton variant="ghost" onClick={closeDeleteModal}>
                Cancel
              </ModernButton>
              <ModernButton 
                variant="danger" 
                onClick={() => deleteStudent(studentToDelete.user_id)}
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                Delete Permanently
              </ModernButton>
            </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      {/* Class Link Modal */}
      <AnimatePresence>
        {showClassLink && (
          <ModalOverlay 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClassLink(false)}
          >
            <ModalContent 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px' }}
            >
              <h3>Link Classes to Room</h3>
              <p>Select which classes you want to link to this room. Students from linked classes will automatically have access to this room.</p>
              
              {availableClasses.length === 0 ? (
                <EmptyStateText>
                  <p>You haven't created any classes yet.</p>
                  <ModernButton 
                    variant="primary" 
                    onClick={() => router.push('/teacher-dashboard/classes/create')}
                    style={{ marginTop: '1rem' }}
                  >
                    Create Your First Class
                  </ModernButton>
                </EmptyStateText>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '1rem 0' }}>
                  {availableClasses.map(cls => (
                    <div 
                      key={cls.class_id} 
                      style={{ 
                        padding: '1rem', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        background: selectedClassIds.includes(cls.class_id) ? '#f3f4f6' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleClassToggle(cls.class_id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.class_id)}
                          onChange={() => handleClassToggle(cls.class_id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            {cls.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {cls.student_count} students
                            {cls.grade_level && ` • ${cls.grade_level}`}
                            {cls.subject && ` • ${cls.subject}`}
                          </div>
                          {linkedClassIds.includes(cls.class_id) && (
                            <Badge variant="cyan" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                              Currently Linked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <ModalActions>
                <ModernButton 
                  variant="ghost" 
                  onClick={() => setShowClassLink(false)}
                  disabled={linkingClasses}
                >
                  Cancel
                </ModernButton>
                {availableClasses.length > 0 && (
                  <ModernButton 
                    variant="primary" 
                    onClick={handleLinkClasses}
                    disabled={linkingClasses || (
                      selectedClassIds.length === linkedClassIds.length && 
                      selectedClassIds.every(id => linkedClassIds.includes(id))
                    )}
                  >
                    {linkingClasses ? (
                      <>
                        <LoadingSpinner size="small" /> Updating...
                      </>
                    ) : (
                      'Update Class Links'
                    )}
                  </ModernButton>
                )}
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Onboarding Popup */}
      <OnboardingPopup
        show={showOnboardingPopup}
        onClose={() => setShowOnboardingPopup(false)}
        title="Your Room is Ready!"
        text="Great job! You've created your first room. Now let's add a Skolr - an AI assistant that will help your students learn. Click on one of the Skolr types above to create your first Skolr."
        primaryButtonText="Create Skolr"
        secondaryButtonText="Skip for now"
        onPrimaryClick={() => {
          setShowOnboardingPopup(false);
          // Scroll to the Add Skolr section
          const addSkolrSection = document.querySelector('.add-skolr-section');
          if (addSkolrSection) {
            addSkolrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        onSecondaryClick={() => {
          setShowOnboardingPopup(false);
          // Complete onboarding if they skip
          completeStep(OnboardingStep.CREATE_SKOLR);
        }}
      />
      
      {/* Onboarding Highlights and Tooltips */}
      <Highlight
        selector=".add-skolr-section"
        show={isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR && !showOnboardingPopup}
        cutout={true}
      />
      <Tooltip
        selector=".add-skolr-section"
        title="Create Your First Skolr"
        text="Choose any of these Skolr types to create an AI assistant for your students. Each type serves a different educational purpose."
        buttonText="Got it"
        onButtonClick={() => {}}
        show={isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR && !showOnboardingPopup}
        placement="top"
      />
    </PageWrapper>
  );
}