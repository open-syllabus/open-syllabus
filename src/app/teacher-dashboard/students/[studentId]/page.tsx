// src/app/teacher-dashboard/students/[studentId]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiHome, 
  FiActivity,
  FiBarChart2,
  FiEdit2,
  FiCopy,
  FiArrowLeft,
  FiCalendar,
  FiHash,
  FiLock,
  FiMessageSquare,
  FiClock,
  FiAlertTriangle,
  FiAward,
  FiRefreshCw,
  FiTrendingUp,
  FiTarget,
  FiShield
} from 'react-icons/fi';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ModernButton } from '@/components/shared/ModernButton';
import { StatsCard as UnifiedStatsCard } from '@/components/ui/UnifiedCards';
import StudentChatHistory from '@/components/teacher/StudentChatHistory';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { createClient } from '@/lib/supabase/client';

interface StudentDetails {
  student_id: string;
  first_name: string;
  surname: string;
  username: string;
  pin_code: string;
  year_group: string | null;
  created_at: string;
  room_count: number;
  last_activity: string | null;
  rooms: Array<{
    room_id: string;
    room_name: string;
    joined_at: string;
  }>;
}

interface StudentStats {
  student: {
    student_id: string;
    first_name: string;
    surname: string;
    username: string;
    year_group: string | null;
  };
  engagement: {
    last_active: string | null;
    total_messages: number;
    active_days_last_week: number;
    active_days_last_month: number;
    average_messages_per_day: number;
    most_active_time: string;
  };
  rooms: {
    total_rooms: number;
    active_rooms: number;
    room_activity: Array<{
      room_id: string;
      room_name: string;
      message_count: number;
      last_active: string | null;
      engagement_rate: number;
    }>;
  };
  assessments: {
    total_completed: number;
    average_score: number;
    recent_assessments: Array<{
      assessment_id: string;
      chatbot_name: string;
      score: number;
      completed_at: string;
    }>;
  };
  safety: {
    flagged_messages: number;
    pending_concerns: number;
    recent_concerns: Array<{
      flag_id: string;
      created_at: string;
      severity: string;
      status: string;
    }>;
  };
  trends: {
    engagement_trend: 'increasing' | 'decreasing' | 'stable';
    weekly_activity: Array<{
      day: string;
      messages: number;
    }>;
  };
}

interface Assessment {
  assessment_id: string;
  chatbot_name?: string | null;
  ai_grade_raw?: string | null;
  teacher_override_grade?: string | null;
  assessed_at: string;
  status?: string;
  room_id?: string;
  room_name?: string;
}

interface Concern {
  flag_id: string;
  concern_type: string;
  concern_level: number;
  created_at: string;
  status: string;
  message_content?: string | null;
  room_id?: string;
  room_name?: string;
}

type TabName = 'overview' | 'chats' | 'assessments' | 'concerns' | 'content-filters';


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
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 32px;
`;

const BackButton = styled(ModernButton)`
  margin-bottom: 16px;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const TitleSection = styled.div`
  flex: 1;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #7C3AED;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6B7280;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InfoValue = styled.div`
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CopyButton = styled(ModernButton)`
  padding: 4px !important;
  min-width: unset !important;
  
  svg {
    width: 16px;
    height: 16px;
    margin: 0;
  }
`;

const RoomsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RoomItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F3F4F6;
    transform: translateX(4px);
  }
`;

const RoomInfo = styled.div`
  flex: 1;
`;

const RoomName = styled.div`
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
`;

const RoomMeta = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  svg {
    width: 48px;
    height: 48px;
    color: #E5E7EB;
    margin-bottom: 16px;
  }
`;

const TabContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
`;

const TabButton = styled(ModernButton)<{ $isActive: boolean }>`
  background: ${({ $isActive }) => $isActive ? 'linear-gradient(135deg, #7C3AED, #C848AF)' : 'transparent'} !important;
  color: ${({ $isActive }) => $isActive ? 'white' : '#6B7280'} !important;
  border: ${({ $isActive }) => $isActive ? 'none' : '2px solid transparent'} !important;
  box-shadow: ${({ $isActive }) => $isActive ? '0 4px 14px rgba(124, 58, 237, 0.25)' : 'none'} !important;
  
  &:hover {
    background: ${({ $isActive }) => $isActive ? 'linear-gradient(135deg, #6B21A8, #A21CAF)' : '#F3F4F6'} !important;
    color: ${({ $isActive }) => $isActive ? 'white' : '#111827'} !important;
    transform: ${({ $isActive }) => $isActive ? 'translateY(-2px)' : 'none'} !important;
  }
`;

const TabContent = styled.div``;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  margin-top: 32px;
  margin-bottom: 32px;
  
  /* Ensure all cards have the same height */
  > * {
    height: 100%;
    min-height: 120px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    margin-top: 24px;
  }
`;

const SectionCard = styled(Card)`
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #7C3AED;
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ListItem = styled.div`
  padding: 16px;
  background: #FAFBFC;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }
`;

const ListItemInfo = styled.div`
  flex: 1;
  
  a {
    font-weight: 600;
    color: #111827;
    text-decoration: none;
    
    &:hover {
      color: #7C3AED;
    }
  }
`;

const ListItemDate = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 4px 0 0 0;
`;

const ListItemPreview = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  font-style: italic;
  margin: 8px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badge = styled.span<{ $variant: 'success' | 'warning' | 'error' | 'default' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return '#D1FAE5';
      case 'warning': return '#FEF3C7';
      case 'error': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'success': return '#065F46';
      case 'warning': return '#78350F';
      case 'error': return '#991B1B';
      default: return '#374151';
    }
  }};
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 12px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;


export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const supabase = createClient();
  
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [allConcerns, setAllConcerns] = useState<Concern[]>([]);
  const [allContentFilters, setAllContentFilters] = useState<any[]>([]);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingContentFilters, setLoadingContentFilters] = useState(false);
  const [chatRoomFilter, setChatRoomFilter] = useState<string>('');
  const [chatSkolrFilter, setChatSkolrFilter] = useState<string>('');
  const [regeneratingPin, setRegeneratingPin] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await fetch(`/api/teacher/students/${studentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }
        const data = await response.json();
        setStudent(data);
        
        // Fetch stats and other data after getting student details
        if (data.student_id) {
          fetchStudentStats();
          fetchAllAssessments();
          fetchAllConcerns();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentId]);
  
  // Fetch chats when student data is available
  useEffect(() => {
    if (student && student.rooms && student.rooms.length > 0) {
      fetchAllChats();
    }
  }, [student]);
  
  const fetchStudentStats = async () => {
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch student stats:', err);
    }
  };
  
  const fetchAllAssessments = async () => {
    setLoadingAssessments(true);
    try {
      // Fetch all assessments for the student across all rooms
      // This would need a new API endpoint or modification of existing one
      const response = await fetch(`/api/teacher/assessments?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.assessments) {
          setAllAssessments(data.assessments);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    } finally {
      setLoadingAssessments(false);
    }
  };
  
  const fetchAllConcerns = async () => {
    setLoadingConcerns(true);
    try {
      // Fetch all safety concerns for the student
      const response = await fetch(`/api/teacher/concerns?studentId=${studentId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        if (data.concerns) {
          setAllConcerns(data.concerns);
        }
      }
    } catch (err) {
      console.error('Failed to fetch concerns:', err);
    } finally {
      setLoadingConcerns(false);
    }
  };

  const fetchAllContentFilters = async () => {
    setLoadingContentFilters(true);
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get the auth_user_id for this student
      const studentResponse = await fetch(`/api/teacher/students/${studentId}`);
      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        const authUserId = studentData.auth_user_id;
        
        // Fetch content filter messages for this student
        const { data: rooms } = await supabase
          .from('rooms')
          .select('room_id')
          .eq('teacher_id', user.id);
          
        if (rooms && rooms.length > 0) {
          const roomIds = rooms.map(r => r.room_id);
          const { data: filters } = await supabase
            .from('filtered_messages')
            .select('*')
            .in('room_id', roomIds)
            .eq('user_id', authUserId)
            .order('created_at', { ascending: false });
            
          if (filters) {
            setAllContentFilters(filters);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch content filters:', err);
    } finally {
      setLoadingContentFilters(false);
    }
  };
  
  const fetchAllChats = async () => {
    setLoadingChats(true);
    try {
      // Fetch chats across all rooms for the student
      const allChatsData = [];
      
      // Wait for student data to be loaded first
      if (!student || !student.rooms) {
        return;
      }
      
      // For each room the student is in, fetch their chats
      if (student.rooms.length > 0) {
        const chatPromises = student.rooms.map(async (room) => {
          try {
            const response = await fetch(`/api/teacher/student-chats?roomId=${room.room_id}&studentId=${studentId}`);
            if (response.ok) {
              const data = await response.json();
              return {
                roomId: room.room_id,
                roomName: room.room_name,
                conversations: data.conversations || [],
                chatbots: data.chatbots || []
              };
            }
          } catch (err) {
            console.error(`Failed to fetch chats for room ${room.room_id}:`, err);
          }
          return null;
        });
        
        const results = await Promise.all(chatPromises);
        allChatsData.push(...results.filter(result => result !== null));
      }
      
      setAllChats(allChatsData);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleRegeneratePin = async () => {
    setRegeneratingPin(true);
    try {
      const response = await fetch('/api/teacher/students/pin-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate PIN');
      }
      
      const data = await response.json();
      if (student) {
        setStudent({
          ...student,
          pin_code: data.pin_code || '',
          username: data.username || student.username,
        });
      }
    } catch (err) {
      console.error('Error regenerating PIN:', err);
    } finally {
      setRegeneratingPin(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getConcernTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getConcernLevelColor = (level: number) => {
    if (level >= 4) return '#DC2626'; // red
    if (level >= 3) return '#F59E0B'; // amber
    return '#3B82F6'; // blue
  };
  
  const getStatusBadgeVariant = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    if (!status) return 'default';
    // Assessment Statuses
    if (status === 'teacher_reviewed') return 'success';
    if (status === 'ai_completed') return 'warning';
    if (status === 'ai_processing') return 'default';
    // Concern Statuses
    if (status === 'resolved') return 'success';
    if (status === 'false_positive') return 'default';
    if (status === 'reviewing') return 'warning';
    if (status === 'pending') return 'error';
    return 'default';
  };

  const getStatusText = (status?: string): string => {
    if (!status) return 'N/A';
    // Assessment Statuses
    if (status === 'ai_processing') return 'AI Processing';
    if (status === 'ai_completed') return 'AI Completed';
    if (status === 'teacher_reviewed') return 'Teacher Reviewed';
    // Concern Statuses
    if (status === 'pending') return 'Pending';
    if (status === 'reviewing') return 'Reviewing';
    if (status === 'resolved') return 'Resolved';
    if (status === 'false_positive') return 'False Positive';
    return String(status).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter chat data based on selected filters
  const getFilteredChats = () => {
    let filtered = [...allChats];
    
    // Filter by room
    if (chatRoomFilter) {
      filtered = filtered.filter(roomData => roomData.roomId === chatRoomFilter);
    }
    
    // Filter by chatbot/skolr
    if (chatSkolrFilter) {
      filtered = filtered.map(roomData => ({
        ...roomData,
        conversations: roomData.conversations.filter((conv: any) => 
          conv.chatbot_id === chatSkolrFilter
        )
      })).filter(roomData => roomData.conversations.length > 0);
    }
    
    return filtered;
  };
  
  // Get unique chatbots across all rooms or for a specific room
  const getAllChatbots = () => {
    const chatbots = new Map();
    
    // If a room is selected, only show chatbots from that room
    if (chatRoomFilter) {
      const selectedRoomData = allChats.find(roomData => roomData.roomId === chatRoomFilter);
      if (selectedRoomData?.chatbots) {
        selectedRoomData.chatbots.forEach((chatbot: any) => {
          chatbots.set(chatbot.chatbot_id, chatbot);
        });
      }
    } else {
      // Show all chatbots from all rooms
      allChats.forEach(roomData => {
        roomData.chatbots?.forEach((chatbot: any) => {
          chatbots.set(chatbot.chatbot_id, chatbot);
        });
      });
    }
    
    return Array.from(chatbots.values());
  };
  
  const handleClearFilters = () => {
    setChatRoomFilter('');
    setChatSkolrFilter('');
  };
  
  const handleRoomFilterChange = (roomId: string) => {
    setChatRoomFilter(roomId);
    
    // Clear Skolr filter when room changes, since the Skolr might not be available in the new room
    if (roomId && chatSkolrFilter) {
      const newRoomData = allChats.find(roomData => roomData.roomId === roomId);
      const isCurrentSkolrInNewRoom = newRoomData?.chatbots?.some((chatbot: any) => 
        chatbot.chatbot_id === chatSkolrFilter
      );
      
      if (!isCurrentSkolrInNewRoom) {
        setChatSkolrFilter('');
      }
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '16px', color: '#6B7280' }}>Loading student details...</p>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !student) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <FiUser />
            <h3>Unable to load student</h3>
            <p>{error || 'Student not found'}</p>
            <ModernButton
              variant="primary"
              onClick={() => router.push('/teacher-dashboard/students')}
              style={{ marginTop: '16px' }}
            >
              Back to Students
            </ModernButton>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackButton
            variant="ghost"
            size="small"
            onClick={() => router.push('/teacher-dashboard/students')}
          >
            <FiArrowLeft />
            Back to Students
          </BackButton>
          
          <TitleRow>
            <TitleSection>
              <Title
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <FiUser />
                {student.first_name} {student.surname}
              </Title>
              <Subtitle>
                Student Profile • Year {student.year_group || 'Not set'}
              </Subtitle>
            </TitleSection>
            
            <ActionButtons>
              <ModernButton
                variant="primary"
                size="medium"
                onClick={() => router.push(`/teacher-dashboard/students/${studentId}/stats`)}
              >
                <FiBarChart2 />
                View Analytics
              </ModernButton>
              <ModernButton
                variant="secondary"
                size="medium"
                onClick={() => router.push(`/teacher-dashboard/students/${studentId}/memory`)}
              >
                <FiActivity />
                View Memory
              </ModernButton>
            </ActionButtons>
          </TitleRow>
        </Header>

        {/* Stats Grid */}
        {stats && (
          <StatsGrid>
            <UnifiedStatsCard
              icon={<FiMessageSquare />}
              title="Total Messages"
              value={stats.engagement.total_messages}
              variant="primary"
            />
            
            <UnifiedStatsCard
              icon={<FiHome />}
              title="Active Rooms"
              value={`${stats.rooms.active_rooms}/${stats.rooms.total_rooms}`}
              variant="warning"
            />
            
            <UnifiedStatsCard
              icon={<FiAward />}
              title="Assessments"
              value={stats.assessments.total_completed}
              variant="info"
            />
            
            <UnifiedStatsCard
              icon={<FiClock />}
              title="Last Active"
              value={formatTimeAgo(stats.engagement.last_active)}
              variant="secondary"
            />
            
            <UnifiedStatsCard
              icon={<FiTrendingUp />}
              title="Engagement"
              value={`${stats.trends.engagement_trend === 'increasing' ? '↑' : stats.trends.engagement_trend === 'decreasing' ? '↓' : '→'} ${stats.trends.engagement_trend}`}
              variant="accent"
            />
            
            <UnifiedStatsCard
              icon={<FiAlertTriangle />}
              title="Safety Concerns"
              value={stats.safety.pending_concerns}
              variant={stats.safety.pending_concerns > 0 ? "danger" : "primary"}
            />
          </StatsGrid>
        )}

        {/* Student Info Cards */}
        <ContentGrid>
          <Card
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CardTitle>
              <FiUser />
              Student Information
            </CardTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>
                  <FiUser />
                  Username
                </InfoLabel>
                <InfoValue>
                  {student.username}
                  <CopyButton
                    variant="ghost"
                    size="small"
                    onClick={() => handleCopy(student.username, 'username')}
                    title="Copy username"
                  >
                    {copiedField === 'username' ? '✓' : <FiCopy />}
                  </CopyButton>
                </InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>
                  <FiLock />
                  PIN Code
                </InfoLabel>
                <InfoValue style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{student.pin_code}</span>
                  <CopyButton
                    variant="ghost"
                    size="small"
                    onClick={() => handleCopy(student.pin_code, 'pin')}
                    title="Copy PIN"
                  >
                    {copiedField === 'pin' ? '✓' : <FiCopy />}
                  </CopyButton>
                  <ModernButton
                    variant="ghost"
                    size="small"
                    onClick={handleRegeneratePin}
                    disabled={regeneratingPin}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  >
                    <FiRefreshCw style={{ width: '14px', height: '14px' }} />
                    {regeneratingPin ? 'Regenerating...' : 'Regenerate PIN'}
                  </ModernButton>
                </InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>
                  <FiCalendar />
                  Joined
                </InfoLabel>
                <InfoValue>
                  {formatDate(student.created_at)}
                </InfoValue>
              </InfoItem>
            </InfoGrid>
          </Card>

          <Card
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <CardTitle>
              <FiHome />
              Room Assignments ({student.room_count})
            </CardTitle>
            {student.rooms.length > 0 ? (
              <RoomsList>
                {student.rooms.map(room => (
                  <RoomItem
                    key={room.room_id}
                    onClick={() => router.push(`/teacher-dashboard/rooms/${room.room_id}`)}
                  >
                    <RoomInfo>
                      <RoomName>{room.room_name}</RoomName>
                      <RoomMeta>
                        Joined {formatDate(room.joined_at)}
                      </RoomMeta>
                    </RoomInfo>
                  </RoomItem>
                ))}
              </RoomsList>
            ) : (
              <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                <FiHome />
                <p style={{ margin: 0 }}>Not assigned to any rooms yet</p>
                <ModernButton
                  variant="primary"
                  size="small"
                  onClick={() => router.push('/teacher-dashboard/rooms')}
                  style={{ marginTop: '16px' }}
                >
                  Go to Rooms
                </ModernButton>
              </EmptyState>
            )}
          </Card>
        </ContentGrid>

        {/* Tabbed Interface */}
        {student.rooms.length > 0 && (
          <>
            <TabContainer>
              <TabButton 
                $isActive={activeTab === 'overview'} 
                onClick={() => setActiveTab('overview')}
                variant="ghost"
                size="small"
              >
                Overview
              </TabButton>
              <TabButton 
                $isActive={activeTab === 'chats'} 
                onClick={() => setActiveTab('chats')}
                variant="ghost"
                size="small"
              >
                Chat History
              </TabButton>
              <TabButton 
                $isActive={activeTab === 'assessments'} 
                onClick={() => setActiveTab('assessments')}
                variant="ghost"
                size="small"
              >
                Assessments ({allAssessments.length})
              </TabButton>
              <TabButton 
                $isActive={activeTab === 'concerns'} 
                onClick={() => setActiveTab('concerns')}
                variant="ghost"
                size="small"
              >
                Concerns ({allConcerns.length})
              </TabButton>
            </TabContainer>

            <TabContent>
              {activeTab === 'overview' && (
                <OverviewGrid>
                  <SectionCard>
                    <SectionHeader>
                      <SectionTitle>
                        <FiAward />
                        Recent Assessments
                      </SectionTitle>
                      {stats && stats.assessments.recent_assessments.length > 5 && (
                        <ModernButton 
                          variant="ghost" 
                          size="small"
                          onClick={() => setActiveTab('assessments')}
                        >
                          View All ({stats.assessments.total_completed})
                        </ModernButton>
                      )}
                    </SectionHeader>
                    
                    {stats && stats.assessments.recent_assessments.length > 0 ? (
                      <ListContainer>
                        {stats.assessments.recent_assessments.slice(0, 5).map(assessment => (
                          <ListItem key={assessment.assessment_id}>
                            <ListItemInfo>
                              <a href={`/teacher-dashboard/assessments/${assessment.assessment_id}`}>
                                Assessment with {assessment.chatbot_name}
                              </a>
                              <ListItemDate>{formatDate(assessment.completed_at)}</ListItemDate>
                            </ListItemInfo>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ marginBottom: '8px' }}>
                                Score: <strong>{assessment.score}%</strong>
                              </div>
                            </div>
                          </ListItem>
                        ))}
                      </ListContainer>
                    ) : (
                      <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                        <FiAward />
                        <p style={{ margin: 0 }}>No assessments completed yet</p>
                      </EmptyState>
                    )}
                  </SectionCard>

                  <SectionCard>
                    <SectionHeader>
                      <SectionTitle>
                        <FiAlertTriangle />
                        Recent Concerns
                      </SectionTitle>
                      {allConcerns.length > 5 && (
                        <ModernButton 
                          variant="ghost" 
                          size="small"
                          onClick={() => setActiveTab('concerns')}
                        >
                          View All ({allConcerns.length})
                        </ModernButton>
                      )}
                    </SectionHeader>
                    
                    {allConcerns.length > 0 ? (
                      <ListContainer>
                        {allConcerns.slice(0, 5).map(concern => (
                          <ListItem key={concern.flag_id}>
                            <ListItemInfo>
                              <a href={`/teacher-dashboard/concerns/${concern.flag_id}`}>
                                {getConcernTypeLabel(concern.concern_type)} (Level {concern.concern_level})
                              </a>
                              <ListItemDate>{formatDate(concern.created_at)}</ListItemDate>
                              {concern.message_content && (
                                <ListItemPreview>"{concern.message_content}"</ListItemPreview>
                              )}
                            </ListItemInfo>
                            <Badge $variant={getStatusBadgeVariant(concern.status)}>
                              {getStatusText(concern.status)}
                            </Badge>
                          </ListItem>
                        ))}
                      </ListContainer>
                    ) : (
                      <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                        <FiAlertTriangle style={{ color: '#10B981' }} />
                        <p style={{ margin: 0, color: '#065F46', fontWeight: 500 }}>No safety concerns</p>
                      </EmptyState>
                    )}
                  </SectionCard>
                </OverviewGrid>
              )}

              {activeTab === 'chats' && (
                <SectionCard>
                  <SectionHeader>
                    <SectionTitle>
                      <FiMessageSquare />
                      Chat History (All Rooms)
                    </SectionTitle>
                  </SectionHeader>
                  
                  {!loadingChats && allChats.length > 0 && (
                    <FilterBar>
                      <FilterGroup>
                        <FilterLabel>Filter by Room</FilterLabel>
                        <FilterSelect
                          value={chatRoomFilter}
                          onChange={(e) => handleRoomFilterChange(e.target.value)}
                        >
                          <option value="">All Rooms</option>
                          {student?.rooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>
                              {room.room_name}
                            </option>
                          ))}
                        </FilterSelect>
                      </FilterGroup>
                      
                      <FilterGroup>
                        <FilterLabel>
                          Filter by Skolr
                          {chatRoomFilter && (
                            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 400, marginLeft: '4px' }}>
                              (in selected room)
                            </span>
                          )}
                        </FilterLabel>
                        <FilterSelect
                          value={chatSkolrFilter}
                          onChange={(e) => setChatSkolrFilter(e.target.value)}
                        >
                          <option value="">
                            {chatRoomFilter ? 'All Skolrs in Room' : 'All Skolrs'}
                          </option>
                          {getAllChatbots().map((chatbot: any) => (
                            <option key={chatbot.chatbot_id} value={chatbot.chatbot_id}>
                              {chatbot.name}
                            </option>
                          ))}
                        </FilterSelect>
                      </FilterGroup>
                      
                      {(chatRoomFilter || chatSkolrFilter) && (
                        <FilterGroup>
                          <FilterLabel>&nbsp;</FilterLabel>
                          <ModernButton
                            variant="secondary"
                            size="small"
                            onClick={handleClearFilters}
                          >
                            Clear Filters
                          </ModernButton>
                        </FilterGroup>
                      )}
                    </FilterBar>
                  )}
                  
                  {loadingChats ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <LoadingSpinner size="small" />
                      <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '0.875rem' }}>
                        Loading chat history...
                      </p>
                    </div>
                  ) : (() => {
                    const filteredChats = getFilteredChats();
                    return filteredChats.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {filteredChats.map((roomData) => (
                        <div key={roomData.roomId} style={{ marginBottom: '24px' }}>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            color: '#111827', 
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <FiHome style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
                            {roomData.roomName}
                          </h4>
                          
                          {roomData.conversations.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {roomData.conversations.map((conversation: any, convIndex: number) => (
                                <div key={`${roomData.roomId}-${convIndex}`} style={{
                                  padding: '16px',
                                  background: '#FAFBFC',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '12px'
                                }}>
                                  <div style={{ 
                                    marginBottom: '12px',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid #E5E7EB'
                                  }}>
                                    <strong style={{ color: '#111827' }}>{conversation.chatbot_name}</strong>
                                    <span style={{ color: '#6B7280', fontSize: '0.875rem', marginLeft: '12px' }}>
                                      Started {formatDate(conversation.started_at)}
                                    </span>
                                  </div>
                                  
                                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {conversation.messages.slice(0, 5).map((message: any) => (
                                      <div key={message.message_id} style={{
                                        padding: '8px 12px',
                                        margin: '4px 0',
                                        background: message.role === 'user' ? '#EDE9FE' : '#F3F4F6',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                      }}>
                                        <strong style={{ color: message.role === 'user' ? '#7C3AED' : '#374151' }}>
                                          {message.role === 'user' ? student.first_name : conversation.chatbot_name}:
                                        </strong>
                                        <span style={{ marginLeft: '8px', color: '#111827' }}>
                                          {message.content}
                                        </span>
                                      </div>
                                    ))}
                                    {conversation.messages.length > 5 && (
                                      <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                        <ModernButton
                                          variant="ghost"
                                          size="small"
                                          onClick={() => router.push(`/teacher-dashboard/rooms/${roomData.roomId}`)}
                                        >
                                          View Full Conversation ({conversation.messages.length} messages)
                                        </ModernButton>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ 
                              padding: '16px', 
                              textAlign: 'center', 
                              color: '#6B7280',
                              background: '#F9FAFB',
                              borderRadius: '8px'
                            }}>
                              No chat history in this room
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    ) : (
                      <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                        <FiMessageSquare />
                        <p style={{ margin: 0 }}>
                          {(chatRoomFilter || chatSkolrFilter) ? 'No chats match your filters' : 'No chat history found'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>
                          {(chatRoomFilter || chatSkolrFilter) 
                            ? 'Try adjusting your filter settings to see more conversations'
                            : 'This student hasn\'t participated in any chat conversations yet'
                          }
                        </p>
                        {(chatRoomFilter || chatSkolrFilter) && (
                          <ModernButton
                            variant="ghost"
                            size="small"
                            onClick={handleClearFilters}
                            style={{ marginTop: '12px' }}
                          >
                            Clear Filters
                          </ModernButton>
                        )}
                      </EmptyState>
                    );
                  })()}
                </SectionCard>
              )}

              {activeTab === 'assessments' && (
                <SectionCard>
                  <SectionHeader>
                    <SectionTitle>
                      <FiAward />
                      All Assessments ({allAssessments.length})
                    </SectionTitle>
                  </SectionHeader>
                  
                  {loadingAssessments ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <LoadingSpinner size="small" />
                      <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '0.875rem' }}>
                        Loading assessments...
                      </p>
                    </div>
                  ) : allAssessments.length > 0 ? (
                    <ListContainer>
                      {allAssessments.map(assessment => (
                        <ListItem key={assessment.assessment_id}>
                          <ListItemInfo>
                            <a href={`/teacher-dashboard/assessments/${assessment.assessment_id}`}>
                              Assessment with {assessment.chatbot_name || 'Skolr'}
                              {assessment.room_name && ` in ${assessment.room_name}`}
                            </a>
                            <ListItemDate>{formatDate(assessment.assessed_at)}</ListItemDate>
                          </ListItemInfo>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '8px' }}>
                              Grade: <strong>{assessment.teacher_override_grade || assessment.ai_grade_raw || 'N/A'}</strong>
                            </div>
                            <Badge $variant={getStatusBadgeVariant(assessment.status)}>
                              {getStatusText(assessment.status)}
                            </Badge>
                          </div>
                        </ListItem>
                      ))}
                    </ListContainer>
                  ) : (
                    <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                      <FiAward />
                      <p style={{ margin: 0 }}>No assessments found</p>
                    </EmptyState>
                  )}
                </SectionCard>
              )}

              {activeTab === 'concerns' && (
                <SectionCard>
                  <SectionHeader>
                    <SectionTitle>
                      <FiAlertTriangle />
                      All Concerns ({allConcerns.length})
                    </SectionTitle>
                  </SectionHeader>
                  
                  {loadingConcerns ? (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <LoadingSpinner size="small" />
                      <p style={{ marginTop: '8px', color: '#6B7280', fontSize: '0.875rem' }}>
                        Loading concerns...
                      </p>
                    </div>
                  ) : allConcerns.length > 0 ? (
                    <ListContainer>
                      {allConcerns.map(concern => (
                        <ListItem key={concern.flag_id} style={{ borderLeft: `4px solid ${getConcernLevelColor(concern.concern_level)}` }}>
                          <ListItemInfo>
                            <a href={`/teacher-dashboard/concerns/${concern.flag_id}`}>
                              {getConcernTypeLabel(concern.concern_type)} (Level {concern.concern_level})
                              {concern.room_name && ` in ${concern.room_name}`}
                            </a>
                            <ListItemDate>{formatDate(concern.created_at)}</ListItemDate>
                            {concern.message_content && (
                              <ListItemPreview>"{concern.message_content}"</ListItemPreview>
                            )}
                          </ListItemInfo>
                          <Badge $variant={getStatusBadgeVariant(concern.status)}>
                            {getStatusText(concern.status)}
                          </Badge>
                        </ListItem>
                      ))}
                    </ListContainer>
                  ) : (
                    <EmptyState style={{ padding: '24px', boxShadow: 'none', background: '#F9FAFB' }}>
                      <FiAlertTriangle style={{ color: '#10B981' }} />
                      <p style={{ margin: 0, color: '#065F46', fontWeight: 500 }}>No safety concerns</p>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>
                        This student has no flagged messages across any rooms
                      </p>
                    </EmptyState>
                  )}
                </SectionCard>
              )}
            </TabContent>
          </>
        )}
      </Container>
    </PageWrapper>
  );
}