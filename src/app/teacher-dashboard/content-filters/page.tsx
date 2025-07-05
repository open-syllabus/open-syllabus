'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { ModernNav } from '@/components/teacher/ModernNav';
import { ModernButton } from '@/components/shared/ModernButton';
import { FiShield, FiAlertTriangle, FiUser, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { StatsCard } from '@/components/ui/UnifiedCards';
import { GlassCard } from '@/components/shared/GlassCard';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
`;

const ContentWrapper = styled.div`
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;


const FilteredMessagesSection = styled.div`
  margin-top: 32px;
`;

const TableCard = styled(GlassCard)`
  padding: 24px;
`;

const TableHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th {
    text-align: left;
    padding: 12px;
    color: ${({ theme }) => theme.colors.brand.primary};
    font-weight: 600;
    border-bottom: 2px solid rgba(152, 93, 215, 0.1);
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid rgba(152, 93, 215, 0.05);
  }
  
  tr:hover {
    background: rgba(152, 93, 215, 0.02);
  }
`;

const FilterBadge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch(props.$type) {
      case 'phone number': return 'rgba(239, 68, 68, 0.1)';
      case 'email address': return 'rgba(245, 158, 11, 0.1)';
      case 'social media platform': return 'rgba(139, 92, 246, 0.1)';
      case 'external link': return 'rgba(236, 72, 153, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'phone number': return '#dc2626';
      case 'email address': return '#d97706';
      case 'social media platform': return '#7c3aed';
      case 'external link': return '#db2777';
      default: return '#4b5563';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;


const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch(props.$status) {
      case 'resolved': return 'rgba(16, 185, 129, 0.1)';
      case 'false_positive': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(245, 158, 11, 0.1)';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'resolved': return '#10b981';
      case 'false_positive': return '#ef4444';
      default: return '#f59e0b';
    }
  }};
`;

interface FilteredMessage {
  filter_id: string;
  user_id: string;
  room_id: string;
  original_message: string;
  filter_reason: string;
  flagged_patterns: string[];
  created_at: string;
  status?: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  student_name?: string;
  room_name?: string;
}

export default function ContentFiltersPage() {
  const [filteredMessages, setFilteredMessages] = useState<FilteredMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    uniqueStudents: 0,
    mostCommon: ''
  });
  
  const supabase = createClient();

  useEffect(() => {
    fetchFilteredMessages();
  }, []);

  const fetchFilteredMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get teacher's students
      const { data: rooms } = await supabase
        .from('rooms')
        .select('room_id, room_name')
        .eq('teacher_id', user.id);

      if (!rooms || rooms.length === 0) {
        setLoading(false);
        return;
      }

      const roomIds = rooms.map(r => r.room_id);

      // Get filtered messages
      // First try with status filter
      let { data: messages, error: messagesError } = await supabase
        .from('filtered_messages')
        .select('*')
        .in('room_id', roomIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      // If we get a column error, try without status filter
      if (messagesError && messagesError.message.includes('column')) {
        console.log('[Content Filters] Status column not found, fetching all messages');
        const result = await supabase
          .from('filtered_messages')
          .select('*')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false })
          .limit(100);
        
        messages = result.data;
        messagesError = result.error;
      }

      if (messagesError) {
        console.error('[Content Filters Dashboard] Error fetching filtered messages:', messagesError);
      }

      if (messages) {
        // Get student details
        const userIds = [...new Set(messages.map(m => m.user_id).filter(Boolean))];
        const { data: students } = await supabase
          .from('students')
          .select('auth_user_id, first_name, surname')
          .in('auth_user_id', userIds);
        
        const studentMap = new Map(
          students?.map(s => [s.auth_user_id, s]) || []
        );

        // Add room names and student names
        const messagesWithDetails = messages.map(msg => {
          const room = rooms.find(r => r.room_id === msg.room_id);
          const student = studentMap.get(msg.user_id);
          return {
            ...msg,
            room_name: room?.room_name || 'Unknown Room',
            student_name: student 
              ? `${student.first_name} ${student.surname}`
              : 'Unknown Student'
          };
        });

        setFilteredMessages(messagesWithDetails);

        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayMessages = messages.filter(m => 
          new Date(m.created_at) >= today
        );

        const uniqueStudents = new Set(messages.map(m => m.user_id)).size;

        // Find most common filter reason
        const reasonCounts: Record<string, number> = {};
        messages.forEach(m => {
          if (m.filter_reason) {
            reasonCounts[m.filter_reason] = (reasonCounts[m.filter_reason] || 0) + 1;
          }
        });
        const mostCommon = Object.entries(reasonCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

        setStats({
          total: messages.length,
          today: todayMessages.length,
          uniqueStudents,
          mostCommon
        });
      }
    } catch (error) {
      console.error('Error fetching filtered messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = async (filterId: string, status: 'resolved' | 'false_positive') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('filtered_messages')
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('filter_id', filterId);

    if (!error) {
      // Remove from the list
      setFilteredMessages(prev => prev.filter(msg => msg.filter_id !== filterId));
      
      // Update the count in stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    }
  };

  return (
    <>
      <ModernNav />
      <PageWrapper>
        <ContentWrapper>
          <Header>
            <Title>Content Filter Monitor</Title>
            <Subtitle>
              Track blocked messages and protect student privacy
            </Subtitle>
          </Header>

          <StatsGrid>
            <StatsCard
              icon={<FiShield />}
              title="Total Blocked"
              value={stats.total}
              variant="danger"
            />
            <StatsCard
              icon={<FiClock />}
              title="Today"
              value={stats.today}
              variant="warning"
            />
            <StatsCard
              icon={<FiUser />}
              title="Unique Students"
              value={stats.uniqueStudents}
              variant="primary"
            />
            <StatsCard
              icon={<FiAlertTriangle />}
              title="Most Common"
              value={stats.mostCommon}
              variant="success"
            />
          </StatsGrid>

          <FilteredMessagesSection>
            <TableCard variant="light">
              <TableHeader>
                <FiShield />
                Recent Blocked Messages
              </TableHeader>
              {loading ? (
              <p>Loading filtered messages...</p>
            ) : filteredMessages.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
                No messages have been filtered yet. This is good news!
              </p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Student</th>
                    <th>Classroom</th>
                    <th>Blocked Content</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr key={msg.filter_id}>
                      <td>{formatDate(msg.created_at)}</td>
                      <td>{msg.student_name}</td>
                      <td>{msg.room_name}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.original_message}
                      </td>
                      <td>
                        <FilterBadge $type={msg.filter_reason}>
                          {msg.filter_reason}
                        </FilterBadge>
                      </td>
                      <td>
                        <ActionButtons>
                          <ModernButton
                            variant="success"
                            size="small"
                            onClick={() => handleUpdateStatus(msg.filter_id, 'resolved')}
                            title="Mark as resolved"
                          >
                            <FiCheck /> Resolve
                          </ModernButton>
                          <ModernButton
                            variant="danger"
                            size="small"
                            onClick={() => handleUpdateStatus(msg.filter_id, 'false_positive')}
                            title="Mark as false positive"
                          >
                            <FiX /> False Positive
                          </ModernButton>
                        </ActionButtons>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            </TableCard>
          </FilteredMessagesSection>
        </ContentWrapper>
      </PageWrapper>
    </>
  );
}