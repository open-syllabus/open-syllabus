// src/components/teacher/EnhancedRagScraper.tsx
'use client';

import { useState } from 'react';
import styled, { css } from 'styled-components';
import { Input, FormGroup, Label } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Document as KnowledgeDocument } from '@/types/knowledge-base.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
// Styled components for the web scraper
const ScraperContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
    ${({ theme }) => theme.colors.ui.pastelOrange}20 100%);
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -30%;
    right: -30%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelPink, 0.15)} 0%, 
      transparent 70%);
    opacity: 0.5;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
  z-index: 1;
  
  &::before {
    content: '🌐';
    font-size: 1.5rem;
  }
`;

const FileTypeInfo = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: 20px;
  margin-top: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Progress = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, 
    ${({ theme }) => theme.colors.ui.pastelPurple} 0%, 
    ${({ theme }) => theme.colors.ui.pastelPink} 50%, 
    ${({ theme }) => theme.colors.ui.pastelBlue} 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.3) 50%, 
      transparent 100%);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100px); }
    100% { transform: translateX(100px); }
  }
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.brand.primary};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
`;

const ModernAlert = styled.div<{ $variant?: 'success' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  backdrop-filter: blur(10px);
  font-family: ${({ theme }) => theme.fonts.body};
  animation: fadeIn 0.3s ease-in-out;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
  z-index: 1;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${hexToRgba(theme.colors.status.success, 0.1)};
          color: ${theme.colors.status.success};
          border: 1px solid ${hexToRgba(theme.colors.status.success, 0.2)};
          
          &::before {
            content: '✅';
            font-size: 1.2rem;
          }
        `;
      case 'error':
        return `
          background: ${hexToRgba(theme.colors.status.danger, 0.1)};
          color: ${theme.colors.status.danger};
          border: 1px solid ${hexToRgba(theme.colors.status.danger, 0.2)};
          
          &::before {
            content: '❌';
            font-size: 1.2rem;
          }
        `;
      default:
        return `
          background: ${hexToRgba(theme.colors.brand.primary, 0.1)};
          color: ${theme.colors.brand.primary};
          border: 1px solid ${hexToRgba(theme.colors.brand.primary, 0.2)};
          
          &::before {
            content: 'ℹ️';
            font-size: 1.2rem;
          }
        `;
    }
  }}
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StyledLabel = styled(Label)`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  position: relative;
  z-index: 1;
`;

const StyledInput = styled(Input)`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.body};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: 1rem;
  position: relative;
  z-index: 1;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
    background: ${({ theme }) => theme.colors.ui.background};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

interface EnhancedRagScraperProps {
  chatbotId: string;
  onScrapeSuccess?: (document?: KnowledgeDocument) => void;
}

export default function EnhancedRagScraper({ chatbotId, onScrapeSuccess }: EnhancedRagScraperProps) {
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Store document ID for internal processing only (not displayed to user)
  const [status, setStatus] = useState<string>('');

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_urlError) {
      return false;
    }
  };

  const handleScrape = async () => {
    if (!url.trim() || !chatbotId) {
      setError(`Missing required data: ${!url.trim() ? 'No URL entered' : 'No Skolr ID provided'}`);
      return;
    }
    
    if (!validateUrl(url)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    console.log(`Scraping URL for chatbot ID: ${chatbotId}`);
    
    setScraping(true);
    setError(null);
    setSuccessMessage(null);
    setProgress(0);
    setStatus('Scraping webpage content...');
    
    try {
      // Create form data with URL information
      const formData = new FormData();
      formData.append('url', url.trim());
      formData.append('chatbotId', chatbotId);
      
      // First, scrape the webpage using FormData
      const scrapeResponse = await fetch('/api/teacher/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!scrapeResponse.ok) {
        const data = await scrapeResponse.json().catch(() => ({}));
        console.error('Scraping error response:', data);
        throw new Error(data.error || `Failed to scrape webpage (Status: ${scrapeResponse.status})`);
      }
      
      const scrapeData = await scrapeResponse.json();
      console.log('Scraping response data:', scrapeData);
      
      // Get document ID from the response - could be in different formats
      const scrapedDocumentId = 
        scrapeData.documentId || 
        (scrapeData.document && scrapeData.document.document_id);
      
      if (!scrapedDocumentId) {
        console.error('Unexpected response format:', scrapeData);
        throw new Error('No document ID returned from scraping');
      }
      
      // Store document ID for processing
      const documentIdForVectorizing = scrapedDocumentId;
      setProgress(100);
      setStatus('Webpage content added successfully!');
      setSuccessMessage('Webpage content is being extracted and processed automatically. It will be available in your knowledge base shortly.');
      
      // Clear the URL input
      setUrl('');
      
      // Notify parent with the document data
      if (onScrapeSuccess) {
        onScrapeSuccess(scrapeData.document);
      }
    } catch (err) {
      console.error('Error scraping webpage:', err);
      setError(err instanceof Error ? err.message : 'Failed to scrape webpage');
      setStatus('Error occurred');
    } finally {
      setScraping(false);
      setProcessing(false);
    }
  };

  return (
    <ScraperContainer>
      <SectionTitle>Web Scraper for Knowledge Base</SectionTitle>
      
      {error && <ModernAlert $variant="error">{error}</ModernAlert>}
      {successMessage && <ModernAlert $variant="success">{successMessage}</ModernAlert>}
      
      <StyledFormGroup>
        <StyledLabel htmlFor="webpage-url">Webpage URL</StyledLabel>
        <StyledInput
          id="webpage-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          type="url"
          disabled={scraping || processing}
        />
        <FileTypeInfo>
          Enter a URL to scrape content from a webpage directly into your knowledge base.
        </FileTypeInfo>
      </StyledFormGroup>
      
      <ModernButton 
        variant="primary" 
        disabled={!url.trim() || !url.startsWith('http') || scraping || processing}
        fullWidth
        onClick={handleScrape}
      >
        {scraping || processing ? 'Processing...' : 'Extract & Process Content'}
      </ModernButton>
      
      {(scraping || processing) && (
        <>
          <ProgressBar>
            <Progress $progress={progress} />
          </ProgressBar>
          <StatusText>{status}</StatusText>
        </>
      )}
    </ScraperContainer>
  );
}