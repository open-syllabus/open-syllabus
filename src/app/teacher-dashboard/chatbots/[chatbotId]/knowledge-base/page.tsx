// src/app/teacher-dashboard/chatbots/[chatbotId]/knowledge-base/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Container, Card, Alert } from '@/styles/StyledComponents';
import DocumentUploader from '@/components/teacher/DocumentUploader';
import DocumentListWithBatch from '@/components/teacher/DocumentListWithBatch';
import EmbeddingStatus from '@/components/teacher/EmbeddingStatus';
import EnhancedRagScraper from '@/components/teacher/EnhancedRagScraper';
import VideoTranscriptInput from '@/components/teacher/VideoTranscriptInput';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { Document as KnowledgeDocument } from '@/types/knowledge-base.types';

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

const ContentContainer = styled(Container)`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 32px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6B7280;
  margin: 8px 0 0 0;
`;

const StyledCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const HelpText = styled.p`
  color: #6B7280;
  font-size: 0.875rem;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #E5E7EB;
  margin: 32px 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6B7280;
  font-size: 1rem;
`;

const EmptyDocumentsContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6B7280;
`;

const EmptyDocumentsText = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${({ $active }) => 
    $active ? 'white' : 'transparent'};
  color: ${({ $active }) => 
    $active ? '#7C3AED' : '#6B7280'};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ $active }) => 
    $active ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'};
  
  &:hover:not(:disabled) {
    background: ${({ $active }) => 
      $active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
    color: ${({ $active }) => 
      $active ? '#7C3AED' : '#111827'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabContent = styled.div`
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

type TabType = 'document' | 'webpage' | 'video';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chatbotName, setChatbotName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('document');
  
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const chatbotId = params?.chatbotId as string;

  const fetchChatbotInfo = useCallback(async () => {
    if(!chatbotId) return;
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession) {
          throw new Error('Authentication expired. Please log in again.');
        }
      }
      
      const { data: chatbot, error: chatbotError } = await supabase
        .from('chatbots')
        .select('name, teacher_id')
        .eq('chatbot_id', chatbotId)
        .single();

      if (chatbotError) throw chatbotError;
      if (!chatbot) throw new Error("Chatbot not found.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== chatbot.teacher_id) {
        throw new Error("You are not authorized to manage this chatbot's knowledge base.");
      }
      setChatbotName(chatbot.name);
    } catch (err) {
      console.error('Error fetching chatbot info:', err);
      if (err instanceof Error && err.message.includes('JWT')) {
        setPageError('Your session has expired. Please refresh the page or log in again.');
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      } else {
        setPageError(err instanceof Error ? err.message : 'Failed to fetch Skolr information');
      }
    }
  }, [chatbotId, supabase, router]);

  const fetchDocuments = useCallback(async () => {
    if (!chatbotId) return;
    setDocsLoading(true);
    setDocsError(null);
    try {
      const response = await fetch(`/api/teacher/documents?chatbotId=${chatbotId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch documents');
      }
      const data: KnowledgeDocument[] = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocsError(err instanceof Error ? err.message : 'Could not load documents.');
    } finally {
      setDocsLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);
        await fetchChatbotInfo();
        await fetchDocuments();
        setLoading(false);
    }
    if (chatbotId) {
        loadInitialData();
    } else {
        setPageError("Skolr ID is missing from the URL.");
        setLoading(false);
    }
  }, [chatbotId, fetchChatbotInfo, fetchDocuments]);
  
  // Removed polling - realtime subscriptions in DocumentList handle updates automatically

  const handleProcessDocument = async (documentId: string) => {
    setDocsError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/teacher/documents/${documentId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start document processing');
      }
      const result = await response.json();
      setSuccessMessage(result.message || 'Document processing started.');
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.document_id === documentId ? { ...doc, status: 'processing' } : doc
        )
      );
      setViewingDocumentId(documentId);
    } catch (err) {
      console.error('Error processing document:', err);
      setDocsError(err instanceof Error ? err.message : 'Could not process document.');
    }
  };

  const handleBatchProcessDocuments = async (documentIds: string[]) => {
    setDocsError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/vectorize-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start batch processing');
      }
      const result = await response.json();
      setSuccessMessage(`Started processing ${result.documentsQueued} documents.`);
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          documentIds.includes(doc.document_id) ? { ...doc, status: 'processing' } : doc
        )
      );
    } catch (err) {
      console.error('Error batch processing documents:', err);
      setDocsError(err instanceof Error ? err.message : 'Could not process documents.');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setDocsError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/teacher/documents?documentId=${documentId}`, { 
          method: 'DELETE' 
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete document');
      }
      setSuccessMessage("Document deleted successfully.");
      setDocuments(prevDocs => prevDocs.filter(doc => doc.document_id !== documentId));
      if (viewingDocumentId === documentId) {
        setViewingDocumentId(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setDocsError(err instanceof Error ? err.message : 'Could not delete document.');
    }
  };

  const getViewingDocument = (): KnowledgeDocument | null => {
    if (!viewingDocumentId) return null;
    return documents.find(doc => doc.document_id === viewingDocumentId) || null;
  };

  if (loading) {
    return (
      <PageWrapper>
        <ContentContainer>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <LoadingText>Loading knowledge base...</LoadingText>
          </LoadingContainer>
        </ContentContainer>
      </PageWrapper>
    );
  }

  if (pageError) {
    return (
      <PageWrapper>
        <ContentContainer>
          <StyledCard>
            <Alert variant="error">{pageError}</Alert>
            <ModernButton 
              onClick={() => router.push('/teacher-dashboard/chatbots')} 
              style={{marginTop: '16px'}}
            >
              Back to Skolrs
            </ModernButton>
          </StyledCard>
        </ContentContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ContentContainer>
        <Header>
          <HeaderRow>
            <div>
              <Title>Knowledge Base</Title>
              <Subtitle>{chatbotName || "Skolr"}</Subtitle>
            </div>
            <ModernButton 
              variant="ghost" 
              size="medium"
              onClick={() => router.push(`/teacher-dashboard/chatbots/${chatbotId}/edit`)}
            >
              ← Back to Skolr Settings
            </ModernButton>
          </HeaderRow>
        </Header>
        
        {successMessage && (
          <Alert variant="success" style={{ marginBottom: '24px' }}>
            {successMessage}
          </Alert>
        )}
        
        {docsError && (
          <Alert variant="error" style={{ marginBottom: '24px' }}>
            {docsError}
          </Alert>
        )}
        
        <StyledCard>
          <SectionTitle>Add Content to Knowledge Base</SectionTitle>
          <HelpText>
            Add content by uploading documents, scraping webpages, or extracting video transcripts. 
            This content will be processed and made available for your Skolr to use when knowledge base is enabled.
          </HelpText>
          
          <TabContainer>
            <Tab
              $active={activeTab === 'document'}
              onClick={() => setActiveTab('document')}
            >
              📄 Upload Document
            </Tab>
            <Tab
              $active={activeTab === 'webpage'}
              onClick={() => setActiveTab('webpage')}
            >
              🌐 Add Webpage
            </Tab>
            <Tab
              $active={activeTab === 'video'}
              onClick={() => setActiveTab('video')}
            >
              🎥 Add Video
            </Tab>
          </TabContainer>
          
          <TabContent>
            {activeTab === 'document' && (
              <DocumentUploader 
                chatbotId={chatbotId} 
                onUploadSuccess={(newDocument) => {
                    setSuccessMessage("Document uploaded successfully!");
                    if (newDocument) {
                        setDocuments(prev => [newDocument, ...prev]);
                    }
                    fetchDocuments();
                }}
              />
            )}
            
            {activeTab === 'webpage' && (
              <EnhancedRagScraper
                chatbotId={chatbotId}
                onScrapeSuccess={(newDocument) => {
                    if (newDocument) {
                        setDocuments(prev => [newDocument, ...prev]);
                    }
                    fetchDocuments();
                }}
              />
            )}
            
            {activeTab === 'video' && (
              <VideoTranscriptInput
                chatbotId={chatbotId}
                onSuccess={(newDocument) => {
                    setSuccessMessage("Video transcript extracted successfully!");
                    if (newDocument) {
                        setDocuments(prev => [newDocument, ...prev]);
                    }
                    fetchDocuments();
                }}
              />
            )}
          </TabContent>
        </StyledCard>
        
        <StyledCard>
          <SectionTitle>Uploaded Documents</SectionTitle>
          
          {getViewingDocument() && (
            <div style={{ marginBottom: '24px' }}>
              <EmbeddingStatus 
                document={getViewingDocument()!} 
                chatbotId={chatbotId}
                onRefresh={() => {
                    setSuccessMessage("Document status refreshed.");
                    fetchDocuments();
                }}
              />
            </div>
          )}
          
          {docsLoading && documents.length === 0 ? (
            <EmptyDocumentsContainer>
              <LoadingSpinner size="small" />
              <EmptyDocumentsText style={{ marginTop: '16px' }}>
                Loading documents...
              </EmptyDocumentsText>
            </EmptyDocumentsContainer>
          ) : documents.length === 0 ? (
            <EmptyDocumentsContainer>
              <EmptyDocumentsText>
                No documents uploaded yet. Add content above to get started.
              </EmptyDocumentsText>
            </EmptyDocumentsContainer>
          ) : (
            <DocumentListWithBatch 
              documents={documents}
              onProcessDocument={handleProcessDocument}
              onDeleteDocument={handleDeleteDocument}
              onViewStatus={setViewingDocumentId}
              onBatchProcess={handleBatchProcessDocuments}
            />
          )}
        </StyledCard>
      </ContentContainer>
    </PageWrapper>
  );
}