// src/components/teacher/AddKnowledgeModal.tsx
'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFile, FiGlobe, FiVideo } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import DocumentUploader from '@/components/teacher/DocumentUploader';
import EnhancedRagScraper from '@/components/teacher/EnhancedRagScraper';
import VideoTranscriptInput from '@/components/teacher/VideoTranscriptInput';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalContent = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
`;

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.lg};
  right: ${({ theme }) => theme.spacing.lg};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
  background: ${({ $active, theme }) => 
    $active 
      ? theme.colors.ui.background
      : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-weight: 500;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ $active, theme }) => 
    $active ? theme.shadows.sm : 'none'};
  
  &:hover:not(:disabled) {
    background: ${({ $active, theme }) => 
      $active 
        ? theme.colors.ui.background
        : theme.colors.ui.background};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TabContent = styled(motion.div)``;

const SectionDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-family: ${({ theme }) => theme.fonts.body};
`;

interface AddKnowledgeModalProps {
  chatbotId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'document' | 'webpage' | 'video';

export default function AddKnowledgeModal({
  chatbotId,
  onClose,
  onSuccess
}: AddKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('document');

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {true && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <ModalContent
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ModalHeader>
              <Title>Add Knowledge</Title>
              <CloseButton onClick={onClose} aria-label="Close">
                <FiX />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <TabContainer>
                <Tab
                  $active={activeTab === 'document'}
                  onClick={() => setActiveTab('document')}
                >
                  <FiFile />
                  Upload Document
                </Tab>
                <Tab
                  $active={activeTab === 'webpage'}
                  onClick={() => setActiveTab('webpage')}
                >
                  <FiGlobe />
                  Add Webpage
                </Tab>
                <Tab
                  $active={activeTab === 'video'}
                  onClick={() => setActiveTab('video')}
                >
                  <FiVideo />
                  Add Video
                </Tab>
              </TabContainer>
              
              <TabContent
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'document' && (
                  <>
                    <SectionDescription>
                      Upload PDF, Word documents, or text files to add to your knowledge base. 
                      These documents will be processed and made searchable.
                    </SectionDescription>
                    <DocumentUploader 
                      chatbotId={chatbotId} 
                      onUploadSuccess={handleSuccess}
                    />
                  </>
                )}
                
                {activeTab === 'webpage' && (
                  <>
                    <SectionDescription>
                      Add web pages by URL. The content will be extracted and added to your knowledge base.
                      Great for online articles, documentation, and reference materials.
                    </SectionDescription>
                    <EnhancedRagScraper
                      chatbotId={chatbotId}
                      onScrapeSuccess={handleSuccess}
                    />
                  </>
                )}
                
                {activeTab === 'video' && (
                  <>
                    <SectionDescription>
                      Add educational videos from YouTube, Vimeo, or Loom. Transcripts will be automatically 
                      extracted and added to your knowledge base.
                    </SectionDescription>
                    <VideoTranscriptInput
                      chatbotId={chatbotId}
                      onSuccess={handleSuccess}
                    />
                  </>
                )}
              </TabContent>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}