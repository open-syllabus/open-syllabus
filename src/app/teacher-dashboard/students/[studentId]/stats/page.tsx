// src/app/teacher-dashboard/students/[studentId]/stats/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiActivity, 
  FiTrendingUp, 
  FiMessageSquare, 
  FiClock,
  FiAward,
  FiAlertTriangle,
  FiHome,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiArrowLeft
} from 'react-icons/fi';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ModernButton } from '@/components/shared/ModernButton';
import { StatsCard } from '@/components/ui';

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
      last_active: string;
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
    recent_concerns: Array<{
      flag_id: string;
      created_at: string;
      severity: string;
      status: string;
    }>;
  };
  trends: {
    engagement_trend: 'increasing' | 'stable' | 'decreasing';
    weekly_activity: Array<{
      day: string;
      messages: number;
    }>;
  };
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

const BackButton = styled(ModernButton)`
  margin-bottom: 16px;
`;

const Title = styled(motion.h1)`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6B7280;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }
`;

const StatCard = styled(motion.div)<{ $color?: string }>`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${({ $color }) => $color || '#6366F1'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div<{ $bgColor?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $bgColor }) => $bgColor || '#EDE9FE'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ $bgColor }) => $bgColor ? '#ffffff' : '#6366F1'};
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
`;

const StatSubtext = styled.div`
  font-size: 0.875rem;
  color: #9CA3AF;
`;

const SectionCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
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
    color: #6366F1;
  }
`;

const ActivityChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 120px;
  margin-top: 20px;
`;

const ActivityBar = styled.div<{ $height: number; $isToday?: boolean }>`
  flex: 1;
  height: ${({ $height }) => $height}%;
  background: ${({ $isToday }) => $isToday ? '#6366F1' : '#E5E7EB'};
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ $isToday }) => $isToday ? '#4F46E5' : '#D1D5DB'};
  }
`;

const RoomActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RoomActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 8px;
  
  &:hover {
    background: #F3F4F6;
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

const RoomStats = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
`;

const EngagementBadge = styled.span<{ $level: 'high' | 'medium' | 'low' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${({ $level }) => 
    $level === 'high' ? '#D1FAE5' : 
    $level === 'medium' ? '#FEF3C7' : 
    '#FEE2E2'};
  color: ${({ $level }) => 
    $level === 'high' ? '#065F46' : 
    $level === 'medium' ? '#78350F' : 
    '#991B1B'};
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

export default function StudentStatsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/teacher/students/${studentId}/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch student stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [studentId]);

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <p style={{ marginTop: '16px', color: '#6B7280' }}>Loading student statistics...</p>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !stats) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <FiAlertTriangle />
            <h3>Unable to load statistics</h3>
            <p>{error || 'No data available'}</p>
            <ModernButton
              variant="primary"
              onClick={() => router.back()}
              style={{ marginTop: '16px' }}
            >
              Go Back
            </ModernButton>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  const getEngagementLevel = (rate: number): 'high' | 'medium' | 'low' => {
    if (rate >= 70) return 'high';
    if (rate >= 40) return 'medium';
    return 'low';
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

  return (
    <PageWrapper>
      <Container>
        <Header>
          <BackButton
            variant="ghost"
            size="small"
            onClick={() => router.back()}
          >
            <FiArrowLeft />
            Back
          </BackButton>
          <Title
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Student Analytics: {stats.student.first_name} {stats.student.surname}
          </Title>
          <Subtitle>
            Detailed engagement and performance metrics
          </Subtitle>
        </Header>

        <StatsGrid>
          <StatsCard
            icon={<FiClock />}
            title="Last Active"
            value={formatTimeAgo(stats.engagement.last_active)}
            accentColor="primary"
            subtitle={`Most active ${stats.engagement.most_active_time}`}
          />

          <StatsCard
            icon={<FiMessageSquare />}
            title="Total Messages"
            value={stats.engagement.total_messages}
            accentColor="success"
            subtitle={`~${stats.engagement.average_messages_per_day} per active day`}
          />

          <StatsCard
            icon={<FiCalendar />}
            title="Activity This Week"
            value={stats.engagement.active_days_last_week}
            accentColor="warning"
            subtitle="days active out of 7"
          />

          <StatsCard
            icon={<FiAward />}
            title="Assessments"
            value={stats.assessments.total_completed}
            accentColor="secondary"
            subtitle={`Avg score: ${stats.assessments.average_score}%`}
          />
        </StatsGrid>

        <SectionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <SectionTitle>
            <FiActivity />
            Weekly Activity Pattern
          </SectionTitle>
          <ActivityChart>
            {stats.trends.weekly_activity.map((day, index) => {
              const maxMessages = Math.max(...stats.trends.weekly_activity.map(d => d.messages));
              const height = maxMessages > 0 ? (day.messages / maxMessages) * 100 : 0;
              const isToday = index === stats.trends.weekly_activity.length - 1;
              
              return (
                <ActivityBar
                  key={day.day}
                  $height={height}
                  $isToday={isToday}
                  title={`${day.day}: ${day.messages} messages`}
                />
              );
            })}
          </ActivityChart>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#9CA3AF' }}>
            {stats.trends.weekly_activity.map(day => (
              <span key={day.day}>{day.day.slice(0, 3)}</span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <SectionTitle>
            <FiHome />
            Room Activity
          </SectionTitle>
          <RoomActivityList>
            {stats.rooms.room_activity.map(room => (
              <RoomActivityItem key={room.room_id}>
                <RoomInfo>
                  <RoomName>{room.room_name}</RoomName>
                  <RoomStats>
                    {room.message_count} messages • Last active {formatTimeAgo(room.last_active)}
                  </RoomStats>
                </RoomInfo>
                <EngagementBadge $level={getEngagementLevel(room.engagement_rate)}>
                  {room.engagement_rate}% engaged
                </EngagementBadge>
              </RoomActivityItem>
            ))}
            {stats.rooms.room_activity.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>
                No room activity yet
              </p>
            )}
          </RoomActivityList>
        </SectionCard>

        {stats.assessments.recent_assessments.length > 0 && (
          <SectionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <SectionTitle>
              <FiAward />
              Recent Assessments
            </SectionTitle>
            <RoomActivityList>
              {stats.assessments.recent_assessments.map(assessment => (
                <RoomActivityItem key={assessment.assessment_id}>
                  <RoomInfo>
                    <RoomName>{assessment.chatbot_name}</RoomName>
                    <RoomStats>
                      Completed {formatTimeAgo(assessment.completed_at)}
                    </RoomStats>
                  </RoomInfo>
                  <EngagementBadge $level={assessment.score >= 70 ? 'high' : assessment.score >= 50 ? 'medium' : 'low'}>
                    {assessment.score}%
                  </EngagementBadge>
                </RoomActivityItem>
              ))}
            </RoomActivityList>
          </SectionCard>
        )}

        {stats.safety.flagged_messages > 0 && (
          <SectionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <SectionTitle style={{ color: '#DC2626' }}>
              <FiAlertTriangle />
              Safety Concerns
            </SectionTitle>
            <p style={{ color: '#6B7280', marginBottom: '16px' }}>
              {stats.safety.flagged_messages} flagged message{stats.safety.flagged_messages !== 1 ? 's' : ''} requiring attention
            </p>
          </SectionCard>
        )}
      </Container>
    </PageWrapper>
  );
}