'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import { FiArrowLeft, FiArrowRight, FiClock, FiDownload, FiFile } from 'react-icons/fi';
import { PageWrapper, Container } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';
import { LazyVideoPlayer as VideoPlayerWithTracking } from '@/components/shared/LazyComponents';
import { parseVideoUrl } from '@/lib/utils/video-utils';
import LightbulbLoader from '@/components/shared/LightbulbLoader';
import type { CourseLesson, Course } from '@/types/database.types';

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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(152, 93, 215, 0.2);
  border-radius: 10px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    border-color: rgba(152, 93, 215, 0.3);
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
  font-size: 2rem;
  font-weight: 700;
  color: #111827; /* Black for consistency */
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
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
  background: rgba(152, 93, 215, 0.05);
  border: 1px solid rgba(152, 93, 215, 0.1);
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
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const VideoSection = styled.div`
  margin-bottom: 32px;
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const MainContent = styled.div``;

const Sidebar = styled.div``;

const DescriptionCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(152, 93, 215, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  .content {
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.text.primary};
    
    ul {
      margin: 8px 0;
      padding-left: 24px;
    }
    
    ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    
    strong {
      font-weight: 600;
    }
    
    em {
      font-style: italic;
    }
  }
`;

const DocumentsCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(152, 93, 215, 0.1);
  border-radius: 16px;
  padding: 24px;
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const DocumentItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(152, 93, 215, 0.05);
  border: 1px solid rgba(152, 93, 215, 0.1);
  border-radius: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease;
  margin-bottom: 8px;
  
  &:hover {
    background: rgba(152, 93, 215, 0.1);
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

export default function StudentLessonPage() {
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
  
  console.log('[Student LessonPage] Component mounted - THIS SHOULD NOT HAPPEN FOR TEACHER PREVIEW:', {
    courseId,
    lessonId,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    referrer: typeof document !== 'undefined' ? document.referrer : 'SSR'
  });

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    try {
      // Get student user ID from various sources
      const getStudentId = () => {
        if (typeof window === 'undefined') return null;
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('user_id');
        const urlUid = urlParams.get('uid');
        
        let decodedUserId = null;
        const accessSignature = urlParams.get('access_signature');
        const timestamp = urlParams.get('ts');
        
        if (accessSignature && timestamp) {
          try {
            const decoded = atob(accessSignature);
            const [userId, signatureTimestamp] = decoded.split(':');
            if (signatureTimestamp === timestamp) {
              decodedUserId = userId;
            }
          } catch (e) {
            console.error('Failed to decode access signature:', e);
          }
        }
        
        const storedDirectId = localStorage.getItem('student_direct_access_id');
        const storedCurrentId = localStorage.getItem('current_student_id');
        
        return decodedUserId || urlUserId || urlUid || storedDirectId || storedCurrentId;
      };
      
      // Try session-based auth first
      let courseResponse = await fetch(`/api/student/courses/${courseId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // If session auth fails, try direct access
      if (!courseResponse.ok && courseResponse.status === 401) {
        const studentUserId = getStudentId();
        if (studentUserId) {
          console.log('Session auth failed, trying direct access with userId:', studentUserId);
          courseResponse = await fetch(`/api/student/courses/${courseId}?userId=${studentUserId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        }
      }
      const courseData = await courseResponse.json();
      
      if (!courseResponse.ok) {
        throw new Error(courseData.error || 'Failed to fetch course');
      }
      
      // Handle new API response format
      const course = courseData.success ? courseData.data : courseData;
      setCourse(course);
      
      // Sort lessons by order and store them
      const sortedLessons = (course.course_lessons || []).sort(
        (a: CourseLesson, b: CourseLesson) => a.lesson_order - b.lesson_order
      );
      setAllLessons(sortedLessons);
      
      // Find current lesson
      const currentLesson = sortedLessons.find((l: CourseLesson) => l.lesson_id === lessonId);
      if (!currentLesson) {
        throw new Error('Lesson not found');
      }
      
      console.log('Student lesson data loaded:', {
        lessonId,
        lesson: currentLesson,
        hasResources: !!(currentLesson as any).lesson_resources,
        resourceCount: (currentLesson as any).lesson_resources?.length || 0,
        resources: (currentLesson as any).lesson_resources
      });
      
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
      // Go to previous lesson
      router.push(`/student/courses/${courseId}/lessons/${previousLesson.lesson_id}`);
    } else {
      // Go back to course overview (teacher view for testing)
      router.push(`/teacher-dashboard/courses/${courseId}`);
    }
  };

  const handleNextNavigation = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push(`/student/courses/${courseId}/lessons/${nextLesson.lesson_id}`);
    }
  };

  if (loading) {
    return (
      <PageWrapper gradient>
        <Container>
          <LoadingContainer>
            <LightbulbLoader size="large" />
            <p>Loading lesson...</p>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (error || !lesson || !course) {
    return (
      <PageWrapper gradient>
        <Container>
          <ErrorMessage>
            <h3>Lesson Not Found</h3>
            <p>{error || 'The lesson you are looking for could not be found.'}</p>
          </ErrorMessage>
        </Container>
      </PageWrapper>
    );
  }

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  return (
    <PageWrapper gradient>
      <PageTransition>
        <Container size="large">
          <NavigationBar>
            <NavButton 
              $variant="back" 
              onClick={handleBackNavigation}
              title={previousLesson ? `Previous: ${previousLesson.title}` : 'Back to Course'}
            >
              <FiArrowLeft /> 
              {previousLesson ? 'Previous Lesson' : 'Course Overview'}
            </NavButton>
            
            {nextLesson && (
              <NavButton 
                $variant="next" 
                onClick={handleNextNavigation}
                title={`Next: ${nextLesson.title}`}
              >
                Next Lesson
                <FiArrowRight />
              </NavButton>
            )}
          </NavigationBar>
          
          <LessonHeader>
            <CourseInfo>
              <h3>{course.title}</h3>
              <p>Lesson {lesson.lesson_order} of {(course as any).lesson_count || 'Unknown'}</p>
            </CourseInfo>
            
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

          <VideoSection>
            {!videoReady ? (
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
                <LightbulbLoader size="medium" />
              </div>
            ) : (() => {
              const videoUrl = lesson.video_url || '';
              const videoInfo = parseVideoUrl(videoUrl);
              
              console.log('Video detection:', { videoUrl, platform: videoInfo.platform, embedUrl: videoInfo.embedUrl });
              
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
                    trackProgress={true}
                  />
                );
              }
            })()}
          </VideoSection>

          <ContentSection>
            <MainContent>
              {lesson.description && (
                <DescriptionCard>
                  <h3>Lesson Information</h3>
                  <div className="content">
                    {lesson.description.split('\n').map((line, index) => (
                      <p key={index} style={{ margin: '0 0 8px 0' }}>
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </DescriptionCard>
              )}
            </MainContent>
            
            <Sidebar>
              <DocumentsCard>
                <h3>Resources</h3>
                <p style={{ color: '#999', fontSize: '14px', margin: '0 0 16px 0' }}>
                  Additional materials for this lesson
                </p>
                
                {/* Show actual lesson resources */}
                {(lesson as any).lesson_resources && (lesson as any).lesson_resources.length > 0 ? (
                  (lesson as any).lesson_resources
                    .sort((a: any, b: any) => a.upload_order - b.upload_order)
                    .map((resource: any) => (
                      <DocumentItem 
                        key={resource.resource_id}
                        href={resource.file_url} 
                        target="_blank"
                        download={resource.name}
                      >
                        <FiFile />
                        <span>{resource.name}</span>
                        <FiDownload />
                      </DocumentItem>
                    ))
                ) : (
                  <p style={{ 
                    color: '#999', 
                    fontSize: '14px', 
                    margin: '0', 
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '20px 0'
                  }}>
                    No resources available for this lesson
                  </p>
                )}
              </DocumentsCard>
            </Sidebar>
          </ContentSection>
        </Container>
      </PageTransition>
    </PageWrapper>
  );
}