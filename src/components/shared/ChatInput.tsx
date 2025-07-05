// src/components/shared/ChatInput.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';

// ... (InputContainer, InputForm, TextInput, SendButton, ErrorAlert styled components remain the same)

const InputForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.ui.pastelPurple};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: ${({ theme }) => theme.colors.ui.pastelGray};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    min-height: 48px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    
    button {
      min-height: 48px;
    }
    
    button:first-child {
      flex: 0 0 70%;
    }
  }
`;

const ClearButton = styled.button`
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border: 2px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 0 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorAlert = styled(Alert)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;


const InputHint = styled.p`
  font-size: 0.8rem; /* Slightly larger for better readability */
  color: ${({ theme }) => theme.colors.text.muted};
  margin-top: ${({ theme }) => theme.spacing.sm};
  text-align: left; /* Align to left, often better for hints near input */
  padding-left: ${({ theme }) => theme.spacing.xs};

  /* Default hint shown on mobile for Ctrl/Cmd+Enter */
  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none; 
  }
`;

// We're removing this since we now use a button instead of a command
// Keeping the styled component in case we need it for other hints later
const AssessmentHint = styled(InputHint)`
    display: block; /* Ensure it's always visible if provided */
    text-align: center; /* Center this specific hint */
    margin-bottom: -${({ theme }) => theme.spacing.xs}; /* Adjust spacing slightly */
`;


interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  hint?: string; // New optional hint prop
  onClear?: () => void; // Optional clear function
}

export default function ChatInput({ onSend, isLoading, error, onClearError, hint, onClear }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const content = message.trim();
    setMessage(''); // Clear input immediately
    await onSend(content);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Prevent default Enter behavior (like newline in some setups) if Ctrl/Meta is pressed
      e.preventDefault(); 
      handleSubmit(e as unknown as React.FormEvent); // Cast because original event is KeyboardEvent
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // If just Enter is pressed (and not Shift+Enter for newline)
      e.preventDefault(); 
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    // InputContainer styling has been removed from Chat.tsx and should be part of ChatInput itself if needed.
    // For now, assuming StyledChatInputContainer in Chat.tsx provides the main padding.
    <> 
      {error && (
        <ErrorAlert variant="error" onClick={onClearError} style={{marginBottom: '8px'}}>
          {error}
        </ErrorAlert>
      )}
      
      <InputForm onSubmit={handleSubmit}>
        <TextInput
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <ButtonGroup>
          <ModernButton             type="submit"
            disabled={isLoading || !message.trim()}
            variant="primary"
            size="medium"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </ModernButton>
          {onClear && (
            <ClearButton
              type="button"
              onClick={onClear}
              disabled={isLoading}
              title="Clear chat history"
              aria-label="Clear chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </ClearButton>
          )}
        </ButtonGroup>
      </InputForm>

      {hint && <AssessmentHint>{hint}</AssessmentHint>}
      
      {/* General hint for mobile, could be combined or made more context-aware */}
      {!hint && (
         <InputHint>
            Press Enter to send. Use Shift+Enter for a new line.
         </InputHint>
      )}
    </>
  );
}