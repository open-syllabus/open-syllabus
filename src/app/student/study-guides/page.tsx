// Study guides page for students
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiTrash2, FiDownload, FiFileText, FiHeadphones } from 'react-icons/fi';
import LightbulbLoader from '@/components/shared/LightbulbLoader';
import { ModernButton } from '@/components/shared/ModernButton';
import { PageTransition } from '@/components/shared/PageTransition';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { Toast } from '@/components/shared/Toast';
import { StudyGuideModal } from '@/components/shared/StudyGuideModal';
import { StudentPageTitle, StudentSectionTitle, StudentCardTitle, StudentSubtitle } from '@/styles/studentStyles';

interface StudyGuide {
  study_guide_id: string;
  notebook_id: string;
  title: string;
  content: string;
  source_entries_count: number;
  created_at: string;
  updated_at: string;
  notebook: {
    notebook_id: string;
    name: string;
    title?: string;
    chatbot_id: string;
  };
  podcasts?: {
    podcast_id: string;
    voice: string;
    speed: number;
    duration_seconds?: number;
    created_at: string;
  }[];
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

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const Title = StudentPageTitle;

const Subtitle = StudentSubtitle;

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const GuideCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  padding: ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.ui.pastelBlue};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.colors.ui.pastelBlue} 0%,
      ${({ theme }) => theme.colors.ui.pastelGreen} 50%,
      ${({ theme }) => theme.colors.ui.pastelPink} 100%
    );
  }
`;

const GuideHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GuideTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotebookName = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.brand.primary};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const PodcastBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  color: ${({ theme }) => theme.colors.brand.primary};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const GuideMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GuideActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border}20;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl} 0;
  
  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #000000;
  }
  
  p {
    margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 1.125rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

export default function StudyGuidesPage() {
  const router = useRouter();
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<StudyGuide | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  useEffect(() => {
    fetchStudyGuides();
  }, []);

  const fetchStudyGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/study-guides');
      const data = await response.json();

      if (response.ok && data.studyGuides) {
        setStudyGuides(data.studyGuides);
      }
    } catch (error) {
      console.error('Error fetching study guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleDeleteGuide = (guide: StudyGuide) => {
    showConfirmation(
      'Delete Study Guide',
      `Are you sure you want to delete "${guide.title}"? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/student/study-guides?id=${guide.study_guide_id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setStudyGuides(studyGuides.filter(g => g.study_guide_id !== guide.study_guide_id));
            showToastMessage('Study guide deleted successfully', 'success');
          } else {
            showToastMessage('Failed to delete study guide', 'error');
          }
        } catch (error) {
          console.error('Error deleting study guide:', error);
          showToastMessage('Error deleting study guide', 'error');
        }
      }
    );
  };

  const handleExportGuide = (guide: StudyGuide, format: 'markdown' | 'pdf') => {
    if (format === 'markdown') {
      const blob = new Blob([guide.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = guide.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${filename}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToastMessage('Study guide exported successfully', 'success');
    } else {
      // For PDF, we'd need to implement proper PDF generation
      setSelectedGuide(guide);
      setShowGuideModal(true);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <PageWrapper>
          <Container>
            <LoadingContainer>
              <LightbulbLoader size="large" />
            </LoadingContainer>
          </Container>
        </PageWrapper>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageWrapper>
        <Container>
          <PageHeader>
            <Title>My Study Guides</Title>
            <Subtitle>
              All your generated study guides in one place
            </Subtitle>
          </PageHeader>

          {studyGuides.length === 0 ? (
            <EmptyState>
              <h3>No study guides yet</h3>
              <p>Generate study guides from your notebook notes to see them here</p>
              <ModernButton
                variant="primary"
                onClick={() => router.push('/student/notebooks')}
              >
                Go to Notebooks
              </ModernButton>
            </EmptyState>
          ) : (
            <GuideGrid>
              <AnimatePresence mode="popLayout">
                {studyGuides.map((guide, index) => (
                  <GuideCard
                    key={guide.study_guide_id}
                    layoutId={guide.study_guide_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedGuide(guide);
                      setShowGuideModal(true);
                    }}
                  >
                    <GuideHeader>
                      <GuideTitle>{guide.title}</GuideTitle>
                      <NotebookName>
                        <FiFileText />
                        {guide.notebook?.title || guide.notebook?.name}
                      </NotebookName>
                    </GuideHeader>
                    
                    <GuideMeta>
                      <div>Generated {new Date(guide.created_at).toLocaleDateString()}</div>
                      <div>Based on {guide.source_entries_count} notes</div>
                      {guide.podcasts && guide.podcasts.length > 0 && (
                        <PodcastBadge>
                          <FiHeadphones />
                          {guide.podcasts.length} podcast{guide.podcasts.length > 1 ? 's' : ''} available
                        </PodcastBadge>
                      )}
                    </GuideMeta>
                    
                    <GuideActions onClick={(e) => e.stopPropagation()}>
                      <ModernButton
                        variant="ghost"
                        size="small"
                        onClick={() => handleExportGuide(guide, 'markdown')}
                      >
                        <FiDownload />
                        Export
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="small"
                        onClick={() => handleDeleteGuide(guide)}
                      >
                        <FiTrash2 />
                        Delete
                      </ModernButton>
                    </GuideActions>
                  </GuideCard>
                ))}
              </AnimatePresence>
            </GuideGrid>
          )}
          
          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmAction || (() => {})}
            title={confirmTitle}
            message={confirmMessage}
            variant="danger"
          />
          
          {/* Toast Notifications */}
          <Toast
            isVisible={showToast}
            onClose={() => setShowToast(false)}
            message={toastMessage}
            type={toastType}
          />
          
          {/* Study Guide Modal */}
          {selectedGuide && (
            <StudyGuideModal
              isOpen={showGuideModal}
              onClose={() => {
                setShowGuideModal(false);
                setSelectedGuide(null);
              }}
              content={selectedGuide.content}
              notebookTitle={selectedGuide.title}
              studyGuideId={selectedGuide.study_guide_id}
            />
          )}
        </Container>
      </PageWrapper>
    </PageTransition>
  );
}