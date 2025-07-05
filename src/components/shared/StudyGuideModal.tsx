// Study guide preview modal component
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiCopy, FiCheck, FiHeadphones, FiLoader } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ModernButton } from './ModernButton';
import { AudioPlayer } from './AudioPlayer';

interface StudyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  notebookTitle: string;
  studyGuideId?: string;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border}20;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const StudyGuideContent = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.8;
  font-size: 1rem;
  
  /* Markdown styling optimized for study guides */
  h1 {
    margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.lg} 0;
    font-size: 2rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.brand.primary};
    border-bottom: 3px solid ${({ theme }) => theme.colors.ui.pastelBlue};
    padding-bottom: ${({ theme }) => theme.spacing.md};
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h2 {
    margin: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.md} 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    display: flex;
    align-items: center;
    
    &:before {
      content: '→';
      margin-right: ${({ theme }) => theme.spacing.sm};
      color: ${({ theme }) => theme.colors.ui.pastelGreen};
    }
  }
  
  h3 {
    margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.sm} 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  
  /* Key takeaways box */
  blockquote {
    margin: ${({ theme }) => theme.spacing.lg} 0;
    padding: ${({ theme }) => theme.spacing.lg};
    background: ${({ theme }) => theme.colors.ui.pastelYellow}20;
    border-left: 4px solid ${({ theme }) => theme.colors.ui.pastelYellow};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    
    p {
      margin: 0;
      
      &:not(:last-child) {
        margin-bottom: ${({ theme }) => theme.spacing.sm};
      }
    }
  }
  
  ul, ol {
    margin: ${({ theme }) => theme.spacing.md} 0;
    padding-left: ${({ theme }) => theme.spacing.xl};
    
    li {
      margin-bottom: ${({ theme }) => theme.spacing.xs};
      
      &::marker {
        color: ${({ theme }) => theme.colors.brand.primary};
      }
    }
  }
  
  /* Summary sections */
  .summary-box {
    background: ${({ theme }) => theme.colors.ui.pastelBlue}10;
    border: 2px solid ${({ theme }) => theme.colors.ui.pastelBlue}40;
    border-radius: ${({ theme }) => theme.borderRadius.large};
    padding: ${({ theme }) => theme.spacing.lg};
    margin: ${({ theme }) => theme.spacing.lg} 0;
  }
  
  /* Highlighted important text */
  strong {
    color: ${({ theme }) => theme.colors.brand.primary};
    font-weight: 600;
  }
  
  /* Code blocks for formulas/definitions */
  code {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
    padding: 0.125rem 0.375rem;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.875em;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  pre {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
    padding: ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    overflow-x: auto;
    margin: ${({ theme }) => theme.spacing.lg} 0;
    border: 1px solid ${({ theme }) => theme.colors.ui.border}20;
    
    code {
      background: none;
      padding: 0;
      font-size: 0.9rem;
    }
  }
  
  /* Tables for organized content */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: ${({ theme }) => theme.spacing.lg} 0;
    
    th, td {
      padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
      border: 1px solid ${({ theme }) => theme.colors.ui.border}40;
      text-align: left;
    }
    
    th {
      background: ${({ theme }) => theme.colors.ui.pastelBlue}20;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background: ${({ theme }) => theme.colors.ui.pastelGray}20;
    }
  }
  
  hr {
    border: none;
    border-top: 2px solid ${({ theme }) => theme.colors.ui.border}20;
    margin: ${({ theme }) => theme.spacing.xl} 0;
  }
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border}20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.ui.pastelGray}20;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FooterActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    width: 100%;
  }
`;

const PodcastSection = styled.div`
  flex: 1;
  max-width: 600px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    max-width: none;
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const PodcastControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const VoiceSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  background: white;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.brand.primary}20;
  }
`;

const SpeedSelect = styled(VoiceSelect)``;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.pastelBlue}10;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export function StudyGuideModal({ 
  isOpen, 
  onClose, 
  content, 
  notebookTitle,
  studyGuideId
}: StudyGuideModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [existingPodcasts, setExistingPodcasts] = useState<any[]>([]);
  const [isLoadingPodcasts, setIsLoadingPodcasts] = useState(false);

  const voices = [
    { value: 'alloy', label: 'Alloy (Neutral)' },
    { value: 'echo', label: 'Echo (Male)' },
    { value: 'fable', label: 'Fable (British)' },
    { value: 'onyx', label: 'Onyx (Deep Male)' },
    { value: 'nova', label: 'Nova (Female)' },
    { value: 'shimmer', label: 'Shimmer (Soft Female)' }
  ];

  const speeds = [
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' }
  ];

  // Fetch existing podcasts for this study guide
  const fetchExistingPodcasts = async () => {
    if (!studyGuideId) return;

    setIsLoadingPodcasts(true);
    try {
      const response = await fetch(`/api/student/study-guides/${studyGuideId}/podcasts`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched podcasts:', data);
        setExistingPodcasts(data.podcasts || []);
      }
    } catch (error) {
      console.error('Error fetching existing podcasts:', error);
    } finally {
      setIsLoadingPodcasts(false);
    }
  };

  // Fetch existing podcasts when modal opens
  React.useEffect(() => {
    if (isOpen && studyGuideId) {
      fetchExistingPodcasts();
    }
  }, [isOpen, studyGuideId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleExport = (format: 'markdown' | 'pdf') => {
    if (format === 'markdown') {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = notebookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${filename}_study_guide.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // PDF export would require additional implementation
      window.print();
    }
  };

  const handleGeneratePodcast = async () => {
    if (!studyGuideId) return;

    setIsGeneratingPodcast(true);
    try {
      const response = await fetch(`/api/student/study-guides/${studyGuideId}/podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: selectedVoice,
          speed: selectedSpeed
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Podcast generated successfully:', data);
        setPodcastUrl(data.audioUrl);
        setShowAudioPlayer(true);
        
        // Refresh the list of existing podcasts
        await fetchExistingPodcasts();
      } else {
        const errorData = await response.json();
        console.error('Failed to generate podcast:', errorData);
      }
    } catch (error) {
      console.error('Error generating podcast:', error);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const handleDownloadPodcast = () => {
    if (!podcastUrl) return;

    const a = document.createElement('a');
    a.href = podcastUrl;
    const filename = notebookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${filename}_podcast.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clean up blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (podcastUrl) {
        URL.revokeObjectURL(podcastUrl);
      }
    };
  }, [podcastUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContainer
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>Study Guide Preview</Title>
              <Actions>
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={handleCopy}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? 'Copied!' : 'Copy'}
                </ModernButton>
                <CloseButton onClick={onClose}>
                  <FiX />
                </CloseButton>
              </Actions>
            </Header>
            
            <ContentWrapper>
              <StudyGuideContent>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                >
                  {content}
                </ReactMarkdown>
              </StudyGuideContent>
            </ContentWrapper>
            
            <Footer>
              {studyGuideId && (
                <PodcastSection>
                  {/* Existing Podcasts */}
                  {existingPodcasts.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                        Your Podcasts ({existingPodcasts.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {existingPodcasts.map((podcast, index) => (
                          <div 
                            key={podcast.podcast_id}
                            style={{ 
                              padding: '12px', 
                              background: '#F9FAFB', 
                              borderRadius: '8px',
                              border: '1px solid #E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                                {voices.find(v => v.value === podcast.voice)?.label || podcast.voice} - {podcast.speed}x speed
                              </div>
                              {podcast.duration_seconds && (
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                  Duration: {Math.floor(podcast.duration_seconds / 60)}:{(podcast.duration_seconds % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <ModernButton
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                  // Play existing podcast
                                  if (podcast.audio_url) {
                                    setPodcastUrl(podcast.audio_url);
                                    setShowAudioPlayer(true);
                                  }
                                }}
                              >
                                <FiHeadphones />
                                Play
                              </ModernButton>
                              {podcast.audio_url && (
                                <ModernButton
                                  variant="ghost"
                                  size="small"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = podcast.audio_url;
                                    const filename = notebookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                    a.download = `${filename}_${podcast.voice}_${podcast.speed}x_podcast.mp3`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                >
                                  <FiDownload />
                                  Download
                                </ModernButton>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Audio Player */}
                  {showAudioPlayer && podcastUrl && (
                    <div style={{ marginBottom: '16px' }}>
                      <AudioPlayer
                        audioUrl={podcastUrl}
                        title={`${notebookTitle} - Revision Podcast`}
                        allowDownload={true}
                        onPlaybackComplete={() => console.log('Podcast playback completed')}
                      />
                    </div>
                  )}
                  
                  {/* Generate New Podcast */}
                  {!showAudioPlayer ? (
                    <PodcastControls>
                      <VoiceSelect 
                        value={selectedVoice} 
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        disabled={isGeneratingPodcast}
                      >
                        {voices.map(voice => (
                          <option key={voice.value} value={voice.value}>
                            {voice.label}
                          </option>
                        ))}
                      </VoiceSelect>
                      <SpeedSelect 
                        value={selectedSpeed} 
                        onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
                        disabled={isGeneratingPodcast}
                      >
                        {speeds.map(speed => (
                          <option key={speed.value} value={speed.value}>
                            {speed.label}
                          </option>
                        ))}
                      </SpeedSelect>
                      <ModernButton
                        variant="primary"
                        size="small"
                        onClick={handleGeneratePodcast}
                        disabled={isGeneratingPodcast}
                      >
                        {isGeneratingPodcast ? <FiLoader /> : <FiHeadphones />}
                        {isGeneratingPodcast ? 'Generating...' : 'Generate Podcast'}
                      </ModernButton>
                    </PodcastControls>
                  ) : (
                    <ModernButton
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setShowAudioPlayer(false);
                        setPodcastUrl(null);
                      }}
                    >
                      Generate New Podcast
                    </ModernButton>
                  )}
                </PodcastSection>
              )}
              <FooterActions>
                <ModernButton
                  variant="secondary"
                  size="small"
                  onClick={() => handleExport('markdown')}
                >
                  <FiDownload />
                  Export as Markdown
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="small"
                  onClick={() => handleExport('pdf')}
                >
                  <FiDownload />
                  Export as PDF
                </ModernButton>
              </FooterActions>
            </Footer>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
}