// src/components/teacher/BotWizard/Step1BotSetup.tsx
'use client';

import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { FiInfo, FiStar, FiBook, FiClipboard, FiEye } from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const StepCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  max-width: 800px;
  margin: 0 auto;
  
  &::before {
    content: '';
    position: absolute;
    top: -20%;
    right: -20%;
    width: 40%;
    height: 40%;
    background: radial-gradient(circle, rgba(255, 255, 0, 0.3) 0%, transparent 70%);
    opacity: 0.5;
  }
  
  @media (max-width: 768px) {
    padding: 32px;
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
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

const FormSection = styled.div`
  margin-bottom: 32px;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
  
  span {
    color: ${({ theme }) => theme.colors.status.danger};
  }
`;

const HelperText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-top: 4px;
`;

const BotTypeSection = styled.div`
  margin-bottom: 32px;
`;

const BotTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const SelectedTypeCard = styled.div<{ $color: string }>`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 16px;
  padding: 24px;
  border: 2px solid ${({ $color }) => $color};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $color }) => $color};
  }
`;

const SelectedTypeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const SelectedTypeIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const SelectedTypeName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const SelectedTypeDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin: 0;
`;

const BotTypeCard = styled(motion.div)<{ $selected: boolean }>`
  padding: 24px;
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.brand.primary : theme.colors.ui.background};
  border: 2px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const BotTypeIcon = styled.div<{ $selected: boolean }>`
  font-size: 2.5rem;
  margin-bottom: 8px;
  color: ${({ $selected, theme }) => 
    $selected ? 'white' : theme.colors.brand.primary};
`;

const BotTypeName = styled.h4<{ $selected: boolean }>`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ $selected, theme }) => 
    $selected ? 'white' : theme.colors.text.primary};
  margin-bottom: 4px;
`;

const BotTypeDesc = styled.p<{ $selected: boolean }>`
  font-size: 0.875rem;
  color: ${({ $selected, theme }) => 
    $selected ? theme.colors.text.primaryInverse : theme.colors.text.secondary};
  line-height: 1.4;
`;

const ExampleSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 16px;
  padding: 24px;
  margin-top: 32px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const ExampleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  svg {
    color: #7C3AED;
  }
`;

const ExampleTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ExampleList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    padding: 8px 0;
    padding-left: 24px;
    position: relative;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.6;
    
    &:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${({ theme }) => theme.colors.brand.primary};
      font-weight: 700;
    }
  }
`;

const PreviewSection = styled.div`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-radius: 16px;
  padding: 24px;
  margin-top: 32px;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  
  svg {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const PreviewBot = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PreviewAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.brand.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`;

const PreviewInfo = styled.div`
  flex: 1;
`;

const PreviewName = styled.h4`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const PreviewDesc = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
`;

interface BotSetupData {
  name: string;
  description: string;
  botType: string;
  model?: string;
  welcomeMessage?: string;
  promptStarters?: string[];
}

interface Step1BotSetupProps {
  data: BotSetupData;
  onUpdate: (data: BotSetupData) => void;
}

const botTypes = [
  {
    id: 'learning',
    name: 'Learning Skolr',
    icon: '🎓',
    color: '#7C3AED',
    description: 'Helps students learn and understand concepts'
  },
  {
    id: 'assessment',
    name: 'Assessment Skolr',
    icon: '📝',
    color: '#EC4899',
    description: 'Creates quizzes and evaluates understanding'
  },
  {
    id: 'reading_room',
    name: 'Reading Room',
    icon: '📚',
    color: '#3B82F6',
    description: 'Interactive document study assistant'
  },
  {
    id: 'viewing_room',
    name: 'Viewing Room',
    icon: '🎬',
    color: '#10B981',
    description: 'Video-based learning assistant'
  },
  {
    id: 'knowledge_book',
    name: 'Knowledge Book',
    icon: '📖',
    color: '#F59E0B',
    description: 'Answers only from uploaded documents with citations'
  }
];

const modelOptions = [
  {
    value: 'openai/gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    description: 'Fast and efficient for most tasks'
  },
  {
    value: 'google/gemini-2.5-flash-preview-05-20',
    label: 'Gemini 2.5 Flash',
    description: 'Google\'s latest fast model'
  },
  {
    value: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    label: 'Llama-3.1',
    description: 'Nvidia\'s powerful open model'
  },
  {
    value: 'x-ai/grok-3-mini-beta',
    label: 'Grok-3 Mini',
    description: 'X.AI\'s efficient model'
  },
  {
    value: 'deepseek/deepseek-r1-0528',
    label: 'DeepSeek-R1',
    description: 'Advanced reasoning model'
  },
  {
    value: 'minimax/minimax-m1',
    label: 'MiniMax M1',
    description: 'MiniMax\'s efficient language model'
  }
];

export default function Step1BotSetup({ data, onUpdate }: Step1BotSetupProps) {
  const [localData, setLocalData] = useState(data);
  const maxDescLength = 200;

  // Remove the automatic update to prevent infinite loops
  // Updates will be triggered by user interactions instead

  const handleInputChange = (field: keyof BotSetupData, value: string | string[]) => {
    const newData = {
      ...localData,
      [field]: value
    };
    setLocalData(newData);
    onUpdate(newData); // Update parent immediately
  };

  return (
    <StepCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StepHeader>
        <StepIcon>✨</StepIcon>
        <StepTitle>Let's Create Your Skolr</StepTitle>
        <StepDescription>
          Give your Skolr a memorable name and clear description so students know their new learning companion
        </StepDescription>
      </StepHeader>

      <FormSection>
        <Label htmlFor="botName">
          Skolr Name <span>*</span>
        </Label>
        <Input
          id="botName"
          type="text"
          placeholder="e.g., Math Mentor, Science Explorer, History Guide"
          value={localData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          maxLength={50}
        />
      </FormSection>

      <FormSection>
        <Label htmlFor="botDescription">
          Description <span>*</span>
        </Label>
        <TextArea
          id="botDescription"
          placeholder="Describe what your Skolr will help students with. For example: 'I help students understand algebra concepts through practice problems and step-by-step explanations.'"
          value={localData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          maxLength={maxDescLength}
        />
        <CharCount>
          {localData.description.length}/{maxDescLength} characters
        </CharCount>
      </FormSection>

      {localData.botType ? (
        <FormSection>
          <Label>Selected Skolr Type</Label>
          {(() => {
            const selectedType = botTypes.find(t => t.id === localData.botType);
            if (!selectedType) return null;
            return (
              <SelectedTypeCard $color={selectedType.color}>
                <SelectedTypeHeader>
                  <SelectedTypeIcon $color={selectedType.color}>
                    {selectedType.icon}
                  </SelectedTypeIcon>
                  <div>
                    <SelectedTypeName>{selectedType.name}</SelectedTypeName>
                    <SelectedTypeDescription>{selectedType.description}</SelectedTypeDescription>
                  </div>
                </SelectedTypeHeader>
              </SelectedTypeCard>
            );
          })()}
        </FormSection>
      ) : (
        <BotTypeSection>
          <Label>Choose Skolr Type <span>*</span></Label>
          <BotTypeGrid>
            {botTypes.map((type) => (
              <BotTypeCard
                key={type.id}
                $selected={localData.botType === type.id}
                onClick={() => handleInputChange('botType', type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BotTypeIcon $selected={localData.botType === type.id}>
                  {type.icon}
                </BotTypeIcon>
                <BotTypeName $selected={localData.botType === type.id}>
                  {type.name}
                </BotTypeName>
                <BotTypeDesc $selected={localData.botType === type.id}>
                  {type.description}
                </BotTypeDesc>
              </BotTypeCard>
            ))}
          </BotTypeGrid>
        </BotTypeSection>
      )}

      <FormSection>
        <Label htmlFor="model">AI Model</Label>
        <Select
          id="model"
          value={localData.model || 'openai/gpt-4.1-mini'}
          onChange={(e) => handleInputChange('model', e.target.value)}
        >
          {modelOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </Select>
      </FormSection>

      <FormSection>
        <Label htmlFor="welcomeMessage">
          Welcome Message
        </Label>
        <HelperText>
          Leave empty to auto-generate based on your behaviour prompt
        </HelperText>
        <TextArea
          id="welcomeMessage"
          placeholder="A welcome message will be automatically generated based on your Skolr's personality..."
          value={localData.welcomeMessage || ''}
          onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
          maxLength={500}
          style={{ minHeight: '80px' }}
        />
        <CharCount>
          {(localData.welcomeMessage || '').length}/500 characters
        </CharCount>
        {!localData.welcomeMessage && localData.name && (
          <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '8px', fontStyle: 'italic' }}>
            ✨ A friendly welcome message will be generated when you create this Skolr
          </p>
        )}
      </FormSection>

      <FormSection>
        <Label>Conversation Starters (Optional)</Label>
        <HelperText style={{ marginBottom: '12px' }}>
          Add up to 3 starter prompts to help students begin conversations
        </HelperText>
        {[0, 1, 2].map((index) => (
          <Input
            key={index}
            type="text"
            placeholder={
              index === 0 ? "e.g., Help me solve a quadratic equation" :
              index === 1 ? "e.g., Explain the Pythagorean theorem" :
              "e.g., What are the properties of triangles?"
            }
            value={localData.promptStarters?.[index] || ''}
            onChange={(e) => {
              const newStarters = [...(localData.promptStarters || ['', '', ''])];
              newStarters[index] = e.target.value;
              handleInputChange('promptStarters', newStarters);
            }}
            maxLength={100}
            style={{ marginBottom: '12px' }}
          />
        ))}
      </FormSection>

      <ExampleSection>
        <ExampleHeader>
          <FiInfo />
          <ExampleTitle>Tips for Great Skolr Names</ExampleTitle>
        </ExampleHeader>
        <ExampleList>
          <li>Use friendly, approachable names that students will remember</li>
          <li>Include the subject area to make it clear (e.g., "Biology Buddy")</li>
          <li>Avoid overly technical or intimidating names</li>
          <li>Consider your students' age group and interests</li>
        </ExampleList>
      </ExampleSection>

      {localData.name && (
        <PreviewSection>
          <PreviewHeader>
            <FiEye />
            <ExampleTitle>Preview</ExampleTitle>
          </PreviewHeader>
          <PreviewBot>
            <PreviewAvatar>
              {localData.botType === 'learning' && '🎓'}
              {localData.botType === 'assessment' && '📝'}
              {localData.botType === 'reading_room' && '📚'}
              {localData.botType === 'viewing_room' && '🎬'}
              {!localData.botType && '🤖'}
            </PreviewAvatar>
            <PreviewInfo>
              <PreviewName>{localData.name || 'Your Skolr Name'}</PreviewName>
              <PreviewDesc>
                {localData.description || 'Your Skolr description will appear here'}
              </PreviewDesc>
            </PreviewInfo>
          </PreviewBot>
        </PreviewSection>
      )}
    </StepCard>
  );
}