'use client';

import { useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { FiX } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { Input, Label, FormGroup, FormText, Checkbox } from '@/components/ui/Form';
import { Text } from '@/components/ui/Typography';
import { Alert } from '@/styles/StyledComponents';
import type { Chatbot, Course } from '@/types/database.types';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Tooltip } from '@/components/onboarding/Tooltip';
// import { csrfFetch } from '@/lib/csrf/client';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
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

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 650px;
  margin: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: hidden;

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
  padding: 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const CloseButton = styled.button`
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border: none;
  color: ${({ theme }) => theme.colors.brand.primary};
  cursor: pointer;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
    transform: scale(1.1);
  }
`;

const FormContent = styled.div`
  padding: 32px;
  overflow-y: auto;
  flex-grow: 1;
  max-height: calc(90vh - 140px);
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.ui.borderDark};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
  }
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.ui.borderDark} ${({ theme }) => theme.colors.ui.pastelGray};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
    max-height: calc(100vh - 140px);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  flex-shrink: 0;
  background-color: ${({ theme }) => theme.colors.ui.backgroundLight};
  position: sticky;
  bottom: 0;
  z-index: 5;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    padding: 20px;
  }
`;

const ChatbotList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  padding: 8px;
  margin-top: 12px;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 200px;
  }
`;

const ChatbotItem = styled.label`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.background};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
    min-height: 44px;
  }
`;

const ChatbotInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

interface RoomFormProps {
  chatbots: Chatbot[];
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
  onRefreshCourses?: () => void;
}

export default function RoomForm({ chatbots, courses, onClose, onSuccess, onRefreshCourses }: RoomFormProps) {
  const [formData, setFormData] = useState({
    room_name: '',
    chatbot_ids: [] as string[],
    course_ids: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnboarding, currentStep, completeStep } = useOnboarding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      // Complete onboarding step if applicable
      if (isOnboarding && currentStep === OnboardingStep.CREATE_ROOM) {
        completeStep(OnboardingStep.CREATE_ROOM);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      room_name: e.target.value,
    }));
  };

  const handleToggleChatbot = (chatbotId: string) => {
    setFormData(prev => ({
      ...prev,
      chatbot_ids: prev.chatbot_ids.includes(chatbotId)
        ? prev.chatbot_ids.filter(id => id !== chatbotId)
        : [...prev.chatbot_ids, chatbotId]
    }));
  };

  const handleToggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId]
    }));
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <FormCard>
        <Header>
          <Title>Create Room</Title>
          <CloseButton onClick={onClose}>
            ×
          </CloseButton>
        </Header>

        <FormContent>
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="room_name">Room Name</Label>
            <Input
              id="room_name"
              name="room_name"
              value={formData.room_name}
              onChange={handleNameChange}
              placeholder="e.g. Math Period 3"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label className="select-skolrs-label">Select Skolrs</Label>
            {chatbots.length === 0 ? (
              <FormText>
                You need to create a Skolr before you can create a room.
              </FormText>
            ) : (
              <ChatbotList>
                {chatbots.map(chatbot => (
                  <ChatbotItem key={chatbot.chatbot_id}>
                    <Checkbox
                      id={`chatbot-${chatbot.chatbot_id}`}
                      checked={formData.chatbot_ids.includes(chatbot.chatbot_id)}
                      onChange={() => handleToggleChatbot(chatbot.chatbot_id)}
                    />
                    <ChatbotInfo>
                      <Text weight="medium">{chatbot.name}</Text>
                      {chatbot.description && (
                        <Text variant="caption" color="muted">
                          {chatbot.description}
                        </Text>
                      )}
                    </ChatbotInfo>
                  </ChatbotItem>
                ))}
              </ChatbotList>
            )}
          </FormGroup>

          <FormGroup>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Label style={{ margin: 0 }}>Select Courses (Optional)</Label>
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
            {!courses || courses.length === 0 ? (
              <FormText>
                No courses available. You can create courses in the Courses section and assign them later.
              </FormText>
            ) : (
              <ChatbotList>
                {(courses || []).map(course => (
                  <ChatbotItem key={course.course_id}>
                    <Checkbox
                      id={`course-${course.course_id}`}
                      checked={formData.course_ids.includes(course.course_id)}
                      onChange={() => handleToggleCourse(course.course_id)}
                    />
                    <ChatbotInfo>
                      <Text weight="medium">{course.title}</Text>
                      {course.description && (
                        <Text variant="caption" color="muted">
                          {course.description}
                        </Text>
                      )}
                      {course.subject && (
                        <Text variant="caption" color="muted">
                          Subject: {course.subject}
                        </Text>
                      )}
                    </ChatbotInfo>
                  </ChatbotItem>
                ))}
              </ChatbotList>
            )}
          </FormGroup>

          </form>
        </FormContent>
        
        <Footer>
          <ModernButton 
            type="button" 
            variant="ghost" 
            onClick={onClose}
          >
            Cancel
          </ModernButton>
          <ModernButton 
            type="submit" 
            variant="primary"
            disabled={isSubmitting || (chatbots.length === 0 && !isOnboarding) || (!isOnboarding && formData.chatbot_ids.length === 0)}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Creating...' : 'Create Room'}
          </ModernButton>
        </Footer>
      </FormCard>

      {/* Onboarding Tooltip */}
      <Tooltip
        selector=".select-skolrs-label"
        title="Skip Skolrs for Now"
        text="You can create a room without Skolrs for now. You'll be able to add Skolrs to your room later."
        buttonText="Got it"
        onButtonClick={() => {
          // User acknowledged
        }}
        show={isOnboarding && currentStep === OnboardingStep.CREATE_ROOM && chatbots.length === 0}
        placement="top"
      />
    </Overlay>
  );
}