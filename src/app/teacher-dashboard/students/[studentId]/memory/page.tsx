// src/app/teacher-dashboard/students/[studentId]/memory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageWrapper } from '@/components/shared/PageStructure';
import { Container } from '@/styles/StyledComponents';
import StudentMemoryView from '@/components/teacher/StudentMemoryView';
import { ModernButton } from '@/components/shared/ModernButton';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
`;

const Select = styled.select`
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: white;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  min-width: 250px;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

export default function StudentMemoryPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [studentName, setStudentName] = useState<string>('');
  const [chatbots, setChatbots] = useState<Array<{ chatbot_id: string; name: string }>>([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStudentAndChatbots();
  }, [studentId]);

  const fetchStudentAndChatbots = async () => {
    try {
      // Get student info
      const { data: studentData } = await supabase
        .from('students')
        .select('first_name, surname, username')
        .eq('student_id', studentId)
        .single();

      if (studentData) {
        const fullName = `${studentData.first_name} ${studentData.surname}`.trim();
        setStudentName(fullName || studentData.username || 'Student');
      }

      // Get teacher's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('[Memory Page] Current teacher ID:', user.id);
        // Get all rooms the student is a member of
        const { data: roomMemberships, error: membershipsError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('student_id', studentId)
          .eq('is_active', true);
        
        if (membershipsError) {
          console.error('[Memory Page] Error fetching room memberships:', membershipsError);
        }

        if (roomMemberships && roomMemberships.length > 0) {
          const roomIds = roomMemberships.map(rm => rm.room_id);
          console.log('[Memory Page] Student is member of rooms:', roomIds);
          
          // Get all chatbots associated with those rooms that belong to this teacher
          const { data: roomChatbots, error: roomChatbotsError } = await supabase
            .from('room_chatbots')
            .select(`
              chatbot_id,
              chatbots (
                chatbot_id,
                name,
                teacher_id
              )
            `)
            .in('room_id', roomIds);

          if (roomChatbotsError) {
            console.error('[Memory Page] Error fetching room chatbots:', roomChatbotsError);
          }

          console.log('[Memory Page] Room chatbots found:', roomChatbots?.length || 0);

          if (roomChatbots && roomChatbots.length > 0) {
            // Extract unique chatbots that belong to this teacher
            const uniqueChatbots = new Map();
            roomChatbots.forEach(rc => {
              // Type assertion to handle the join data
              const chatbot = rc.chatbots as any;
              if (chatbot && chatbot.teacher_id === user.id) {
                uniqueChatbots.set(chatbot.chatbot_id, {
                  chatbot_id: chatbot.chatbot_id,
                  name: chatbot.name
                });
              }
            });
            
            const chatbotsList = Array.from(uniqueChatbots.values());
            console.log('[Memory Page] Filtered chatbots for teacher:', chatbotsList);
            setChatbots(chatbotsList);
            if (chatbotsList.length > 0) {
              console.log('[Memory Page] Setting default chatbot:', chatbotsList[0]);
              setSelectedChatbotId(chatbotsList[0].chatbot_id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingSpinner />
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{studentName}'s Learning Memory</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>View conversation history and learning progress</p>
          <ModernButton 
            variant="ghost" 
            onClick={() => window.history.back()}
            style={{ marginBottom: '1rem' }}
          >
            ← Back to Students
          </ModernButton>
        </div>
      {chatbots.length > 0 ? (
        <>
          <SelectorContainer>
            <Label htmlFor="chatbot-select">Select Chatbot:</Label>
            <Select
              id="chatbot-select"
              value={selectedChatbotId || ''}
              onChange={(e) => setSelectedChatbotId(e.target.value)}
            >
              {chatbots.map((chatbot) => (
                <option key={chatbot.chatbot_id} value={chatbot.chatbot_id}>
                  {chatbot.name}
                </option>
              ))}
            </Select>
          </SelectorContainer>

          {selectedChatbotId && (
            <StudentMemoryView
              studentId={studentId}
              chatbotId={selectedChatbotId}
              studentName={studentName}
            />
          )}
        </>
      ) : (
        <p style={{ color: '#666' }}>
          This student doesn't have access to any of your chatbots yet. 
          Add the student to a room and assign chatbots to that room to enable memory tracking.
        </p>
      )}
      </Container>
    </PageWrapper>
  );
}