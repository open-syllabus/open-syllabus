// Simple PDF viewer for Reading Room documents
'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Alert } from '@/styles/StyledComponents';
import LoadingSpinner from './LoadingSpinner';

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 100%;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0;
  }
`;

const PDFWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: #525659;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  
  /* Prevent horizontal scrolling on mobile */
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    overflow-x: hidden;
  }
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  
  /* A4 aspect ratio is approximately 1:1.414 (210mm x 297mm) */
  /* Set minimum height to ensure full page is visible */
  min-height: calc(100vh - 200px); /* Account for header and other UI elements */
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 600px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 400px;
    /* Ensure PDF fits within viewport width */
    max-width: 100%;
    width: 100%;
  }
`;

// Mobile-specific wrapper to handle PDF scaling
const MobileWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    /* Allow vertical scrolling but prevent horizontal */
    overflow-x: hidden;
    overflow-y: auto;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.muted};
  
  h3 {
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 0.5rem;
  }
  
  p {
    margin: 0;
  }
`;

interface SimplePDFViewerProps {
  documentUrl: string | null;
  loading?: boolean;
  error?: string | null;
}

export default function SimplePDFViewer({ documentUrl, loading = false, error = null }: SimplePDFViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIframeError(false);
  }, [documentUrl]);

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="large" />
        <p>Loading document...</p>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ViewerContainer>
        <Alert variant="error">{error}</Alert>
      </ViewerContainer>
    );
  }

  if (!documentUrl) {
    return (
      <EmptyState>
        <h3>No Reading Document</h3>
        <p>The teacher hasn't uploaded a reading document yet.</p>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          Please check back later or contact your teacher.
        </p>
      </EmptyState>
    );
  }

  if (iframeError) {
    return (
      <ViewerContainer>
        <Alert variant="error">
          Failed to load the PDF document. 
          <br />
          <a href={documentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Click here to open in a new tab
          </a>
        </Alert>
      </ViewerContainer>
    );
  }

  // Clean URL and add PDF embed parameters for proper display
  const cleanUrl = documentUrl.split('#')[0];
  // On mobile, use FitH (Fit Horizontal) to ensure the page fits the viewport width
  // On desktop, use page-width for better readability
  // toolbar=0 hides the toolbar, navpanes=0 hides navigation panes
  const embedUrl = isMobile 
    ? `${cleanUrl}#view=FitH&toolbar=0&navpanes=0`
    : `${cleanUrl}#zoom=page-width&toolbar=0&navpanes=0`;
  
  console.log('[SimplePDFViewer] Loading PDF from:', embedUrl);

  return (
    <ViewerContainer>
      {isMobile ? (
        <MobileWrapper>
          <StyledIframe
            src={embedUrl}
            title="Reading Document"
            loading="lazy"
            onError={() => {
              console.error('[SimplePDFViewer] Failed to load PDF');
              setIframeError(true);
            }}
          />
        </MobileWrapper>
      ) : (
        <PDFWrapper>
          <StyledIframe
            src={embedUrl}
            title="Reading Document"
            loading="lazy"
            onError={() => {
              console.error('[SimplePDFViewer] Failed to load PDF');
              setIframeError(true);
            }}
          />
        </PDFWrapper>
      )}
    </ViewerContainer>
  );
}