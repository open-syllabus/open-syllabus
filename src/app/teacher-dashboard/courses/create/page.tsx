'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { CourseForm } from '@/components/teacher/CourseForm';
import { PageWrapper, Container } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { Course } from '@/types/database.types';

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(152, 93, 215, 0.2);
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    border-color: rgba(152, 93, 215, 0.3);
    transform: translateX(-2px);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(-2px);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.magenta}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const FormContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
`;

export default function CreateCoursePage() {
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roomIdParam = searchParams.get('roomId');
    if (roomIdParam) {
      setRoomId(roomIdParam);
      // Optionally fetch room name
      fetchRoomName(roomIdParam);
    }
  }, [searchParams]);

  const fetchRoomName = async (roomId: string) => {
    try {
      const response = await fetch(`/api/teacher/room-details?roomId=${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoomName(data.room?.name || null);
      }
    } catch (error) {
      console.error('Error fetching room name:', error);
    }
  };

  const handleSubmit = async (courseData: Partial<Course>) => {
    setLoading(true);
    
    try {
      // Include roomId if creating from a room
      const courseDataWithRoom = {
        ...courseData,
        ...(roomId ? { room_id: roomId } : {})
      };
      
      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseDataWithRoom)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }
      
      // Navigate back to room or to course detail
      if (roomId) {
        router.push(`/teacher-dashboard/rooms/${roomId}`);
      } else {
        router.push(`/teacher-dashboard/courses/${data.course.course_id}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (roomId) {
      router.push(`/teacher-dashboard/rooms/${roomId}`);
    } else {
      router.push('/teacher-dashboard/courses');
    }
  };

  return (
    <PageWrapper gradient>
      <PageTransition>
        <Container size="large">
          <Header>
            <BackButton onClick={handleCancel}>
              <FiArrowLeft /> Back to {roomId ? 'Room' : 'Courses'}
            </BackButton>
            
            <Title>Create New Course</Title>
            <Subtitle>
              {roomId && roomName 
                ? `Creating course for ${roomName}`
                : 'Design a structured learning path with video lessons'
              }
            </Subtitle>
          </Header>

          <CourseForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
          />
        </Container>
      </PageTransition>
    </PageWrapper>
  );
}