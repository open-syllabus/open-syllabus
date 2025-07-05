'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled, { css } from 'styled-components';
import { FiArrowLeft, FiArrowRight, FiClock, FiDownload, FiFile } from 'react-icons/fi';
import { PageWrapper, Container } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';
import { VideoPlayerWithTracking } from '@/components/shared/VideoPlayerWithTracking';
import { parseVideoUrl } from '@/lib/utils/video-utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { CourseLesson, Course } from '@/types/database.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const PreviewBanner = styled.div`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavigationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
`;

const NavButton = styled.button<{ $variant?: 'back' | 'next' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    border-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
    transform: ${({ $variant }) => 
      $variant === 'back' ? 'translateX(-2px)' : 
      $variant === 'next' ? 'translateX(2px)' : 
      'translateY(-1px)'
    };
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: ${({ $variant }) => 
      $variant === 'back' ? 'translateX(-2px)' : 
      $variant === 'next' ? 'translateX(2px)' : 
      'none'
    };
  }
`;

const LessonHeader = styled.div`
  margin-bottom: 32px;
`;

const LessonTitle = styled.h1`
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.magenta}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 24px;
  }
`;

const LessonMeta = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  margin-bottom: 16px;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const CourseInfo = styled.div`
  padding: 16px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 12px;
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 14px;
  }
`;

const VideoSection = styled.div`
  margin-bottom: 32px;
`;

const ResourcesSection = styled.div`
  margin-top: 32px;
`;

const ResourcesHeader = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;
`;

const ResourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ResourceItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.ui.background};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease;
  margin-bottom: 8px;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
    transform: translateY(-1px);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.brand.primary};
    flex-shrink: 0;
  }
  
  span {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 16px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  h3 {
    font-size: 24px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 8px;
  }
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 16px;
  }
`;

interface LessonPreviewProps {
  courseId: string;
  lessonId: string;
}

export default function LessonPreview() {
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  
  console.log('[Teacher LessonPreview] Component mounted:', {
    courseId,
    lessonId,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    try {
      // Fetch course details with all lessons
      const courseResponse = await fetch(`/api/teacher/courses/${courseId}`);
      const courseData = await courseResponse.json();
      
      if (!courseResponse.ok) {
        throw new Error(courseData.error || 'Failed to fetch course');
      }
      
      setCourse(courseData.course);
      
      // Sort lessons by order and store them
      const sortedLessons = (courseData.course.course_lessons || []).sort(
        (a: CourseLesson, b: CourseLesson) => a.lesson_order - b.lesson_order
      );
      setAllLessons(sortedLessons);
      
      // Find current lesson
      const currentLesson = sortedLessons.find((l: CourseLesson) => l.lesson_id === lessonId);
      if (!currentLesson) {
        throw new Error('Lesson not found');
      }
      
      setLesson(currentLesson);
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set video ready state after lesson loads
  useEffect(() => {
    if (lesson && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setVideoReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lesson, loading]);

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return 'Duration unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = (platform: string | null | undefined) => {
    switch (platform) {
      case 'youtube':
        return '🎬';
      case 'vimeo':
        return '📹';
      case 'loom':
        return '📺';
      default:
        return '🎥';
    }
  };

  // Navigation logic
  const getCurrentLessonIndex = () => {
    return allLessons.findIndex(l => l.lesson_id === lessonId);
  };

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex >= 0 && currentIndex < allLessons.length - 1 
      ? allLessons[currentIndex + 1] 
      : null;
  };

  const handleBackNavigation = () => {
    const previousLesson = getPreviousLesson();
    if (previousLesson) {
      // Go to previous lesson preview
      router.push(`/teacher-dashboard/courses/${courseId}/lessons/${previousLesson.lesson_id}/preview`);
    } else {
      // Go back to course overview
      router.push(`/teacher-dashboard/courses/${courseId}`);
    }
  };

  const handleNextNavigation = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push(`/teacher-dashboard/courses/${courseId}/lessons/${nextLesson.lesson_id}/preview`);
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="large" />
        <p>Loading lesson preview...</p>
      </LoadingContainer>
    );
  }

  if (error || !lesson || !course) {
    return (
      <ErrorMessage>
        <h3>Lesson Not Found</h3>
        <p>{error || 'The lesson you are looking for could not be found.'}</p>
      </ErrorMessage>
    );
  }

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  return (
    <>
      <PreviewBanner>
        Teacher Preview Mode - This is how students will see the lesson
      </PreviewBanner>
      <Container>
        <NavigationBar>
          <NavButton $variant="back" onClick={handleBackNavigation}>
            <FiArrowLeft />
            {previousLesson ? 'Previous Lesson' : 'Back to Course'}
          </NavButton>
          
          {nextLesson && (
            <NavButton $variant="next" onClick={handleNextNavigation}>
              Next Lesson
              <FiArrowRight />
            </NavButton>
          )}
        </NavigationBar>

        <LessonHeader>
          <LessonTitle>{lesson.title}</LessonTitle>
          <LessonMeta>
            <span>
              {getPlatformIcon(lesson.video_platform)} {lesson.video_platform}
            </span>
            <span>
              <FiClock /> {formatDuration(lesson.video_duration)}
            </span>
          </LessonMeta>
        </LessonHeader>

        <CourseInfo>
          <h3>{course.title}</h3>
          <p>
            Lesson {lesson.lesson_order} of {allLessons.length}
          </p>
        </CourseInfo>

        <VideoSection>
          {lesson.video_url && !videoReady ? (
            <div style={{ 
              width: '100%', 
              aspectRatio: '16/9',
              background: '#f5f5f5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              <LoadingSpinner size="medium" />
            </div>
          ) : lesson.video_url && videoReady ? (
            (() => {
              const videoUrl = lesson.video_url || '';
              const videoInfo = parseVideoUrl(videoUrl);
              
              console.log('[Teacher Preview] Video detection:', { 
                videoUrl, 
                platform: videoInfo.platform, 
                embedUrl: videoInfo.embedUrl 
              });
              
              // For external videos (YouTube/Vimeo), use iframe embed
              if (videoInfo.platform !== 'unknown' && videoInfo.embedUrl) {
                return (
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '16/9',
                    background: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <iframe
                      src={videoInfo.embedUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                      allowFullScreen
                      title={lesson.title}
                    />
                  </div>
                );
              } else {
                // For self-hosted videos, use VideoPlayerWithTracking
                return (
                  <VideoPlayerWithTracking
                    videoId={videoUrl}
                    courseId={courseId}
                    lessonId={lessonId}
                    trackProgress={false} // Don't track progress in preview mode
                  />
                );
              }
            })()
          ) : null}
        </VideoSection>

        {(lesson as any).resources && (lesson as any).resources.length > 0 && (
          <ResourcesSection>
            <ResourcesHeader>Lesson Resources</ResourcesHeader>
            <ResourcesList>
              {(lesson as any).resources.map((resource: any, index: number) => (
                <ResourceItem
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.type === 'pdf' ? <FiFile /> : <FiDownload />}
                  <span>{resource.title}</span>
                </ResourceItem>
              ))}
            </ResourcesList>
          </ResourcesSection>
        )}
      </Container>
    </>
  );
}