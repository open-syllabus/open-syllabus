// src/components/teacher/VideoTranscriptInput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { parseVideoUrl, validateVideoUrl } from '@/lib/utils/video-utils';
import { ModernButton } from '@/components/shared/ModernButton';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InputGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-start;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
    background: ${({ theme }) => theme.colors.ui.background};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VideoPreview = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelBlue}20 0%, 
    ${({ theme }) => theme.colors.ui.pastelPurple}20 100%);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PreviewTitle = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const VideoInfo = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
`;

const VideoDetails = styled.div`
  flex: 1;
`;

const VideoUrl = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-all;
  font-family: ${({ theme }) => theme.fonts.body};
`;

const Platform = styled.span`
  display: inline-block;
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: 2px 12px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.1)};
  color: ${({ theme }) => theme.colors.status.danger};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.body};
  animation: shake 0.3s ease-out;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const SuccessMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => hexToRgba(theme.colors.status.success, 0.1)};
  color: ${({ theme }) => theme.colors.status.success};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  font-family: ${({ theme }) => theme.fonts.body};
  animation: fadeIn 0.3s ease-out;
`;

interface VideoTranscriptInputProps {
  chatbotId: string;
  onSuccess?: (newDocument?: any) => void;
}

export default function VideoTranscriptInput({ chatbotId, onSuccess }: VideoTranscriptInputProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validatedVideo, setValidatedVideo] = useState<ReturnType<typeof parseVideoUrl> | null>(null);

  useEffect(() => {
    if (videoUrl) {
      const validation = validateVideoUrl(videoUrl);
      if (validation.valid) {
        setValidatedVideo(parseVideoUrl(videoUrl));
        setError(null);
      } else {
        setValidatedVideo(null);
        if (videoUrl.length > 10) { // Only show error for non-empty inputs
          setError(validation.error || 'Invalid video URL');
        }
      }
    } else {
      setValidatedVideo(null);
      setError(null);
    }
  }, [videoUrl]);

  const handleExtractTranscript = async () => {
    if (!validatedVideo) {
      setError('Please enter a valid YouTube, Vimeo, or Loom URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First, scrape the video URL using the documents endpoint
      const scrapeResponse = await fetch('/api/teacher/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: videoUrl,
          chatbotId: chatbotId
        }),
      });

      if (!scrapeResponse.ok) {
        const data = await scrapeResponse.json().catch(() => ({}));
        throw new Error(data.error || `Failed to extract video transcript (Status: ${scrapeResponse.status})`);
      }

      const scrapeData = await scrapeResponse.json();
      
      // Get document ID from the response
      const documentId = scrapeData.documentId || scrapeData.document?.document_id;
      
      if (!documentId) {
        throw new Error('No document ID returned from video extraction');
      }

      setSuccess(true);
      setVideoUrl(''); // Clear the input
      setValidatedVideo(null);
      
      if (onSuccess) {
        onSuccess(scrapeData.document);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract video transcript');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <InputGroup>
        <Input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          disabled={loading}
        />
        <ModernButton
          onClick={handleExtractTranscript}
          disabled={!validatedVideo || loading}
          variant="primary"
          size="medium"
        >
          {loading ? 'Extracting...' : 'Extract Transcript'}
        </ModernButton>
      </InputGroup>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Video transcript is being extracted and processed automatically! It will be available in your knowledge base shortly.</SuccessMessage>}

      {validatedVideo && validatedVideo.videoId && (
        <VideoPreview>
          <PreviewTitle>Video Details</PreviewTitle>
          <VideoInfo>
            <VideoDetails>
              <VideoUrl>{validatedVideo.originalUrl}</VideoUrl>
              <Platform>{validatedVideo.platform}</Platform>
            </VideoDetails>
          </VideoInfo>
        </VideoPreview>
      )}
    </Container>
  );
}