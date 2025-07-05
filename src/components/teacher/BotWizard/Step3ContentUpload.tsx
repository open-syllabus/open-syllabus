// src/components/teacher/BotWizard/Step3ContentUpload.tsx
'use client';

import { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiVideo, FiFile, FiInfo, FiCheck } from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const StepCard = styled(motion.div)`
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelYellow} 0%, 
    ${({ theme }) => hexToRgba(theme.colors.ui.pastelOrange, 0.3)} 100%);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xxxl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -40%;
    left: -30%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelPink, 0.15)} 0%, 
      transparent 70%);
    opacity: 0.7;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const StepIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StepTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StepDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ContentSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
  z-index: 1;
  
  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
`;

const VideoInputWrapper = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
  z-index: 1;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UploadArea = styled.div<{ $isDragging?: boolean }>`
  border: 2px dashed ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${({ $isDragging, theme }) => $isDragging ? hexToRgba(theme.colors.brand.primary, 0.05) : 'transparent'};
  
  &:hover {
    border-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.5)};
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.brand.primary};
`;

const UploadText = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const VideoUrlInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
`;

const Button = styled(motion.button)`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border: none;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: 600;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.lg};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled(motion.div)`
  background: ${({ theme }) => hexToRgba(theme.colors.status.success, 0.2)};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.status.success, 0.3)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.status.success};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled(motion.div)`
  background: ${({ theme }) => hexToRgba(theme.colors.status.warning, 0.2)};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.3)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.status.danger};
`;

interface ContentUploadData {
  documentFile?: File | null;
  videoUrl?: string | null;
}

interface Step3ContentUploadProps {
  data: ContentUploadData;
  onUpdate: (data: ContentUploadData) => void;
  botType: string;
  chatbotId?: string | null;
}

export default function Step3ContentUpload({ data, onUpdate, botType, chatbotId }: Step3ContentUploadProps) {
  const [localData, setLocalData] = useState(data);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(data.videoUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size must be less than 20MB');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadReadingDocument = async () => {
    if (!selectedFile || !chatbotId) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/reading-document`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      setUploadSuccess(true);
      const newData = { ...localData, documentFile: selectedFile };
      setLocalData(newData);
      onUpdate(newData);
      // Let parent know upload is complete
      setTimeout(() => {
        onUpdate({ ...newData, documentFile: selectedFile });
      }, 100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const saveVideoUrl = async () => {
    if (!videoUrl || !chatbotId) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/reading-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save video URL');
      }

      setUploadSuccess(true);
      const newData = { ...localData, videoUrl };
      setLocalData(newData);
      onUpdate(newData);
      // Let parent know upload is complete
      setTimeout(() => {
        onUpdate({ ...newData, videoUrl });
      }, 100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to save video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StepCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StepHeader>
        <StepIcon>{botType === 'reading_room' ? '📄' : '🎬'}</StepIcon>
        <StepTitle>
          {botType === 'reading_room' ? 'Upload Reading Document' : 'Add Video Content'}
        </StepTitle>
        <StepDescription>
          {botType === 'reading_room' 
            ? 'Upload a PDF document that students will read and discuss with their Skolr'
            : 'Add a YouTube or Vimeo video that students will watch and learn from'
          }
        </StepDescription>
      </StepHeader>

      <ContentSection>
        {!chatbotId ? (
          <InfoBox>
            <FiInfo />
            <InfoText>
              Creating your Skolr... Please wait a moment.
            </InfoText>
          </InfoBox>
        ) : botType === 'reading_room' ? (
          <>
            <InfoBox>
              <FiInfo />
              <InfoText>
                <strong>Reading Room Documents:</strong> Upload educational PDFs like textbooks, articles, 
                or study materials. Students will be able to read the document alongside the AI assistant 
                who can answer questions, explain concepts, and guide their understanding.
              </InfoText>
            </InfoBox>

            {!uploadSuccess ? (
              <>
                <UploadArea
                  $isDragging={isDragging}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileInput
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <UploadIcon>📄</UploadIcon>
                  <UploadText>
                    {selectedFile ? selectedFile.name : 'Click or drag to upload PDF'}
                  </UploadText>
                  <InfoText style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                    Maximum file size: 20MB
                  </InfoText>
                </UploadArea>

                {selectedFile && !uploadSuccess && (
                  <Button
                    onClick={uploadReadingDocument}
                    disabled={isUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                )}
              </>
            ) : uploadSuccess ? (
              <SuccessMessage
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiCheck />
                Reading document uploaded successfully!
              </SuccessMessage>
            ) : null}
          </>
        ) : (
          <>
            <InfoBox>
              <FiInfo />
              <InfoText>
                <strong>Viewing Room Videos:</strong> Add educational videos from YouTube or Vimeo. 
                The AI will extract transcripts and help students understand the content through 
                interactive discussions and questions about the video.
              </InfoText>
            </InfoBox>

            <VideoInputWrapper>
              <SectionTitle>
                <FiVideo />
                Video URL
              </SectionTitle>
              
              {!uploadSuccess ? (
                <>
                  <VideoUrlInput
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  
                  <Button
                    onClick={saveVideoUrl}
                    disabled={!videoUrl || isUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUploading ? 'Saving...' : 'Save Video URL'}
                  </Button>
                </>
              ) : uploadSuccess ? (
                <SuccessMessage
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiCheck />
                  Video URL saved successfully!
                </SuccessMessage>
              ) : null}
            </VideoInputWrapper>
          </>
        )}
        
        {uploadError && (
          <ErrorMessage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {uploadError}
          </ErrorMessage>
        )}
      </ContentSection>

      {botType === 'reading_room' && (
        <InfoBox>
          <FiInfo />
          <InfoText>
            <strong>Pro tip:</strong> Choose documents that are clear, well-structured, and appropriate 
            for your students' reading level. The AI will use the document content to provide 
            contextual help and explanations.
          </InfoText>
        </InfoBox>
      )}

      {botType === 'viewing_room' && (
        <InfoBox>
          <FiInfo />
          <InfoText>
            <strong>Pro tip:</strong> Select videos with clear audio and educational content. 
            Videos with captions or transcripts work best as the AI can better understand 
            and discuss the content with students.
          </InfoText>
        </InfoBox>
      )}
    </StepCard>
  );
}