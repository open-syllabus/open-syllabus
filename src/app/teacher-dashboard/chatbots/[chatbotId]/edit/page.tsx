// src/app/teacher-dashboard/chatbots/[chatbotId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
    Container, Card, FormGroup, Label, Input, TextArea, Alert,
    Select as StyledSelect
} from '@/styles/StyledComponents';
import { createClient } from '@/lib/supabase/client';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Chatbot, BotTypeEnum as BotType, CreateChatbotPayload } from '@/types/database.types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { FiDatabase, FiSettings, FiMessageSquare } from 'react-icons/fi';

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
  max-width: 900px;
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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const SectionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  color: #7C3AED;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const FormGrid = styled.div`
  display: grid;
  gap: 24px;
`;

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 0;
`;

const StyledLabel = styled(Label)`
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.875rem;
`;

const StyledInput = styled(Input)`
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const StyledTextArea = styled(TextArea)`
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  min-height: 120px;
  transition: all 0.2s ease;
  resize: vertical;
  
  &:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const StyledSelectWrapper = styled(StyledSelect)`
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
`;

const HelpText = styled.p`
  font-size: 0.75rem;
  color: #6B7280;
  margin-top: 4px;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
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

const InfoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: #F3F4F6;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #6B7280;
  margin-left: auto;
`;

const QuickActionsCard = styled(StyledCard)`
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
`;

const QuickActionButton = styled(ModernButton)`
  width: 100%;
  justify-content: flex-start;
  padding: 12px 16px;
  
  svg {
    margin-right: 8px;
  }
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SliderInput = styled.input`
  flex: 1;
  cursor: pointer;
`;

const SliderValue = styled.span`
  min-width: 40px;
  text-align: center;
  font-weight: 500;
  color: #374151;
`;

export default function EditChatbotPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const chatbotId = params?.chatbotId as string;

    const [chatbot, setChatbot] = useState<Chatbot | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state - only editable fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [model, setModel] = useState('openai/gpt-4.1-mini');
    const [temperature, setTemperature] = useState(0.7);
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [assessmentCriteria, setAssessmentCriteria] = useState('');
    const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
    const [enableRag, setEnableRag] = useState(false);

    const fetchChatbot = useCallback(async () => {
        try {
            const { data: chatbotData, error: chatbotError } = await supabase
                .from('chatbots')
                .select('*')
                .eq('chatbot_id', chatbotId)
                .single();

            if (chatbotError) throw chatbotError;
            if (!chatbotData) throw new Error('Chatbot not found');

            setChatbot(chatbotData);
            setName(chatbotData.name);
            setDescription(chatbotData.description || '');
            setSystemPrompt(chatbotData.system_prompt);
            setModel(chatbotData.model || 'openai/gpt-4.1-mini');
            setTemperature(chatbotData.temperature || 0.7);
            setWelcomeMessage(chatbotData.welcome_message || '');
            setAssessmentCriteria(chatbotData.assessment_criteria_text || '');
            setMaxTokens(chatbotData.max_tokens || undefined);
            setEnableRag(chatbotData.enable_rag || false);
        } catch (err) {
            console.error('Error fetching chatbot:', err);
            setError(err instanceof Error ? err.message : 'Failed to load chatbot');
        } finally {
            setLoading(false);
        }
    }, [chatbotId, supabase]);

    useEffect(() => {
        if (chatbotId) {
            fetchChatbot();
        }
    }, [chatbotId, fetchChatbot]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const payload: Partial<CreateChatbotPayload> = {
                name: name.trim(),
                description: description.trim() || undefined,
                system_prompt: systemPrompt.trim(),
                model,
                temperature,
                welcome_message: welcomeMessage.trim() || undefined,
                max_tokens: maxTokens || null,
                enable_rag: enableRag,
            };

            // Only include assessment criteria if it's an assessment bot
            if (chatbot?.bot_type === 'assessment') {
                payload.assessment_criteria_text = assessmentCriteria.trim() || null;
            }

            const response = await fetch(`/api/teacher/chatbots/${chatbotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update chatbot');
            }

            setSuccessMessage('Skolr updated successfully!');
            setTimeout(() => {
                router.push('/teacher-dashboard/chatbots');
            }, 1500);
        } catch (err) {
            console.error('Error updating chatbot:', err);
            setError(err instanceof Error ? err.message : 'Failed to update chatbot');
        } finally {
            setSaving(false);
        }
    };

    const getBotTypeLabel = (botType: BotType | null | undefined) => {
        switch (botType) {
            case 'learning': return 'Learning Assistant';
            case 'assessment': return 'Assessment Bot';
            case 'reading_room': return 'Reading Room';
            case 'viewing_room': return 'Viewing Room';
            default: return 'Unknown Type';
        }
    };

    if (loading) {
        return (
            <PageWrapper>
                <ContentContainer>
                    <LoadingContainer>
                        <LoadingSpinner size="large" />
                        <LoadingText>Loading Skolr settings...</LoadingText>
                    </LoadingContainer>
                </ContentContainer>
            </PageWrapper>
        );
    }

    if (!chatbot) {
        return (
            <PageWrapper>
                <ContentContainer>
                    <StyledCard>
                        <Alert variant="error">Skolr not found</Alert>
                        <ButtonGroup>
                            <ModernButton
                                onClick={() => router.push('/teacher-dashboard/chatbots')}
                            >
                                Back to Skolrs
                            </ModernButton>
                        </ButtonGroup>
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
                            <Title>Edit Skolr Settings</Title>
                            <Subtitle>{chatbot.name}</Subtitle>
                        </div>
                        <ModernButton
                            variant="ghost"
                            size="medium"
                            onClick={() => router.push('/teacher-dashboard/chatbots')}
                        >
                            ← Back to Skolrs
                        </ModernButton>
                    </HeaderRow>
                </Header>

                {error && (
                    <Alert variant="error" style={{ marginBottom: '24px' }}>
                        {error}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" style={{ marginBottom: '24px' }}>
                        {successMessage}
                    </Alert>
                )}

                <StyledCard>
                    <SectionHeader>
                        <SectionIcon>
                            <FiMessageSquare />
                        </SectionIcon>
                        <SectionTitle>Basic Information</SectionTitle>
                        <InfoBadge>{getBotTypeLabel(chatbot.bot_type)}</InfoBadge>
                    </SectionHeader>
                    <FormGrid>
                        <StyledFormGroup>
                            <StyledLabel htmlFor="name">Skolr Name</StyledLabel>
                            <StyledInput
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="E.g., Math Helper, Science Assistant"
                            />
                        </StyledFormGroup>

                        <StyledFormGroup>
                            <StyledLabel htmlFor="description">Description (Optional)</StyledLabel>
                            <StyledTextArea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what this Skolr does..."
                            />
                        </StyledFormGroup>

                        <StyledFormGroup>
                            <StyledLabel htmlFor="welcomeMessage">
                                Welcome Message
                                {!welcomeMessage && (
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#059669', 
                                        fontWeight: 'normal',
                                        marginLeft: '8px'
                                    }}>
                                        ✨ Auto-generated
                                    </span>
                                )}
                            </StyledLabel>
                            <StyledTextArea
                                id="welcomeMessage"
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                placeholder="Leave empty to auto-generate based on behaviour prompt..."
                            />
                            <HelpText>
                                This message will be shown to students when they first start chatting with this Skolr. 
                                Leave empty to auto-generate based on the behaviour prompt.
                            </HelpText>
                        </StyledFormGroup>
                    </FormGrid>
                </StyledCard>

                <StyledCard>
                    <SectionHeader>
                        <SectionIcon>
                            <FiSettings />
                        </SectionIcon>
                        <SectionTitle>Behaviour & Personality</SectionTitle>
                    </SectionHeader>
                    <FormGrid>
                        <StyledFormGroup>
                            <StyledLabel htmlFor="systemPrompt">System Prompt</StyledLabel>
                            <StyledTextArea
                                id="systemPrompt"
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="Define how the Skolr should behave and respond..."
                                style={{ minHeight: '200px' }}
                            />
                            <HelpText>
                                This is the core instruction that defines your Skolr's personality, knowledge, and how it interacts with students. Be specific about tone, teaching style, and any rules it should follow.
                            </HelpText>
                        </StyledFormGroup>

                        {chatbot.bot_type === 'assessment' && (
                            <StyledFormGroup>
                                <StyledLabel htmlFor="assessmentCriteria">
                                    Assessment Criteria
                                </StyledLabel>
                                <StyledTextArea
                                    id="assessmentCriteria"
                                    value={assessmentCriteria}
                                    onChange={(e) => setAssessmentCriteria(e.target.value)}
                                    placeholder="Define how the Skolr should evaluate student responses..."
                                    style={{ minHeight: '150px' }}
                                />
                                <HelpText>
                                    Specify the criteria for evaluating student responses, scoring rubrics, and feedback style
                                </HelpText>
                            </StyledFormGroup>
                        )}

                        <StyledFormGroup>
                            <StyledLabel htmlFor="model">AI Model</StyledLabel>
                            <StyledSelectWrapper
                                id="model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            >
                                <option value="openai/gpt-4.1-mini">GPT-4.1 Mini - Fast and efficient for most tasks</option>
                                <option value="google/gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash - Google's latest fast model</option>
                                <option value="nvidia/llama-3.1-nemotron-ultra-253b-v1">Llama-3.1 - Nvidia's powerful open model</option>
                                <option value="x-ai/grok-3-mini-beta">Grok-3 Mini - X.AI's efficient model</option>
                                <option value="deepseek/deepseek-r1-0528">DeepSeek-R1 - Advanced reasoning model</option>
                                <option value="minimax/minimax-m1">MiniMax M1 - MiniMax's efficient language model</option>
                            </StyledSelectWrapper>
                            <HelpText>
                                Different models have different strengths. Choose based on your specific needs for speed, accuracy, and reasoning capabilities.
                            </HelpText>
                        </StyledFormGroup>

                        <StyledFormGroup>
                            <StyledLabel htmlFor="temperature">
                                Response Creativity
                            </StyledLabel>
                            <SliderContainer>
                                <SliderInput
                                    id="temperature"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                />
                                <SliderValue>{temperature}</SliderValue>
                            </SliderContainer>
                            <HelpText>
                                Lower values (0-0.3) make responses more focused and consistent. Higher values (0.7-1.0) make responses more creative and varied.
                            </HelpText>
                        </StyledFormGroup>

                        <StyledFormGroup>
                            <StyledLabel htmlFor="maxTokens">
                                Max Response Length (Optional)
                            </StyledLabel>
                            <StyledInput
                                id="maxTokens"
                                type="number"
                                value={maxTokens || ''}
                                onChange={(e) => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="Leave empty for default"
                                min="1"
                                max="32000"
                            />
                            <HelpText>
                                Maximum number of tokens (words) in each response. Leave empty to use the model's default.
                            </HelpText>
                        </StyledFormGroup>

                        {(chatbot.bot_type === 'learning' || chatbot.bot_type === 'reading_room' || 
                          chatbot.bot_type === 'viewing_room' || chatbot.bot_type === 'knowledge_book') && (
                            <StyledFormGroup>
                                <StyledLabel htmlFor="enableRag">
                                    <input
                                        id="enableRag"
                                        type="checkbox"
                                        checked={enableRag}
                                        onChange={(e) => setEnableRag(e.target.checked)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Enable Knowledge Base
                                </StyledLabel>
                                <HelpText>
                                    When enabled, the Skolr can access uploaded documents, web pages, and videos to provide more accurate, context-aware responses.
                                </HelpText>
                            </StyledFormGroup>
                        )}
                    </FormGrid>
                </StyledCard>

                {enableRag && (
                    <QuickActionsCard>
                        <SectionHeader>
                            <SectionIcon>
                                <FiDatabase />
                            </SectionIcon>
                            <SectionTitle>Knowledge Base</SectionTitle>
                        </SectionHeader>
                        <QuickActionButton
                            variant="ghost"
                            onClick={() => router.push(`/teacher-dashboard/chatbots/${chatbotId}/knowledge-base`)}
                        >
                            <FiDatabase />
                            Manage Knowledge Base
                        </QuickActionButton>
                        <HelpText style={{ marginTop: '12px', textAlign: 'center' }}>
                            Add documents, web pages, and videos to enhance your Skolr's knowledge
                        </HelpText>
                    </QuickActionsCard>
                )}

                <ButtonGroup>
                    <ModernButton
                        variant="ghost"
                        onClick={() => router.push('/teacher-dashboard/chatbots')}
                        disabled={saving}
                    >
                        Cancel
                    </ModernButton>
                    <ModernButton
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !systemPrompt.trim()}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </ModernButton>
                </ButtonGroup>
            </ContentContainer>
        </PageWrapper>
    );
}