// src/components/teacher/EditRoomModal.tsx
'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Room, Chatbot, Course } from '@/types/database.types';

// Modern styled components with consistent styling
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0;
    align-items: flex-start;
  }
`;

const FormCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  width: 100%;
  max-width: 680px;
  margin: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 0;
    width: 100%;
    min-height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  background: ${({ theme }) => theme.colors.ui.pastelGray};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const FormContent = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  flex-grow: 1;
  background: white;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.ui.border};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
  }
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.ui.border} ${({ theme }) => theme.colors.ui.pastelGray};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 20px;
  }
`;

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.status.danger}10;
    color: ${({ theme }) => theme.colors.status.danger};
    transform: rotate(90deg);
  }
`;

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const SelectionList = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  padding: ${({ theme }) => theme.spacing.xs};
  max-height: 280px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.ui.border};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 200px;
  }
`;

const SelectionItem = styled.label`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: white;
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm};
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
`;

const CheckboxCustom = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 2px solid ${({ $checked, theme }) => $checked ? theme.colors.brand.primary : theme.colors.ui.border};
  background: ${({ $checked, theme }) => $checked ? theme.colors.brand.primary : 'white'};
  margin-right: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  svg {
    width: 12px;
    height: 12px;
    color: white;
    opacity: ${({ $checked }) => $checked ? 1 : 0};
    transform: scale(${({ $checked }) => $checked ? 1 : 0});
    transition: all 0.2s ease;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 2px;
`;

const ItemDescription = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  background: ${({ theme }) => theme.colors.ui.pastelGray};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;


interface EditRoomModalProps {
  room: Room;
  chatbots: Chatbot[];
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
  onRefreshCourses?: () => void;
}

export default function EditRoomModal({ room, chatbots, courses, onClose, onSuccess, onRefreshCourses }: EditRoomModalProps) {
  const [selectedChatbots, setSelectedChatbots] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoomAssociations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch both chatbots and courses in parallel
        const [chatbotsResponse, coursesResponse] = await Promise.all([
          fetch(`/api/teacher/room-chatbots-associations?roomId=${room.room_id}`),
          fetch(`/api/teacher/room-courses-associations?roomId=${room.room_id}`)
        ]);

        if (!chatbotsResponse.ok) {
          const errorData = await chatbotsResponse.json().catch(() => ({ error: 'Failed to parse chatbots error' }));
          throw new Error(errorData.error || 'Failed to fetch room chatbots');
        }

        if (!coursesResponse.ok) {
          const errorData = await coursesResponse.json().catch(() => ({ error: 'Failed to parse courses error' }));
          throw new Error(errorData.error || 'Failed to fetch room courses');
        }
        
        const chatbotsData = await chatbotsResponse.json();
        const coursesData = await coursesResponse.json();
        
        setSelectedChatbots(chatbotsData.map((rc: { chatbot_id: string }) => rc.chatbot_id));
        setSelectedCourses(coursesData.map((rc: { course_id: string }) => rc.course_id));
      } catch (err) {
        console.error("EditRoomModal fetchRoomAssociations error:", err);
        setError(err instanceof Error ? err.message : 'Failed to load current assignments for this room.');
      } finally {
        setIsLoading(false);
      }
    };

    if (room?.room_id) {
        fetchRoomAssociations();
    } else {
        setError("Room information is missing.");
        setIsLoading(false);
    }
  }, [room.room_id]);

  const handleToggleChatbot = (chatbotId: string) => {
    setSelectedChatbots(prev => 
      prev.includes(chatbotId)
        ? prev.filter(id => id !== chatbotId)
        : [...prev, chatbotId]
    );
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Update both chatbots and courses in parallel
      const [chatbotsResponse, coursesResponse] = await Promise.all([
        fetch(`/api/teacher/room-chatbots-associations?roomId=${room.room_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatbot_ids: selectedChatbots }),
        }),
        fetch(`/api/teacher/room-courses-associations?roomId=${room.room_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_ids: selectedCourses }),
        })
      ]);

      // Check chatbots response
      if (!chatbotsResponse.ok) {
        let errorMsg = 'Failed to update room Skolrs';
        try {
          const errorData = await chatbotsResponse.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Failed to update room Skolrs (status: ${chatbotsResponse.status})`;
        }
        throw new Error(errorMsg);
      }

      // Check courses response
      if (!coursesResponse.ok) {
        let errorMsg = 'Failed to update room courses';
        try {
          const errorData = await coursesResponse.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Failed to update room courses (status: ${coursesResponse.status})`;
        }
        throw new Error(errorMsg);
      }

      onSuccess();
    } catch (err) {
      console.error("EditRoomModal handleSubmit error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Overlay 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <FormCard
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Header>
          <Title>Edit Room: {room.room_name}</Title>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </Header>

        <FormContent>
          {error && <Alert variant="error" style={{ marginBottom: '20px' }}>{error}</Alert>}

          <Section>
            <SectionTitle>Select Skolrs for this Room</SectionTitle>
            {isLoading ? (
              <EmptyMessage>Loading Skolrs...</EmptyMessage>
            ) : chatbots.length === 0 ? (
              <EmptyMessage>No Skolrs available to assign. Please create a Skolr first.</EmptyMessage>
            ) : (
              <SelectionList>
                {chatbots.map(chatbot => (
                  <SelectionItem key={chatbot.chatbot_id}>
                    <Checkbox
                      id={`cb-edit-${chatbot.chatbot_id}`}
                      checked={selectedChatbots.includes(chatbot.chatbot_id)}
                      onChange={() => handleToggleChatbot(chatbot.chatbot_id)}
                    />
                    <CheckboxCustom $checked={selectedChatbots.includes(chatbot.chatbot_id)}>
                      <FiCheck />
                    </CheckboxCustom>
                    <ItemContent>
                      <ItemName>{chatbot.name}</ItemName>
                      {chatbot.description && (
                        <ItemDescription>
                          {chatbot.description.length > 60 
                            ? chatbot.description.substring(0, 60) + '...' 
                            : chatbot.description}
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </SelectionItem>
                ))}
              </SelectionList>
            )}
          </Section>

          <Section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <SectionTitle style={{ margin: 0 }}>Select Courses (Optional)</SectionTitle>
              {onRefreshCourses && (
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={onRefreshCourses}
                >
                  Refresh
                </ModernButton>
              )}
            </div>
            {isLoading ? (
              <EmptyMessage>Loading courses...</EmptyMessage>
            ) : !courses || courses.length === 0 ? (
              <EmptyMessage>
                No courses available. Create courses in the Courses section.
              </EmptyMessage>
            ) : (
              <SelectionList>
                {(courses || []).map(course => (
                  <SelectionItem key={course.course_id}>
                    <Checkbox
                      id={`course-edit-${course.course_id}`}
                      checked={selectedCourses.includes(course.course_id)}
                      onChange={() => handleToggleCourse(course.course_id)}
                    />
                    <CheckboxCustom $checked={selectedCourses.includes(course.course_id)}>
                      <FiCheck />
                    </CheckboxCustom>
                    <ItemContent>
                      <ItemName>
                        {course.title}
                        {course.subject && (
                          <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px', fontWeight: 'normal' }}>
                            ({course.subject})
                          </span>
                        )}
                      </ItemName>
                      {course.description && (
                        <ItemDescription>
                          {course.description.length > 60 
                            ? course.description.substring(0, 60) + '...' 
                            : course.description}
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </SelectionItem>
                ))}
              </SelectionList>
            )}
          </Section>
        </FormContent>

        <Footer>
          <ModernButton type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </ModernButton>
          <ModernButton 
            type="button" 
            variant="primary"
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || (chatbots.length > 0 && selectedChatbots.length === 0 && !isLoading) }
            title={chatbots.length > 0 && selectedChatbots.length === 0 && !isLoading ? "Select at least one Skolr" : undefined}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </ModernButton>
        </Footer>
      </FormCard>
    </Overlay>
  );
}