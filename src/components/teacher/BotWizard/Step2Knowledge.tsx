// src/components/teacher/BotWizard/Step2Knowledge.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiFile, FiX, FiCheck, FiInfo, FiSettings, FiGlobe, FiFileText } from 'react-icons/fi';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const StepCard = styled(motion.div)`
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelBlue} 0%, 
    ${({ theme }) => theme.colors.ui.pastelGreen} 100%);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -20%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, 
      ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)} 0%, 
      transparent 70%);
    opacity: 0.6;
  }
  
  @media (max-width: 768px) {
    padding: 32px;
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const StepIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 24px;
`;

const StepTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
`;

const StepDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const KnowledgeSection = styled.div`
  margin-bottom: 40px;
`;

const DropzoneArea = styled.div<{ $isDragActive?: boolean }>`
  display: block;
  border: 3px dashed ${({ $isDragActive, theme }) => 
    $isDragActive ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  background: ${({ $isDragActive, theme }) => 
    $isDragActive ? hexToRgba(theme.colors.brand.primary, 0.05) : theme.colors.ui.background};
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const UploadIcon = styled(FiUploadCloud)`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.brand.primary};
  margin-bottom: 16px;
`;

const UploadText = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const UploadSubtext = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
`;

const FileList = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FileItem = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const FileIcon = styled(FiFile)`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.brand.primary};
`;

const FileName = styled.p`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FileSize = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-left: 12px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.status.danger};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.1)};
  }
`;

const BehaviourSection = styled.div`
  margin-bottom: 40px;
`;

const PersonalityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const PersonalityCard = styled(motion.div)<{ $selected: boolean }>`
  padding: 24px;
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.brand.primary : theme.colors.ui.background};
  border: 2px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background: ${({ $selected, theme }) => 
      $selected ? theme.colors.brand.primary : theme.colors.ui.backgroundLight};
  }
`;

const PersonalityTitle = styled.h4<{ $selected: boolean }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ $selected, theme }) => 
    $selected ? 'white' : theme.colors.text.primary};
  margin-bottom: 8px;
`;

const PersonalityDesc = styled.p<{ $selected: boolean }>`
  font-size: 0.875rem;
  color: ${({ $selected, theme }) => 
    $selected ? theme.colors.text.primaryInverse : theme.colors.text.secondary};
  line-height: 1.4;
`;

const CustomPromptSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
  z-index: 1;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 150px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  
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

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelYellow};
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  display: flex;
  gap: 16px;
  
  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.brand.secondary};
  }
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.6;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.ui.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${({ $active, theme }) => $active ? theme.colors.brand.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.brand.primary : theme.colors.text.secondary};
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const UrlInput = styled.input`
  width: 100%;
  padding: 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const UrlSection = styled.div`
  margin-bottom: 24px;
`;

const AddButton = styled(motion.button)`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const UrlList = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UrlItem = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UrlText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.brand.primary};
  word-break: break-all;
`;

const AssessmentSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const Select = styled.select`
  width: 100%;
  padding: 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const TemplateButton = styled(motion.button)`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  color: ${({ theme }) => theme.colors.brand.primary};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 12px;
  margin-bottom: 12px;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

interface KnowledgeData {
  files: File[];
  urls?: string[];
  personality: string;
  customPrompt: string;
  // Assessment-specific fields
  assessmentType?: 'multiple_choice' | 'open_ended';
  questionCount?: number;
  assessmentCriteria?: string;
}

interface Step2KnowledgeProps {
  data: KnowledgeData;
  onUpdate: (data: KnowledgeData) => void;
  botType: string;
}

const personalities = [
  {
    id: 'friendly',
    title: 'Friendly Guide',
    description: 'Warm, encouraging, and patient. Great for younger students or those who need extra support.'
  },
  {
    id: 'professional',
    title: 'Professional Tutor',
    description: 'Clear, concise, and focused. Ideal for advanced students or exam preparation.'
  },
  {
    id: 'socratic',
    title: 'Socratic Teacher',
    description: 'Asks guiding questions to help students discover answers themselves.'
  },
  {
    id: 'enthusiastic',
    title: 'Enthusiastic Coach',
    description: 'Energetic and motivating. Perfect for keeping students engaged and excited.'
  }
];

export default function Step2Knowledge({ data, onUpdate, botType }: Step2KnowledgeProps) {
  const [localData, setLocalData] = useState(data);
  const [activeTab, setActiveTab] = useState<'files' | 'urls'>('files');
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      // Handle rejected files
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB per file.');
      } else {
        alert('Invalid file type. Please upload PDF, Word, or text files.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const newData = {
        ...localData,
        files: [...localData.files, ...acceptedFiles]
      };
      setLocalData(newData);
      onUpdate(newData);
    }
  }, [localData, onUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (index: number) => {
    const newData = {
      ...localData,
      files: localData.files.filter((_, i) => i !== index)
    };
    setLocalData(newData);
    onUpdate(newData);
  };

  const selectPersonality = (personality: string) => {
    const newData = { ...localData, personality };
    setLocalData(newData);
    onUpdate(newData);
  };

  const updateCustomPrompt = (customPrompt: string) => {
    const newData = { ...localData, customPrompt };
    setLocalData(newData);
    onUpdate(newData);
  };

  const updateAssessmentType = (assessmentType: 'multiple_choice' | 'open_ended') => {
    const newData = { ...localData, assessmentType };
    setLocalData(newData);
    onUpdate(newData);
  };

  const updateQuestionCount = (questionCount: number) => {
    const newData = { ...localData, questionCount };
    setLocalData(newData);
    onUpdate(newData);
  };

  const updateAssessmentCriteria = (assessmentCriteria: string) => {
    const newData = { ...localData, assessmentCriteria };
    setLocalData(newData);
    onUpdate(newData);
  };

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsScrapingUrl(true);
    try {
      // For now, just add the URL to the list
      // In a real implementation, you would scrape the URL here
      const newUrls = [...(localData.urls || []), urlInput.trim()];
      const newData = { ...localData, urls: newUrls };
      setLocalData(newData);
      onUpdate(newData);
      setUrlInput('');
    } catch (error) {
      console.error('Error adding URL:', error);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const removeUrl = (index: number) => {
    const newUrls = (localData.urls || []).filter((_, i) => i !== index);
    const newData = { ...localData, urls: newUrls };
    setLocalData(newData);
    onUpdate(newData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <StepCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StepHeader>
        <StepIcon>{botType === 'assessment' ? '📝' : '🧠'}</StepIcon>
        <StepTitle>{botType === 'assessment' ? 'Configure Assessment' : 'Add Knowledge & Personality'}</StepTitle>
        <StepDescription>
          {botType === 'assessment' 
            ? 'Set up your assessment criteria and choose how your Skolr evaluates students'
            : 'Upload learning materials and choose how your Skolr should interact with students'
          }
        </StepDescription>
      </StepHeader>

      {/* Knowledge Base Section - Available for all bot types including assessment */}
      <KnowledgeSection>
        <SectionTitle>
          <FiFile />
          Knowledge Base
        </SectionTitle>
      
      <TabContainer>
        <Tab 
          $active={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
        >
          <FiFileText />
          Upload Documents
        </Tab>
        <Tab 
          $active={activeTab === 'urls'}
          onClick={() => setActiveTab('urls')}
        >
          <FiGlobe />
          Add Web Pages & Videos
        </Tab>
      </TabContainer>

      {activeTab === 'files' ? (
        <>
          <DropzoneArea {...getRootProps()} $isDragActive={isDragActive}>
            <input {...getInputProps()} />
            <UploadIcon />
            <UploadText>
              {isDragActive ? 'Drop your files here' : 'Click or drag files to upload'}
            </UploadText>
            <UploadSubtext>
              Supports PDF, Word documents, and text files (Max 10MB each)
            </UploadSubtext>
          </DropzoneArea>

          {localData.files.length > 0 && (
            <FileList>
              <AnimatePresence>
                {localData.files.map((file, index) => (
                  <FileItem
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileInfo>
                      <FileIcon />
                      <div>
                        <FileName>
                          {file.name}
                          <FileSize>{formatFileSize(file.size)}</FileSize>
                        </FileName>
                      </div>
                    </FileInfo>
                    <RemoveButton onClick={() => removeFile(index)}>
                      <FiX />
                    </RemoveButton>
                  </FileItem>
                ))}
              </AnimatePresence>
            </FileList>
          )}
        </>
      ) : (
        <>
          <UrlSection>
            <Label htmlFor="urlInput">
              Enter Web Page or YouTube URL
            </Label>
            <UrlInput
              id="urlInput"
              type="url"
              placeholder="https://example.com/article or https://youtube.com/watch?v=..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isScrapingUrl}
            />
            <AddButton
              onClick={addUrl}
              disabled={!urlInput.trim() || isScrapingUrl}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isScrapingUrl ? (
                'Processing...'
              ) : (
                'Add to Knowledge Base'
              )}
            </AddButton>
          </UrlSection>

          {localData.urls && localData.urls.length > 0 && (
            <UrlList>
              <AnimatePresence>
                {localData.urls.map((url, index) => (
                  <UrlItem
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiGlobe style={{ color: '#7C3AED' }} />
                      <UrlText>{url}</UrlText>
                    </div>
                    <RemoveButton onClick={() => removeUrl(index)}>
                      <FiX />
                    </RemoveButton>
                  </UrlItem>
                ))}
              </AnimatePresence>
            </UrlList>
          )}
        </>
      )}
      
      <InfoBox>
        <FiInfo />
        <InfoText>
          {activeTab === 'files' 
            ? botType === 'assessment'
              ? 'Upload study materials, textbooks, or documents that contain the knowledge you want to assess students on. Your assessment questions will be based on this content.'
              : 'Select course materials, textbooks, notes, or any documents you want your Skolr to reference. These files will be uploaded and processed after your Skolr is created.'
            : botType === 'assessment'
              ? 'Add web pages or YouTube videos containing content you want to assess. The assessment will be based on the information from these sources.'
              : 'Add web pages or YouTube videos that contain relevant information for your Skolr. These will be scraped and processed after your Skolr is created.'
          }
        </InfoText>
      </InfoBox>
      
      {(localData.files.length > 0 || (localData.urls && localData.urls.length > 0)) && (
        <InfoBox style={{ marginTop: '16px', background: 'rgba(124, 58, 237, 0.05)' }}>
          <FiInfo style={{ color: '#7C3AED' }} />
          <InfoText style={{ color: '#7C3AED' }}>
            <strong>Note:</strong> Documents and web pages will be processed immediately after your Skolr is created. This ensures optimal processing and allows you to track the progress.
          </InfoText>
        </InfoBox>
      )}
    </KnowledgeSection>

      {botType === 'assessment' ? (
        <AssessmentSection>
          <FormGroup>
            <Label htmlFor="assessment_type">Assessment Type</Label>
            <Select
              id="assessment_type"
              name="assessment_type"
              value={localData.assessmentType || 'multiple_choice'}
              onChange={(e) => updateAssessmentType(e.target.value as 'multiple_choice' | 'open_ended')}
            >
              <option value="multiple_choice">Multiple Choice Quiz</option>
              <option value="open_ended">Open Ended Questions</option>
            </Select>
            <InfoText style={{ marginTop: '8px' }}>
              Choose the type of questions your Skolr will ask.
            </InfoText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="question_count">Number of Questions</Label>
            <Select
              id="question_count"
              name="question_count"
              value={localData.questionCount || 10}
              onChange={(e) => updateQuestionCount(Number(e.target.value))}
            >
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </Select>
            <InfoText style={{ marginTop: '8px' }}>
              Your Skolr will present exactly this many questions to the student.
            </InfoText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="assessment_criteria">Assessment Rubric / Criteria</Label>
            <TextArea
              id="assessment_criteria"
              name="assessment_criteria"
              value={localData.assessmentCriteria || ''}
              onChange={(e) => updateAssessmentCriteria(e.target.value)}
              rows={8}
              placeholder="Clearly describe what the AI should assess. For example:
1. Accuracy of answers to key concepts.
2. Clarity of student's explanations.
3. Use of specific examples or evidence.
4. Critical thinking demonstrated."
              required
            />
            <InfoText style={{ marginTop: '8px' }}>
              This text will guide the AI in evaluating student responses. Be specific.
            </InfoText>
          </FormGroup>

          <div style={{ marginBottom: '16px' }}>
            <Label as="p" style={{ marginBottom: '8px' }}>Example Templates:</Label>
            <div>
              <TemplateButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateAssessmentCriteria(`Evaluate the student's understanding of key scientific concepts based on the following criteria:

1. Understanding of the scientific method (20%)
   - Can identify all steps in the scientific method
   - Explains how hypothesis testing works
   - Understands experimental controls and variables

2. Content knowledge accuracy (40%)
   - Facts are correct and relevant
   - Can explain relationships between concepts
   - Uses proper scientific terminology

3. Critical analysis (20%)
   - Identifies strengths/weaknesses in arguments
   - Considers multiple perspectives
   - Draws reasonable conclusions from evidence

4. Communication clarity (20%)
   - Ideas expressed logically and coherently
   - Uses specific examples to support points
   - Grammar and spelling are correct`);
                }}
              >
                Science Assessment
              </TemplateButton>

              <TemplateButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateAssessmentCriteria(`Assess the student's essay using the following criteria:

1. Thesis & Structure (25%)
   - Clear thesis statement that establishes the argument
   - Logical organization with introduction, body paragraphs, and conclusion
   - Smooth transitions between ideas

2. Evidence & Analysis (30%)
   - Relevant and specific evidence to support claims
   - In-depth analysis that connects evidence to thesis
   - Thoughtful engagement with multiple perspectives

3. Critical Thinking (25%)
   - Original insights beyond surface-level observations
   - Considers implications and significance of the argument
   - Addresses potential counterarguments

4. Writing Mechanics (20%)
   - Proper grammar, spelling, and punctuation
   - Varied sentence structure and academic vocabulary
   - Consistent citation format (if applicable)`);
                }}
              >
                Essay Rubric
              </TemplateButton>

              <TemplateButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateAssessmentCriteria(`Evaluate the student's math problem-solving abilities using these criteria:

1. Procedural Fluency (30%)
   - Correctly applies mathematical operations
   - Follows proper order of operations
   - Shows computational accuracy

2. Conceptual Understanding (30%)
   - Demonstrates understanding of underlying concepts
   - Can explain why procedures work
   - Makes connections between related ideas

3. Problem-Solving Strategy (25%)
   - Selects appropriate approach to solve problems
   - Implements strategy efficiently
   - Can apply concepts to novel situations

4. Mathematical Communication (15%)
   - Uses correct mathematical notation
   - Shows work in a clear, organized manner
   - Explains reasoning behind steps`);
                }}
              >
                Math Problems
              </TemplateButton>
            </div>
          </div>

          <InfoBox>
            <FiInfo />
            <InfoText>
              For more complex rubrics, you will be able to upload a document (e.g., PDF, DOCX) with detailed criteria after creating your Skolr.
            </InfoText>
          </InfoBox>
        </AssessmentSection>
      ) : null}

      <BehaviourSection>
        <SectionTitle>
          <FiSettings />
          {botType === 'assessment' ? 'Skolr Behaviour' : 'Skolr Personality'}
        </SectionTitle>
        
        {botType !== 'assessment' && (
          <PersonalityGrid>
            {personalities.map((personality) => (
              <PersonalityCard
                key={personality.id}
                $selected={localData.personality === personality.id}
                onClick={() => selectPersonality(personality.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PersonalityTitle $selected={localData.personality === personality.id}>
                  {personality.title}
                </PersonalityTitle>
                <PersonalityDesc $selected={localData.personality === personality.id}>
                  {personality.description}
                </PersonalityDesc>
              </PersonalityCard>
            ))}
          </PersonalityGrid>
        )}

        <CustomPromptSection>
          <Label htmlFor="customPrompt">
            {botType === 'assessment' 
              ? 'System Prompt (Skolr Behaviour)' 
              : 'Additional Instructions (Optional)'
            }
          </Label>
          <TextArea
            id="customPrompt"
            placeholder={
              botType === 'assessment'
                ? "e.g., You are an assessment assistant. Engage the student based on the provided topic. Do not provide answers directly but guide them if they struggle. After the interaction, your analysis will be based on teacher criteria."
                : "Add any specific instructions for your Skolr. For example: 'Always encourage students to show their work' or 'Use examples from everyday life to explain concepts'"
            }
            value={localData.customPrompt}
            onChange={(e) => updateCustomPrompt(e.target.value)}
            rows={botType === 'assessment' ? 3 : 5}
          />
          {botType === 'assessment' && (
            <InfoText style={{ marginTop: '8px' }}>
              This defines the AI's general behaviour. Assessment-specific instructions are primarily driven by the Assessment Criteria you defined above.
            </InfoText>
          )}
        </CustomPromptSection>
      </BehaviourSection>
    </StepCard>
  );
}