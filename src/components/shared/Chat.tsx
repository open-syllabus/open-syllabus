// src/components/shared/Chat.tsx (SUPER SIMPLIFIED DIAGNOSTIC VERSION)
'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { Card, Alert } from '@/styles/StyledComponents';
import { ModernButton, IconButton } from '@/components/shared/ModernButton';;
import { ChatMessage as ChatMessageComponent } from '@/components/shared/ChatMessage';
import { SafetyMessage } from '@/components/shared/SafetyMessage';
import ChatInput from '@/components/shared/ChatInput';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Toast } from '@/components/shared/Toast';
import type { ChatMessage, Chatbot } from '@/types/database.types';
import { FiBookmark } from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const ASSESSMENT_TRIGGER_COMMAND = "/assess";

// Basic front-end safety check for potential concerns
// This is a simple check that helps flag messages that might need attention
const initialSafetyCheck = (message: string): boolean => {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return false;
  }
  
  // Skip safety check for commands
  if (message.trim().startsWith('/')) {
    console.log('[Chat Safety] Skipping check - message is a command');
    return false;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Check for common concern keywords
  const concernKeywords = [
    // Self-harm related
    'suicide', 'kill myself', 'want to die', 'end my life', 'hate myself',
    // Bullying related
    'bullied', 'bullying', 'bully', 'picking on me', 'harassing me',
    // Abuse related
    'abused', 'hitting me', 'hurt me', 'hurting me', 'threatened',
    // Depression/mental health related
    'depressed', 'depression', 'anxiety', 'panic attack', 'helpless',
    // General distress signals
    'help me', 'scared', 'afraid', 'terrified', 'in danger'
  ];
  
  // Check if any keywords are in the message
  for (const keyword of concernKeywords) {
    if (lowerMessage.includes(keyword)) {
      console.log(`[Chat Safety] Potential safety concern detected: "${keyword}"`);
      return true;
    }
  }
  
  return false;
};

// Styled Components
const ChatContainer = styled.div<{ $isReadingRoom?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: ${({ $isReadingRoom }) => $isReadingRoom ? '100%' : '500px'};
  overflow: hidden;
  position: relative;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-radius: ${({ theme, $isReadingRoom }) => $isReadingRoom ? theme.borderRadius.medium : theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  background: ${({ theme }) => theme.colors.ui.background};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  }
`;

const ChatbotTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const ChatActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const MessagesList = styled.div<{ $isReadingRoom?: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: ${({ $isReadingRoom }) => $isReadingRoom ? '0.5rem' : '1rem'};
  display: flex;
  flex-direction: column;
  gap: ${({ $isReadingRoom }) => $isReadingRoom ? '0.75rem' : '1rem'};
  height: 100%;
  max-height: ${({ $isReadingRoom }) => $isReadingRoom ? 'calc(100vh - 200px)' : 'calc(100vh - 280px)'}; // More height for reading room
  position: relative; // Added for absolute positioning of children
  will-change: transform; // Performance optimization for scrolling
  -webkit-overflow-scrolling: touch; // Better scrolling on iOS
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: calc(100vh - 320px); // Account for mobile browser chrome and assessment
    padding: 0.5rem; // Reduced padding on mobile
    gap: 0.75rem; // Slightly smaller gap between messages
  }
`;

const StyledChatInputContainer = styled.div<{ $isReadingRoom?: boolean }>`
  padding: ${({ theme, $isReadingRoom }) => $isReadingRoom ? theme.spacing.md : theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 0 0 ${({ theme }) => theme.borderRadius.xl} ${({ theme }) => theme.borderRadius.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const PromptStartersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const PromptStartersTitle = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PromptStarterButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.ui.background};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.813rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
    border-color: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  h3 {
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
    font-size: 1.25rem;
    font-family: ${({ theme }) => theme.fonts.heading};
  }
`;

const ErrorContainer = styled(Alert)`
  margin: 1rem;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const AssessmentSection = styled.div`
  position: relative;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.soft};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: ${({ theme }) => theme.spacing.md};
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const AssessmentInfo = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 0.8rem;
  }
`;

const ThinkingIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
  font-style: italic;
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
    animation: pulse 1.5s infinite ease-in-out;
  }
  
  @keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
`;

const DisclaimerText = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.muted};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-top: 1px solid ${({ theme }) => hexToRgba(theme.colors.ui.border, 0.1)};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 0.7rem;
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  }
`;

interface ChatProps {
  roomId: string;
  chatbot: Chatbot;
  // These were intended for direct access but are now handled via the URL
  // Kept for backwards compatibility
  studentId?: string;
  directMode?: boolean;
  // New field for student-specific chatbot instances
  instanceId?: string;
  // Added countryCode for safety messages
  countryCode?: string;
}

export default function Chat({ roomId, chatbot, instanceId, countryCode, directMode }: ChatProps) {
  // Check if this is a reading room or viewing room
  const isReadingRoom = chatbot.bot_type === 'reading_room' || chatbot.bot_type === 'viewing_room';
  
  // Auto-detect country code if not provided
  const detectedCountryCode = useMemo(() => {
    if (countryCode) return countryCode;
    
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || navigator.languages?.[0];
      if (locale) {
        const countryFromLocale = locale.split('-')[1]?.toUpperCase();
        console.log(`[Chat] Auto-detected country from browser locale: ${locale} -> ${countryFromLocale}`);
        return countryFromLocale;
      }
    }
    console.log(`[Chat] No country detection available, using DEFAULT`);
    return null;
  }, [countryCode]);
  
  useEffect(() => {
    console.log(`[Chat] Final country code:`, {
      provided: countryCode,
      detected: detectedCountryCode,
      final: detectedCountryCode || 'DEFAULT'
    });
  }, [countryCode, detectedCountryCode]);
  
  // studentId and directMode params removed as they're not used
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Keep for ChatInput
  const [isFetchingMessages, setIsFetchingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null); // Keep for ChatInput
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [dailyLimitResetTime, setDailyLimitResetTime] = useState<Date | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  // Memory tracking
  const sessionStartTimeRef = useRef<string>(new Date().toISOString());
  const messageCountRef = useRef<number>(0);
  const lastMemorySaveRef = useRef<number>(0);
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionMessagesRef = useRef<Array<{role: string; content: string}>>([]);
  const sessionSavedRef = useRef<boolean>(false); // Track if we already saved this session
  const lastUserMessageTimeRef = useRef<number>(Date.now()); // Track the last user activity

  // Check for direct auth via URL
  // Initialize search params only once using a lazy initializer function to avoid re-renders
  const [searchParams] = useState<URLSearchParams | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return null;
  });

  // Get user ID with fallbacks
  useEffect(() => {
    const getUserId = async () => {
      try {
        // Priority 1: Try normal auth session
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('[Chat] Found authenticated user:', user.id);
          setUserId(user.id);
          
          // Assume user is a student - the API will handle role-specific logic
          // This avoids client-side RLS issues with the students table
          setIsStudent(true);
          console.log('[Chat] User authenticated, assuming student role for UI');
          
          return;
        }
        
        // Priority 2: Check for emergency cookies
        const getEmergencyCookieValue = (name: string): string | null => {
          if (typeof document === 'undefined') return null;
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : null;
        };
        
        const emergencyUserId = getEmergencyCookieValue('emergency_user_id');
        const emergencyAccess = getEmergencyCookieValue('emergency_access');
        
        if (emergencyUserId && emergencyAccess === 'true') {
          console.log('[Chat] Using emergency user ID from cookies:', emergencyUserId);
          setUserId(emergencyUserId);
          return;
        }
        
        // Priority 3: Check for uid in URL
        const uidFromUrl = searchParams?.get('uid');
        if (uidFromUrl) {
          console.log('[Chat] Using user ID from URL:', uidFromUrl);
          
          // Verify this is a valid user with API
          try {
            const response = await fetch(`/api/student/verify-user?userId=${uidFromUrl}`);
            if (response.ok) {
              const data = await response.json();
              if (data.valid) {
                setUserId(uidFromUrl);
                return;
              }
            }
          } catch (verifyError) {
            console.error('[Chat] Error verifying user from URL:', verifyError);
          }
        }
        
        // No valid user found
        setFetchError("Auth error: No user. Try refreshing the page.");
      } catch (err) { 
        console.error('[Chat] Auth error:', err);
        setFetchError("Auth error. Try refreshing the page."); 
      }
    };
    
    // Get user ID if we're in a browser environment
    if (typeof window !== 'undefined') {
      getUserId();
    }
  }, [supabase, searchParams]);

  const scrollToBottom = useCallback(() => {
    try {
      // Just use the most reliable method to reduce complexity
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    } catch (scrollError) {
      console.error('[Chat.tsx] Error in scrollToBottom:', scrollError);
    }
  }, []);

  // Save conversation memory after session ends
  const saveConversationMemory = useCallback(async () => {
    if (!isStudent || !userId || !chatbot?.chatbot_id || !roomId) {
      console.log('[Memory] Skipping memory save - not a student or missing data');
      return;
    }

    // Check if we've already saved this session
    if (sessionSavedRef.current) {
      console.log('[Memory] Skipping memory save - session already saved');
      return;
    }

    // Use the stored session messages instead of current messages
    const conversationMessages = sessionMessagesRef.current;
    
    if (conversationMessages.length < 4) {
      console.log('[Memory] Skipping memory save - conversation too short');
      return;
    }

    try {
      console.log('[Memory] Saving session memory after 10 minutes of inactivity...');
      console.log(`[Memory] Session had ${conversationMessages.length} messages`);

      const response = await fetch('/api/student/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: userId,
          chatbotId: chatbot.chatbot_id,
          roomId: roomId,
          messages: conversationMessages,
          sessionStartTime: sessionStartTimeRef.current
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Memory] Successfully saved session memory:', result);
        
        // Mark session as saved
        sessionSavedRef.current = true;
        
        // Clear the session messages after successful save
        sessionMessagesRef.current = [];
        
        // Reset session start time for next session
        sessionStartTimeRef.current = new Date().toISOString();
      } else {
        console.error('[Memory] Failed to save memory:', await response.text());
      }
    } catch (error) {
      console.error('[Memory] Error saving conversation memory:', error);
    }
  }, [isStudent, userId, chatbot?.chatbot_id, roomId]);

  // Add ref to track last fetch time to avoid excessive API calls
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  
  // Reset inactivity timer when there's activity
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer for 10 minutes, but only if we haven't saved yet
    if (isStudent && userId && chatbot?.chatbot_id && !sessionSavedRef.current) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('[Memory] 10 minutes of inactivity detected, saving session memory...');
        saveConversationMemory();
      }, 10 * 60 * 1000); // 10 minutes
    }
  }, [isStudent, userId, chatbot?.chatbot_id, saveConversationMemory]);

  // Track messages in the session
  useEffect(() => {
    // Store conversation messages in the session - filter out duplicates and system messages
    const conversationMessages = messages.filter(m => 
      (m.role === 'user' || m.role === 'assistant') && 
      !m.metadata?.isOptimistic && // Exclude optimistic messages
      !m.metadata?.isWelcomeMessage // Exclude welcome messages
    );
    
    // Create a unique key for each message to avoid duplicates
    const uniqueMessages = new Map<string, {role: string; content: string}>();
    conversationMessages.forEach(m => {
      // Use a combination of role, content hash, and timestamp to create unique key
      const key = `${m.role}-${m.content.substring(0, 50)}-${m.created_at}`;
      if (!uniqueMessages.has(key)) {
        uniqueMessages.set(key, {
          role: m.role,
          content: m.content
        });
      }
    });
    
    sessionMessagesRef.current = Array.from(uniqueMessages.values());
    
    // Check if there's a new user message to track activity
    const userMessages = conversationMessages.filter(m => m.role === 'user');
    const currentUserMessageCount = userMessages.length;
    const previousUserMessageCount = messageCountRef.current;
    
    // Reset inactivity timer only on new user messages (not assistant responses)
    if (currentUserMessageCount > previousUserMessageCount) {
      lastUserMessageTimeRef.current = Date.now();
      resetInactivityTimer();
      
      // Reset the saved flag when there's new activity
      if (sessionSavedRef.current && currentUserMessageCount > previousUserMessageCount) {
        console.log('[Memory] New user activity detected, resetting saved flag');
        sessionSavedRef.current = false;
      }
    }
    
    messageCountRef.current = currentUserMessageCount;
  }, [messages, resetInactivityTimer]);
  
  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      // Clear the inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      // Save memory if there's a meaningful conversation and we haven't saved yet
      if (isStudent && sessionMessagesRef.current.length >= 4 && !sessionSavedRef.current) {
        console.log('[Memory] Component unmounting, checking if we should save...');
        
        // Only save if it's been at least 2 minutes since last user activity
        // This prevents duplicate saves when quickly navigating
        const timeSinceLastUserActivity = Date.now() - lastUserMessageTimeRef.current;
        if (timeSinceLastUserActivity > 2 * 60 * 1000) {
          console.log('[Memory] Saving on unmount due to sufficient inactivity');
          saveConversationMemory();
        } else {
          console.log('[Memory] Skipping save on unmount - too recent activity');
        }
      }
    };
  }, [isStudent, saveConversationMemory]);
  
  // Fetch messages with support for direct URL access and homepage fallback
  const fetchMessages = useCallback(async () => {
    console.log('[Chat] fetchMessages called', { chatbotId: chatbot?.chatbot_id, userId, roomId, isFetching: isFetchingRef.current });
    
    // Skip if we're already fetching or if required props are missing
    if (!chatbot?.chatbot_id || !userId || !roomId || isFetchingRef.current) {
      console.log('[Chat] Skipping fetch - missing params or already fetching');
      setIsFetchingMessages(false); 
      return;
    }
    
    // Debounce API calls - don't fetch if we've fetched within last 2 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log('[Chat] Skipping fetch, too soon since last fetch');
      return;
    }
    
    // Update tracking variables
    lastFetchTimeRef.current = now;
    isFetchingRef.current = true;
    setIsFetchingMessages(true); 
    setFetchError(null);
    try {
      // Check if using emergency access or direct URL
      const isEmergencyAccess = document.cookie.includes('emergency_access=true');
      const uidFromUrl = searchParams?.get('uid');
      const emergency = searchParams?.get('emergency');
      
      // Enhanced debugging for instance ID
      console.log(`[Chat] Starting fetchMessages with:
      - instanceId: ${instanceId || 'undefined'}
      - roomId: ${roomId}
      - chatbotId: ${chatbot?.chatbot_id}
      - userId: ${userId}
      `);
      
      // Additional validation
      if (!instanceId) {
        console.warn(`[Chat] No instanceId provided but we are on path ${window.location.pathname} - this might cause shared chat issues`);
      }
      
      // First try to determine the API endpoint
      let url;
      if (isEmergencyAccess || (emergency === 'true') || (uidFromUrl && uidFromUrl === userId)) {
        // Direct access mode - Emergency access takes priority
        url = `/api/chat/direct-access?roomId=${roomId}&userId=${userId}&chatbotId=${chatbot.chatbot_id}`;
        if (instanceId) {
          url += `&instanceId=${instanceId}`;
          console.log('[Chat] Added instanceId to direct access URL:', instanceId);
        } else {
          console.log('[Chat] No instanceId available for direct access URL');
        }
        console.log('[Chat] Using direct access endpoint (emergency or URL parameter)');
      } else {
        // Regular API endpoint
        url = `/api/chat/${roomId}?chatbotId=${chatbot.chatbot_id}`;
        if (instanceId) {
          url += `&instanceId=${instanceId}`;
          console.log('[Chat] Added instanceId to regular URL:', instanceId);
        } else {
          console.log('[Chat] No instanceId available for regular URL');
        }
      }
      
      console.log(`[Chat.tsx] Fetching messages from: ${url}`);
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        // If first attempt fails, try the direct access endpoint as fallback
        if (url.includes('/api/chat/') && !url.includes('/api/chat/direct-access')) {
          console.log('[Chat.tsx] Primary endpoint failed, trying direct access fallback...');
          // Try direct access endpoint as fallback
          const fallbackUrl = `/api/chat/direct-access?roomId=${roomId}&userId=${userId}&chatbotId=${chatbot.chatbot_id}${instanceId ? `&instanceId=${instanceId}` : ''}`;
          console.log(`[Chat.tsx] Using fallback URL with instanceId=${instanceId || 'none'}: ${fallbackUrl}`);
          const fallbackResponse = await fetch(fallbackUrl, { credentials: 'include' });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback failed (status: ${fallbackResponse.status})`);
          }
          
          const fallbackData = await fallbackResponse.json();
          
          if (!Array.isArray(fallbackData)) {
            console.warn(`[Chat.tsx] Fallback fetch returned non-array data:`, fallbackData);
            return;
          }
          
          // De-duplicate messages by message_id
          const uniqueMessages = new Map<string, ChatMessage>();
          
          // First add all existing optimistic messages (that haven't been replaced yet)
          const existingOptimisticMessages = messages.filter(msg => 
            msg.metadata?.isOptimistic === true && 
            !fallbackData.some(m => m.metadata?.optimisticContent === msg.metadata?.optimisticContent)
          );
          
          // Also preserve safety placeholders if no real safety messages are present
          const safetyPlaceholders = messages.filter(msg => 
            msg.metadata?.isSafetyPlaceholder === true &&
            !fallbackData.some(m => m.metadata?.isSystemSafetyResponse === true && !m.metadata?.isSafetyPlaceholder)
          );
          
          // Add existing optimistic messages to the map
          existingOptimisticMessages.forEach(msg => {
            uniqueMessages.set(msg.message_id, msg);
          });
          
          // Add safety placeholders to the map
          safetyPlaceholders.forEach(msg => {
            uniqueMessages.set(msg.message_id, msg);
          });
          
          // Process incoming messages
          fallbackData.forEach(msg => {
            // Filter out duplicates - for user messages, also check content
            if (msg.role === 'user') {
              // Look for any optimistic messages with the same content
              const existingOptimisticIndex = Array.from(uniqueMessages.values()).findIndex(existingMsg => 
                existingMsg.metadata?.isOptimistic && 
                existingMsg.metadata?.optimisticContent === msg.content &&
                existingMsg.user_id === msg.user_id
              );
              
              if (existingOptimisticIndex !== -1) {
                // Replace optimistic message
                const existingKeys = Array.from(uniqueMessages.keys());
                if (existingOptimisticIndex < existingKeys.length) {
                  uniqueMessages.delete(existingKeys[existingOptimisticIndex]);
                }
              }
            }
            
            // Add this message
            uniqueMessages.set(msg.message_id, msg);
          });
          
          // Convert map back to array and sort
          const sortedUniqueMessages = Array.from(uniqueMessages.values())
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          console.log(`[Chat.tsx] Fallback fetch complete - ${fallbackData.length} raw messages, ${sortedUniqueMessages.length} unique messages`);
          setMessages(sortedUniqueMessages);
          setTimeout(scrollToBottom, 150);
          
          // Safety messages will be fetched separately via polling
          // Don't call fetchSafetyMessages directly to avoid circular dependencies
          
          return;
        } else {
          throw new Error(`Failed to fetch (status: ${response.status})`);
        }
      }
      
      const data = (await response.json()) as ChatMessage[];
      if (!Array.isArray(data)) {
        console.warn(`[Chat.tsx] Fetch messages returned non-array data:`, data);
        return;
      }
      
      console.log(`[Chat.tsx] Fetch complete - ${data.length} raw messages received`);
      
      // Use setMessages with callback to get current state and deduplicate
      setMessages(currentMessages => {
        // De-duplicate messages by message_id
        const uniqueMessages = new Map<string, ChatMessage>();
      
        // First add all existing optimistic messages (that haven't been replaced yet)
        const existingOptimisticMessages = currentMessages.filter(msg => 
          msg.metadata?.isOptimistic === true && 
          !data.some(m => m.metadata?.optimisticContent === msg.metadata?.optimisticContent)
        );
      
        // Also preserve safety placeholders if no real safety messages are present
        const safetyPlaceholders = currentMessages.filter(msg => 
          msg.metadata?.isSafetyPlaceholder === true &&
          !data.some(m => m.metadata?.isSystemSafetyResponse === true && !m.metadata?.isSafetyPlaceholder)
        );
      
        // Add existing optimistic messages to the map
        existingOptimisticMessages.forEach(msg => {
          uniqueMessages.set(msg.message_id, msg);
        });
        
        // Add safety placeholders to the map
        safetyPlaceholders.forEach(msg => {
          uniqueMessages.set(msg.message_id, msg);
        });
      
        // Process incoming messages
        data.forEach(msg => {
          console.log(`[Chat] Processing message: ${msg.message_id} (${msg.role}) - ${msg.content?.substring(0, 30)}...`);
          
          // Check if message already exists
          if (uniqueMessages.has(msg.message_id)) {
            console.log(`[Chat] Message ${msg.message_id} already exists, skipping`);
            return;
          }
          
          // Filter out duplicates - for user messages, also check content
          if (msg.role === 'user') {
            // Look for any optimistic messages with the same content
            const existingOptimisticIndex = Array.from(uniqueMessages.values()).findIndex(existingMsg => 
              existingMsg.metadata?.isOptimistic && 
              existingMsg.metadata?.optimisticContent === msg.content &&
              existingMsg.user_id === msg.user_id
            );
            
            if (existingOptimisticIndex !== -1) {
              console.log(`[Chat] Replacing optimistic message with real message ${msg.message_id}`);
              // Replace optimistic message
              const existingKeys = Array.from(uniqueMessages.keys());
              if (existingOptimisticIndex < existingKeys.length) {
                uniqueMessages.delete(existingKeys[existingOptimisticIndex]);
              }
            }
            
            // Also check for duplicate user messages with same content and user
            const duplicateUserMessage = Array.from(uniqueMessages.values()).find(existingMsg => 
              existingMsg.role === 'user' && 
              existingMsg.content === msg.content &&
              existingMsg.user_id === msg.user_id &&
              existingMsg.message_id !== msg.message_id
            );
            
            if (duplicateUserMessage) {
              console.log(`[Chat] Found duplicate user message, keeping newer one: ${msg.message_id}`);
              uniqueMessages.delete(duplicateUserMessage.message_id);
            }
          }
          
          // Special handling for safety messages to avoid duplication
          if (msg.role === 'system' && msg.metadata?.isSystemSafetyResponse) {
            // Filter out old safety messages (older than 5 minutes) on initial load
            const messageAge = Date.now() - new Date(msg.created_at).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (messageAge > fiveMinutes) {
              console.log(`[Chat] Filtering out old safety message ${msg.message_id} (${Math.round(messageAge / 1000 / 60)} minutes old)`);
              return;
            }
            
            // Check if we already have a safety message for this concern
            const existingSafetyMessage = Array.from(uniqueMessages.values()).find(existingMsg => 
              existingMsg.role === 'system' && 
              existingMsg.metadata?.isSystemSafetyResponse && 
              existingMsg.metadata?.originalConcernType === msg.metadata?.originalConcernType &&
              existingMsg.message_id !== msg.message_id &&
              // Only consider messages created within 5 minutes of each other
              Math.abs(new Date(existingMsg.created_at).getTime() - new Date(msg.created_at).getTime()) < 5 * 60 * 1000
            );
            
            if (existingSafetyMessage) {
              console.log(`[Chat.tsx] Found duplicate safety message, keeping only the latest one`);
              // Remove the existing safety message and add the new one
              uniqueMessages.delete(existingSafetyMessage.message_id);
            }
          }
          
          // Add this message (will overwrite any existing message with same ID)
          uniqueMessages.set(msg.message_id, msg);
        });
      
        // Convert map back to array and sort
        const sortedUniqueMessages = Array.from(uniqueMessages.values())
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        console.log(`[Chat.tsx] After deduplication: ${sortedUniqueMessages.length} unique messages`);
        console.log(`[Chat.tsx] Message IDs:`, sortedUniqueMessages.map(m => `${m.message_id}(${m.role})`));
        
        return sortedUniqueMessages;
      });
      
      setTimeout(scrollToBottom, 150);
      
      // Safety messages will be fetched separately via polling
      // Don't call fetchSafetyMessages directly to avoid circular dependencies
      
    } catch (err) {
      console.error('[Chat.tsx] Error fetching messages:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsFetchingMessages(false);
      isFetchingRef.current = false;
    }
  }, [roomId, chatbot?.chatbot_id, userId, searchParams, scrollToBottom]);

  // Helper function to fetch safety messages
  const fetchSafetyMessages = useCallback(async (specificMessageId?: string) => {
    if (!userId || !roomId) return;
    
    try {
      console.log(`[Chat.tsx] Fetching safety messages for user ${userId} in room ${roomId}${specificMessageId ? ` (specific: ${specificMessageId})` : ''}`);
      
      // Try the direct safety message API endpoint
      try {
        // If we have a specific message ID from the broadcast, fetch only that message
        const url = specificMessageId 
          ? `/api/student/safety-message?messageId=${specificMessageId}&userId=${userId}`
          : `/api/student/safety-message?userId=${userId}&roomId=${roomId}`;
          
        const safetyResponse = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store' // Ensure we don't get cached responses
        });
        
        if (safetyResponse.ok) {
          const safetyData = await safetyResponse.json();
          
          if (safetyData.found && safetyData.message) {
            console.log(`[Chat.tsx] Found safety message via direct API: ${safetyData.message.message_id}`);
            
            // Check if this is a recent message (created within the last 5 minutes)
            const messageAge = Date.now() - new Date(safetyData.message.created_at).getTime();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (!specificMessageId && messageAge > fiveMinutes) {
              console.log(`[Chat.tsx] Safety message ${safetyData.message.message_id} is older than 5 minutes (${Math.round(messageAge / 1000 / 60)} minutes old), ignoring`);
              return;
            }
            
            // Update UI with the safety message
            setMessages(prevMessages => {
              // Remove any safety placeholders
              const withoutPlaceholders = prevMessages.filter(msg => 
                !msg.metadata?.isSafetyPlaceholder
              );
              
              // Check if safety message already exists in state
              const safetyMessageExists = withoutPlaceholders.some(msg => 
                msg.message_id === safetyData.message.message_id
              );
              
              if (safetyMessageExists) {
                console.log(`[Chat.tsx] Safety message ${safetyData.message.message_id} already exists in state`);
                return withoutPlaceholders;
              }
              
              console.log(`[Chat.tsx] Adding safety message ${safetyData.message.message_id} to UI`);
              const newMessages = [...withoutPlaceholders, safetyData.message];
              
              // Sort by timestamp
              return newMessages.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
            
            setTimeout(scrollToBottom, 100);
            return; // Success, no need for fallback
          }
        }
      } catch (safetyApiError) {
        console.error(`[Chat.tsx] Error in safety message API call:`, safetyApiError);
      }
      
      // If we reach here, safety message API didn't return data
      console.log(`[Chat.tsx] Safety message API didn't return data${specificMessageId ? ' for specific message' : ', will try again on next poll'}`);
      // Don't call fetchMessages to avoid loops - polling will retry
      
    } catch (error) {
      console.error(`[Chat.tsx] Error in fetchSafetyMessages:`, error);
    }
  }, [userId, roomId, scrollToBottom]);
  
  // Add welcome message to empty chat
  useEffect(() => {
    console.log('[Chat] Checking welcome message conditions:', {
      isFetchingMessages,
      messagesLength: messages.length,
      hasWelcomeMessage: !!chatbot?.welcome_message,
      welcomeMessageContent: chatbot?.welcome_message?.substring(0, 20),
      hasUserId: !!userId
    });
    
    if (
      !isFetchingMessages && 
      messages.length === 0 && 
      chatbot?.welcome_message && 
      chatbot.welcome_message.trim() !== '' &&
      userId
    ) {
      console.log('[Chat] Adding welcome message for chatbot:', chatbot.chatbot_id);
      
      // Create a synthetic welcome message
      // Create a properly typed welcome message
      const welcomeMessageObj: ChatMessage = {
        message_id: `welcome-${chatbot.chatbot_id}-${Date.now()}`,
        room_id: roomId,
        user_id: userId,
        role: 'assistant' as 'assistant', // Explicitly typed as literal
        content: chatbot.welcome_message.trim(),
        created_at: new Date().toISOString(),
        metadata: {
          chatbotId: chatbot.chatbot_id,
          isWelcomeMessage: true
        }
      };
      
      // Add welcome message to state
      setMessages([welcomeMessageObj]);
      
      // Single scroll attempt after the welcome message is displayed
      setTimeout(scrollToBottom, 150);
    }
  }, [isFetchingMessages, messages.length, chatbot?.welcome_message, chatbot?.chatbot_id, roomId, userId, scrollToBottom]);
  
  // Backup for welcome message if the above logic didn't trigger
  useEffect(() => {
    // This runs a bit after the first fetch completes and if we still have no messages
    const addDelayedWelcomeMessage = () => {
      if (
        !isFetchingMessages && 
        messages.length === 0 && 
        chatbot?.welcome_message && 
        chatbot.welcome_message.trim() !== '' &&
        userId
      ) {
        console.log('[Chat] Adding delayed welcome message for chatbot:', chatbot.chatbot_id);
        
        // Create a synthetic welcome message
        const welcomeMessageObj: ChatMessage = {
          message_id: `welcome-delayed-${chatbot.chatbot_id}-${Date.now()}`,
          room_id: roomId,
          user_id: userId,
          role: 'assistant' as 'assistant', // Explicitly typed as literal
          content: chatbot.welcome_message.trim(),
          created_at: new Date().toISOString(),
          metadata: {
            chatbotId: chatbot.chatbot_id,
            isWelcomeMessage: true,
            isDelayed: true
          }
        };
        
        // Add welcome message to state
        setMessages([welcomeMessageObj]);
        setTimeout(scrollToBottom, 150);
      }
    };
    
    // Wait a bit after fetching completes to add welcome message if needed
    if (!isFetchingMessages) {
      const timer = setTimeout(addDelayedWelcomeMessage, 500);
      return () => clearTimeout(timer);
    }
  }, [isFetchingMessages, messages.length, chatbot?.welcome_message, chatbot?.chatbot_id, roomId, userId, scrollToBottom]);

  // Helper function to handle realtime message inserts
  const handleRealtimeMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prevMessages) => {
      // Check if message already exists by ID
      if (prevMessages.find(msg => msg.message_id === newMessage.message_id)) {
        console.log(`[Chat.tsx RT] Message ${newMessage.message_id} already in state by ID.`);
        return prevMessages;
      }
      
      // For user messages, check if we have an optimistic version with the same content
      if (newMessage.role === 'user') {
        const optimisticIndex = prevMessages.findIndex(msg => 
          msg.role === 'user' && 
          msg.metadata?.isOptimistic === true && 
          msg.metadata?.optimisticContent === newMessage.content &&
          msg.user_id === newMessage.user_id
        );
        
        if (optimisticIndex !== -1) {
          console.log(`[Chat.tsx RT] Optimistic version of message found at index ${optimisticIndex}, replacing it.`);
          // Replace the optimistic message with the real one
          const updated = [...prevMessages];
          updated[optimisticIndex] = newMessage;
          return updated;
        }
      }
      
      // For safety messages (system role with isSystemSafetyResponse), handle special logic
      if (newMessage.role === 'system' && newMessage.metadata?.isSystemSafetyResponse) {
        // First check for any safety placeholders
        const safetyPlaceholderIndex = prevMessages.findIndex(msg => 
          msg.metadata?.isSafetyPlaceholder === true
        );
        
        if (safetyPlaceholderIndex !== -1) {
          console.log(`[Chat.tsx RT] Replacing safety placeholder with real safety message ${newMessage.message_id}`);
          const updated = [...prevMessages];
          // Replace the placeholder with the real safety message
          updated[safetyPlaceholderIndex] = newMessage;
          return updated;
        }
        
        // Check for existing safety messages of the same type (to avoid duplicates)
        const existingSafetyMessageIndex = prevMessages.findIndex(msg => 
          msg.role === 'system' && 
          msg.metadata?.isSystemSafetyResponse && 
          msg.metadata?.originalConcernType === newMessage.metadata?.originalConcernType &&
          // Only consider messages created within 5 minutes
          Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5 * 60 * 1000
        );
        
        if (existingSafetyMessageIndex !== -1) {
          console.log(`[Chat.tsx RT] Replacing existing safety message with new one ${newMessage.message_id}`);
          const updated = [...prevMessages];
          // Replace with the newer safety message
          updated[existingSafetyMessageIndex] = newMessage;
          return updated;
        }
        
        console.log(`[Chat.tsx RT] Adding new safety message ${newMessage.message_id}`);
      }
      
      // No duplicate or placeholder found, add the new message
      console.log(`[Chat.tsx RT] Adding new message ${newMessage.message_id} (Role: ${newMessage.role}).`);
      const updated = [...prevMessages, newMessage];
      updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return updated;
    });
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  useEffect(() => {
    if (userId && chatbot?.chatbot_id && roomId) {
      console.log('[Chat] Initial fetchMessages call from useEffect');
      fetchMessages();
      // Do NOT fetch safety messages on mount - they should only appear in real-time
      // when triggered by concerning content in the current chat session
    }
  }, [userId, chatbot?.chatbot_id, roomId, fetchMessages]);
  
  // Also subscribe to regular chat message inserts for real-time chat
  useEffect(() => {
    if (!roomId || !userId || !chatbot?.chatbot_id) return;
    
    let retryCount = 0;
    const maxRetries = 3;
    let channel: any = null;
    
    const setupSubscription = async () => {
      try {
        console.log('[Chat.tsx RT] Setting up realtime subscription for chat messages (attempt', retryCount + 1, ')');
        
        channel = supabase
          .channel(`chat-messages-${userId}-${roomId}-${chatbot.chatbot_id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `room_id=eq.${roomId} AND (metadata->>chatbotId)=eq.${chatbot.chatbot_id}`
            },
            (payload) => {
              console.log('[Chat.tsx RT] New chat message detected:', payload);
              
              const newMessage = payload.new as ChatMessage;
              
              // Only add if it's for this user or it's an assistant response
              if (newMessage.user_id === userId || newMessage.role === 'assistant') {
                handleRealtimeMessage(newMessage);
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('[Chat.tsx RT] Error setting up subscription:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => setupSubscription(), 2000 * retryCount);
        }
      }
    };
    
    // Initial setup
    setupSubscription();
    
    return () => {
      console.log('[Chat.tsx RT] Cleaning up chat message subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, userId, chatbot?.chatbot_id, supabase, handleRealtimeMessage]);
  
  // Add a scroll handler that doesn't trigger re-renders or API calls
  useEffect(() => {
    // Only run this when messages array changes and has content
    if (messages.length === 0) return;
    
    // Use a ref to track if we've scrolled for this set of messages
    const messageIds = messages.map(m => m.message_id).join(',');
    const scrollTimeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    return () => clearTimeout(scrollTimeoutId);
  }, [messages.length, scrollToBottom]); // Only depend on message count, not the entire messages array

  // Helper function to handle realtime message updates
  const handleRealtimeUpdate = useCallback((updatedMessage: ChatMessage) => {
    setMessages((prevMessages) => {
      // Find the message to update by ID
      const messageIndex = prevMessages.findIndex(msg => msg.message_id === updatedMessage.message_id);
      
      if (messageIndex === -1) {
        console.log(`[Chat.tsx RT] Can't find message ${updatedMessage.message_id} to update. Adding instead.`);
        const updated = [...prevMessages, updatedMessage];
        updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return updated;
      }
      
      console.log(`[Chat.tsx RT] Updating existing message ${updatedMessage.message_id}`);
      const updated = [...prevMessages];
      updated[messageIndex] = updatedMessage;
      return updated;
    });
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  // --- REALTIME SUBSCRIPTION FOR SAFETY MESSAGES ---
  useEffect(() => {
    if (!roomId || !userId) return;
    
    console.log('[Chat.tsx RT Safety] Setting up realtime subscription for safety messages');
    
    // Subscribe to safety messages for this user and room
    const safetyChannel = supabase
      .channel(`safety-messages-${userId}-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId} AND user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[Chat.tsx RT Safety] New message detected:', payload);
          
          const newMessage = payload.new as ChatMessage;
          
          // Check if it's a safety message (either system or assistant)
          if (newMessage.metadata?.isSystemSafetyResponse === true || 
              newMessage.metadata?.isSafetyResponse === true) {
            console.log('[Chat.tsx RT Safety] Confirmed safety message:', newMessage.message_id);
            handleRealtimeMessage(newMessage);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Chat.tsx RT Safety] Subscription status:', status);
      });
    
    return () => {
      console.log('[Chat.tsx RT Safety] Cleaning up safety message subscription');
      supabase.removeChannel(safetyChannel);
    };
  }, [roomId, userId, supabase, handleRealtimeMessage, scrollToBottom]);
  
  // Also subscribe to the broadcast channel used by monitoring.ts
  useEffect(() => {
    if (!userId) return;
    
    const broadcastChannel = supabase
      .channel(`safety-alert-${userId}`)
      .on('broadcast', { event: 'safety-message' }, (payload) => {
        const { room_id, message_id, chatbot_id } = payload.payload || {};
        
        // Only process if it's for this room and chatbot
        if (room_id === roomId && (!chatbot_id || chatbot_id === chatbot?.chatbot_id)) {
          // Fetch the specific safety message if we have the ID
          if (message_id) {
            fetchSafetyMessages(message_id);
          } else {
            fetchSafetyMessages();
          }
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(broadcastChannel);
    };
  }, [userId, roomId, chatbot?.chatbot_id, supabase, fetchSafetyMessages]);
  
  // IMPORTANT: NO POLLING - Using real-time subscriptions only for safety messages
  // The safety message delivery is handled by:
  // 1. Postgres changes subscription (lines 906-943)
  // 2. Broadcast channel subscription (lines 945-974)
  // 3. fetchSafetyMessages is ONLY called when broadcasts are received, NOT on mount
  // 
  // Safety messages should ONLY appear in the chat where the concerning content was detected,
  // not in new chat instances or when switching between chatbots
  

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !userId || !chatbot?.chatbot_id || !roomId) return;
    setIsLoading(true); setError(null);

    // Track user activity
    lastUserMessageTimeRef.current = Date.now();
    resetInactivityTimer();

    // Check for potential safety trigger keywords before sending
    const potentialSafetyTrigger = initialSafetyCheck(content.trim());
    
    // --- OPTIMISTIC UPDATE WITH TRACKING FLAG ---
    const tempOptimisticLocalId = `local-user-${Date.now()}`;
    const optimisticUserMessage: ChatMessage = {
      message_id: tempOptimisticLocalId,
      room_id: roomId, user_id: userId, role: 'user', content: content.trim(),
      created_at: new Date().toISOString(),
      metadata: { 
        chatbotId: chatbot.chatbot_id, 
        isOptimistic: true,
        optimisticContent: content.trim(), // Track the content for deduplication
        potentialSafetyTrigger: potentialSafetyTrigger // Flag for potential safety concerns
      }
    };
    setMessages(prev => [...prev, optimisticUserMessage].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    setTimeout(scrollToBottom, 50);
    // --- END OPTIMISTIC UPDATE ---

    try {
        // Check if using direct access via URL
        const uidFromUrl = searchParams?.get('uid');
        let url = uidFromUrl && uidFromUrl === userId
          ? `/api/chat/direct-access?roomId=${roomId}&userId=${userId}`
          : `/api/chat/${roomId}`;
          
        // Add instanceId to URL parameter if available (for GET requests)
        if (instanceId) {
          url += `${url.includes('?') ? '&' : '?'}instanceId=${instanceId}`;
          console.log(`[Chat.tsx] Added instanceId parameter to URL: ${instanceId}`);
        } else {
          console.log(`[Chat.tsx] No instanceId available for URL parameters`);
        }

        console.log(`[Chat.tsx] Sending message to: ${url}`);
        
        // Critical check to ensure we have an instance ID for students
        // Log explicit warning if it's missing and should be present
        if (!instanceId && window.location.pathname.startsWith('/chat/')) {
          console.warn(`[Chat.tsx] WARNING: No instanceId when sending message. This may cause shared chat issues!`);
        }
        
        // Add direct access headers if using URL parameters
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add direct access headers if using URL parameters
        if (uidFromUrl && uidFromUrl === userId) {
          console.log(`[Chat.tsx] Adding direct access headers with user ID: ${userId}`);
          headers['x-direct-access-user-id'] = userId;
        }
        
        // Add country code for safety message localization if provided
        console.log(`[Chat.tsx] Country code prop value:`, countryCode);
        if (countryCode) {
          console.log(`[Chat.tsx] Adding country code to headers: ${countryCode}`);
          headers['x-country-code'] = countryCode;
        } else {
          console.log(`[Chat.tsx] No country code provided - safety messages will use DEFAULT`);
        }
        
        console.log(`[Chat.tsx] Request payload:`, {
          content: content.trim().substring(0, 50),
          chatbot_id: chatbot.chatbot_id,
          country_code: detectedCountryCode || null
        });
        
        // Create a reader to process the streamed response
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            content: content.trim(), 
            chatbot_id: chatbot.chatbot_id, 
            model: chatbot.model,
            instance_id: instanceId,
            country_code: detectedCountryCode || null  // Include country code in body if available
          }),
          credentials: 'include'
        });

        if (!response.ok) {
            // Try to extract error details from response with enhanced error handling and diagnostics
            try {
              const errorText = await response.text();
              console.error(`[Chat.tsx] API error response (${response.status}):`, errorText);
              
              // Log additional diagnostic information for server errors
              console.error(`[Chat.tsx] Detailed error diagnostics:`, {
                status: response.status,
                statusText: response.statusText,
                url: url,
                responseHeaders: Object.fromEntries([...response.headers.entries()]),
                responseSize: errorText?.length || 0,
                requestPayload: {
                  content: content.trim().length > 100 ? `${content.trim().substring(0, 100)}...` : content.trim(),
                  contentLength: content.trim().length,
                  chatbotId: chatbot?.chatbot_id,
                  modelUsed: chatbot?.model,
                  instanceId: instanceId
                }
              });
              
              let errorMessage = `API error: ${response.status}`;
              
              // For 500 errors, provide a more user-friendly message
              if (response.status === 500) {
                errorMessage = `Server error (500). There might be an issue with the AI service. Please try again in a few moments.`;
              }
              
              // Try to parse the error response as JSON for more details
              try {
                const errorData = JSON.parse(errorText);
                console.error(`[Chat.tsx] Parsed error details:`, errorData);
                
                // Handle daily limit reached (429 error)
                if (response.status === 429 && errorData.error === "DAILY_LIMIT_REACHED") {
                  console.log("[Chat.tsx] Daily limit reached");
                  
                  // Remove the optimistic message
                  setMessages(prev => prev.filter(m => m.message_id !== tempOptimisticLocalId));
                  
                  // Set the reset time and show modal
                  if (errorData.resetTime) {
                    setDailyLimitResetTime(new Date(errorData.resetTime));
                  }
                  // Daily limit reached - continue anyway for open source version
                  
                  return; // Exit early, no need to show error toast
                }
                
                // Handle content filtering (400 error with "Message blocked")
                if (response.status === 400 && errorData.error === "Message blocked") {
                  console.log("[Chat.tsx] Content filter triggered - showing friendly message");
                  
                  // Remove the optimistic message
                  setMessages(prev => prev.filter(m => m.message_id !== tempOptimisticLocalId));
                  
                  // Use the message from the server directly
                  const contentFilterMessage = errorData.message || 'For your safety, your message was blocked. Please don\'t share personal information.';
                  
                  // Use the server's message ID if provided
                  const filterMessage: ChatMessage = {
                    message_id: errorData.systemMessageId || `filter-${Date.now()}`,
                    room_id: roomId,
                    user_id: userId,
                    role: 'system',
                    content: contentFilterMessage,
                    created_at: new Date().toISOString(),
                    metadata: {
                      isContentFilter: true,
                      isContentFilterMessage: true, // Add both flags to ensure display
                      isSystemMessage: true,
                      filterReason: errorData.reason,
                      chatbotId: chatbot.chatbot_id
                    }
                  };
                  
                  setMessages(prev => {
                    const updated = [...prev, filterMessage];
                    console.log('[Chat.tsx] Adding content filter message to state:', {
                      messageId: filterMessage.message_id,
                      totalMessages: updated.length,
                      metadata: filterMessage.metadata
                    });
                    return updated;
                  });
                  setIsLoading(false);
                  
                  // Scroll after a brief delay to ensure message is rendered
                  setTimeout(() => {
                    scrollToBottom();
                    console.log('[Chat.tsx] Content filter message should now be visible');
                  }, 100);
                  
                  // Don't fetch messages immediately - the message is already in state
                  // The server message will be fetched on next regular fetch if needed
                  
                  return; // Skip normal error handling
                }
                
                // Handle AI moderation messages (similar to content filter)
                if (response.status === 400 && errorData.error === "Message blocked" && errorData.severity) {
                  console.log("[Chat.tsx] AI moderation triggered - showing message");
                  
                  // Remove the optimistic message
                  setMessages(prev => prev.filter(m => m.message_id !== tempOptimisticLocalId));
                  
                  // Use the message from the server
                  const moderationMessage = errorData.message || 'This message was blocked by our safety system.';
                  
                  const aiModMessage: ChatMessage = {
                    message_id: errorData.systemMessageId || `moderation-${Date.now()}`,
                    room_id: roomId,
                    user_id: userId,
                    role: 'system',
                    content: moderationMessage,
                    created_at: new Date().toISOString(),
                    metadata: {
                      isAIModerationMessage: true,
                      isSystemMessage: true,
                      moderationReason: errorData.reason,
                      moderationSeverity: errorData.severity,
                      chatbotId: chatbot.chatbot_id
                    }
                  };
                  
                  setMessages(prev => [...prev, aiModMessage]);
                  setIsLoading(false);
                  
                  setTimeout(() => {
                    scrollToBottom();
                    console.log('[Chat.tsx] Added AI moderation message to UI:', aiModMessage.message_id);
                  }, 100);
                  
                  return; // Skip normal error handling
                }
                
                // If we have a specific error message from the server, use it
                if (errorData.error || errorData.message) {
                  errorMessage = errorData.error || errorData.message || errorMessage;
                }
                
                // Handle safety intervention from the server
                if (errorData.type === "safety_intervention_triggered") {
                  console.log("[Chat.tsx] Safety intervention detected - showing placeholder");
                  
                  // Remove the optimistic message
                  setMessages(prev => prev.filter(m => m.message_id !== tempOptimisticLocalId));
                  
                  // Add a placeholder for the safety message
                  const safetyPlaceholder: ChatMessage = {
                    message_id: `safety-placeholder-${Date.now()}`,
                    room_id: roomId,
                    user_id: userId,
                    role: 'system',
                    content: 'Processing safety check...',
                    created_at: new Date().toISOString(),
                    metadata: {
                      isSafetyPlaceholder: true,
                      isSystemSafetyResponse: true,
                      chatbotId: chatbot.chatbot_id
                    }
                  };
                  
                  setMessages(prev => [...prev, safetyPlaceholder]);
                  setIsLoading(false);
                  setTimeout(scrollToBottom, 50);
                  
                  // Safety message will be delivered via real-time subscriptions
                  console.log('[Chat.tsx] Safety intervention triggered. Waiting for real-time safety message delivery...');
                  return; // Skip normal error handling
                }
              } catch (parseError) {
                console.warn('[Chat.tsx] Error parsing error response:', parseError);
              }
              
              throw new Error(errorMessage);
            } catch (readError) {
              throw new Error(`API error: ${response.status} - Could not read error details`);
            }
        }

        // Create a temporary placeholder for the assistant's response
        const tempAssistantId = `local-assistant-${Date.now()}`;
        const placeholderMessage: ChatMessage = {
          message_id: tempAssistantId,
          room_id: roomId,
          user_id: userId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
          metadata: {
            chatbotId: chatbot.chatbot_id,
            isStreaming: true
          }
        };
        
        // Add placeholder message to show the assistant's response is coming
        setMessages(prev => [...prev, placeholderMessage]);
        setTimeout(scrollToBottom, 50);
        
        // Check for non-streaming responses (like assessment_pending)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // This is a JSON response, not a stream
          const jsonResponse = await response.json();
          
          console.log('[Chat.tsx] Received JSON response:', jsonResponse);
          
          // Handle assessment_pending response
          if (jsonResponse.type === 'assessment_pending') {
            // Remove the placeholder message
            setMessages(prev => prev.filter(m => m.message_id !== tempAssistantId));
            
            // Add the thank you message
            const thankYouMessage: ChatMessage = {
              message_id: `assessment-thank-you-${Date.now()}`,
              room_id: roomId,
              user_id: userId,
              role: 'assistant',
              content: jsonResponse.message || 'Thank you for submitting your assessment. Your responses are being evaluated and feedback will appear here shortly.',
              created_at: new Date().toISOString(),
              metadata: {
                chatbotId: chatbot.chatbot_id,
                isAssessmentResponse: true
              }
            };
            
            setMessages(prev => [...prev, thankYouMessage]);
            setIsLoading(false);
            setTimeout(scrollToBottom, 100);
            
            // The actual assessment feedback will come through later via the assessment processing
            return;
          }
          
          // For other JSON responses, create a message from the content
          if (jsonResponse.content || jsonResponse.message) {
            const responseContent = jsonResponse.content || jsonResponse.message;
            setMessages(prev => {
              const updated = [...prev];
              const index = updated.findIndex(m => m.message_id === tempAssistantId);
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  content: responseContent,
                  metadata: { ...updated[index].metadata, isStreaming: false }
                };
              }
              return updated;
            });
            setIsLoading(false);
            setTimeout(scrollToBottom, 100);
            return;
          }
        }
        
        // Start processing the stream
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let assistantResponse = '';
          let pendingUpdate = '';
          
          // Immediate update function for real-time streaming
          const updateMessage = () => {
            setMessages(prev => {
              const updated = [...prev];
              const index = updated.findIndex(m => m.message_id === tempAssistantId);
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  content: assistantResponse
                };
              }
              return updated;
            });
          };
          
          // Use requestAnimationFrame for smoother updates
          let animationFrameId: number | null = null;
          const scheduleUpdate = () => {
            if (animationFrameId) return;
            
            animationFrameId = requestAnimationFrame(() => {
              updateMessage();
              animationFrameId = null;
              
              // Auto-scroll but not too aggressively
              if (messagesListRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = messagesListRef.current;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                if (isNearBottom) {
                  messagesListRef.current.scrollTop = scrollHeight;
                }
              }
            });
          };
          
          let streamError: Error | null = null;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Process the chunk
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
              
              for (const line of lines) {
                try {
                  const dataContent = line.substring(5).trim();
                  if (dataContent === '[DONE]') continue;
                  
                  const parsed = JSON.parse(dataContent);
                  
                  // Handle KnowledgeBook responses with citations
                  if (parsed.citations) {
                    // This is a KnowledgeBook response with content and citations
                    assistantResponse = parsed.content || '';
                    
                    // Update the message with citations
                    setMessages(prev => {
                      const updated = [...prev];
                      const index = updated.findIndex(m => m.message_id === tempAssistantId);
                      if (index !== -1) {
                        updated[index] = {
                          ...updated[index],
                          content: assistantResponse,
                          citations: parsed.citations,
                          confidence_score: parsed.confidence,
                          metadata: {
                            ...updated[index].metadata,
                            isKnowledgeBook: true
                          }
                        };
                      }
                      return updated;
                    });
                  } else {
                    // Handle regular streaming format
                    const piece = parsed.content || parsed.choices?.[0]?.delta?.content;
                    
                    if (typeof piece === 'string') {
                      assistantResponse += piece;
                      
                      // Update immediately for every chunk
                      scheduleUpdate();
                    } else if (piece !== undefined) {
                      console.warn('[Chat.tsx] Unexpected content format:', piece, 'Full parsed:', parsed);
                    }
                  }
                } catch (e) {
                  console.warn('[Chat.tsx] Stream parse error:', e);
                }
              }
            }
          } catch (error) {
            streamError = error as Error;
            console.error('[Chat.tsx] Stream processing error:', streamError);
            
            // Log enhanced diagnostics for stream processing errors
            console.error('[Chat.tsx] Stream processing diagnostic details:', {
              error: streamError?.toString(),
              responseUrl: url,
              responseStatus: response.status,
              chatbotId: chatbot.chatbot_id,
              model: chatbot.model,
              partialResponse: assistantResponse.length > 0 ? 
                `${assistantResponse.substring(0, 100)}${assistantResponse.length > 100 ? '...' : ''}` : 'NO_CONTENT',
              responsePartialLength: assistantResponse.length,
              timestamp: new Date().toISOString()
            });
            
            // If we got some partial content, keep it with an error indicator
            if (assistantResponse.length > 0) {
              setMessages(prev => {
                const updated = [...prev];
                const index = updated.findIndex(m => m.message_id === tempAssistantId);
                if (index !== -1) {
                  updated[index] = {
                    ...updated[index],
                    content: assistantResponse + "\n\n[Message interrupted due to connection error]",
                    metadata: { 
                      ...updated[index].metadata, 
                      isStreaming: false,
                      streamInterrupted: true,
                      errorDetails: streamError?.toString() || 'Unknown stream error'
                    }
                  };
                }
                return updated;
              });
            } else {
              // Remove the placeholder completely if we didn't get any content
              setMessages(prev => prev.filter(m => m.message_id !== tempAssistantId));
              
              // Set a user-friendly error message
              setError("Connection interrupted. Please try sending your message again.");
            }
          } finally {
            // Clean up the animation frame
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
            }
            
            // Final update to ensure we show the complete response
            if (assistantResponse.length > 0) {
              setMessages(prev => {
                const updated = [...prev];
                const index = updated.findIndex(m => m.message_id === tempAssistantId);
                if (index !== -1) {
                  updated[index] = {
                    ...updated[index],
                    content: assistantResponse,
                    metadata: { ...updated[index].metadata, isStreaming: false }
                  };
                }
                return updated;
              });
              
              // Final scroll to bottom after streaming completes
              setTimeout(scrollToBottom, 50);
            }
          }
        }
    } catch (err) {
        console.error('[Chat.tsx] Chat send/receive error:', err);
        
        // Enhanced error logging with more context
        console.error('[Chat.tsx] Detailed error diagnostics:', {
          errorType: err?.constructor?.name || typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : 'No stack trace available',
          chatInfo: {
            chatbotId: chatbot?.chatbot_id,
            model: chatbot?.model,
            roomId: roomId,
            instanceId: instanceId,
            messageContentLength: content?.trim()?.length || 0
          },
          timestamp: new Date().toISOString()
        });
        
        // Create a more user-friendly error message based on the error type
        let errorMsg = '';
        
        // Improved error handling - show specific errors for different issues
        if (err instanceof Error) {
          // Show the error message from the server directly
          errorMsg = err.message || 'An error occurred. Please try again.';
          
          // Log the original error for debugging
          console.error('[Chat.tsx] Original error message:', err.message);
        } else {
          // Fallback for non-Error objects
          errorMsg = 'Failed to send message. Please try again.';
        }
        
        // Update the UI to show the error
        setError(errorMsg);
        
        // Mark the optimistic message as failed with a specific error
        setMessages(prev => prev.map(m => 
            m.message_id === tempOptimisticLocalId ? 
            {
              ...m, 
              metadata: {
                ...m.metadata, 
                error: errorMsg, 
                isOptimistic: false,
                errorDetails: err instanceof Error ? err.message : String(err),
                errorTime: new Date().toISOString()
              }
            } : m 
        ));
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleSubmitAssessment = async () => {
    if (isLoading || isSubmittingAssessment || !userId || !chatbot?.chatbot_id || !roomId) return;
    setIsSubmittingAssessment(true);
    
    try {
      await handleSendMessage(ASSESSMENT_TRIGGER_COMMAND);
    } catch (err) {
      console.error('[Chat.tsx] Assessment submission error:', err);
      // Properly handle the error - ensure it's not an Event object
      let errorMsg = 'Failed to submit assessment';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMsg = String(err.message);
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
      
      // Add an error message to the chat
      const errorMessage: ChatMessage = {
        message_id: `assessment-error-${Date.now()}`,
        room_id: roomId,
        user_id: userId,
        role: 'system',
        content: 'Failed to submit assessment. Please try again or contact your teacher if the problem persists.',
        created_at: new Date().toISOString(),
        metadata: {
          chatbotId: chatbot.chatbot_id,
          isAssessmentError: true
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmittingAssessment(false);
    }
  };
  
  // Function to handle clearing the chat
  const handleClearChat = () => {
    // If there are no messages, don't do anything
    if (messages.length === 0) return;
    
    // Ask for confirmation before clearing
    if (window.confirm('Are you sure you want to clear all messages? This will only clear your local view of the conversation.')) {
      // Keep only welcome message if present
      const welcomeMessage = messages.find(msg => msg.metadata?.isWelcomeMessage);
      
      if (welcomeMessage) {
        // If there's a welcome message, keep only that
        setMessages([welcomeMessage]);
      } else {
        // Otherwise clear all messages
        setMessages([]);
      }
      
      console.log('[Chat.tsx] Chat cleared by user');
    }
  };

  // Function to add all messages to notebook
  const [isAddingToNotebook, setIsAddingToNotebook] = useState(false);
  
  // Toast management
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
  };
  
  const handleAddAllToNotebook = async () => {
    try {
      setIsAddingToNotebook(true);
      
      // Filter messages to only include user and assistant messages
      const messagesToSave = messages.filter(msg => 
        (msg.role === 'user' || msg.role === 'assistant') && 
        msg.content && 
        msg.content.trim() !== ''
      );
      
      if (messagesToSave.length === 0) {
        showToast('No messages to save to notebook.', 'warning');
        return;
      }
      
      console.log('[Chat] Adding all messages to notebook:', messagesToSave.length);
      
      // Create payload for bulk save
      const payload = {
        chatbot_id: chatbot.chatbot_id,
        chatbot_name: chatbot.name,
        room_id: roomId,
        messages: messagesToSave.map(msg => ({
          message_id: msg.message_id,
          message_content: msg.content,
          message_role: msg.role,
          created_at: msg.created_at
        }))
      };
      
      // Call bulk save API
      const response = await fetch('/api/student/notebooks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save messages');
      }
      
      const result = await response.json();
      
      // Show success message
      showToast(`Successfully saved ${result.saved_count || messagesToSave.length} messages to your notebook!`, 'success');
      
    } catch (error) {
      console.error('[Chat] Error saving all messages to notebook:', error);
      showToast('Failed to save messages to notebook. Please try again.', 'error');
    } finally {
      setIsAddingToNotebook(false);
    }
  };

  // Function to handle prompt starter clicks
  const handlePromptStarterClick = (starter: string) => {
    if (starter && !isLoading) {
      handleSendMessage(starter);
    }
  };
  
  return (
    <ChatContainer $isReadingRoom={isReadingRoom}>
      {fetchError && ( <ErrorContainer variant="error"> {`Error loading: ${fetchError}`} <ModernButton onClick={() => fetchMessages()} size="small" variant="ghost">Retry</ModernButton> </ErrorContainer> )}
      {messages.length > 0 && (
        <ChatHeader>
          <ChatbotTitle>{chatbot.name}</ChatbotTitle>
          <ChatActions>
            <IconButton
              onClick={handleAddAllToNotebook}
              disabled={isAddingToNotebook || messages.filter(m => m.role === 'user' || m.role === 'assistant').length === 0}
              title="Save all messages to notebook"
            >
              <FiBookmark />
            </IconButton>
          </ChatActions>
        </ChatHeader>
      )}
      <MessagesList ref={messagesListRef} $isReadingRoom={isReadingRoom}>
        {isFetchingMessages && messages.length === 0 ? ( 
          <LoadingIndicator><LoadingSpinner /> Loading...</LoadingIndicator> 
        ) : !isFetchingMessages && messages.length === 0 && !fetchError ? (
          <EmptyState>
            <h3>Start with {chatbot.name}</h3>
            <p>History will appear here.</p>
            {chatbot.bot_type === 'assessment' && <p>Click the Submit Assessment button when you&apos;re ready to be assessed.</p>}
          </EmptyState>
        ) : (
          messages
            .filter(message => {
              // Show all user and assistant messages
              if (message.role === 'user' || message.role === 'assistant') {
                return true;
              }
              
              // For system messages, show safety responses, placeholders, and content filters
              if (message.role === 'system') {
                const shouldShow = message.metadata?.isSystemSafetyResponse === true || 
                       message.metadata?.isSafetyPlaceholder === true ||
                       message.metadata?.isContentFilter === true ||
                       message.metadata?.isContentFilterMessage === true ||
                       message.metadata?.isAIModerationMessage === true ||
                       message.metadata?.isSystemMessage === true;
                
                // Debug logging for system messages
                if (!shouldShow && message.content) {
                  console.log('[Chat.tsx] Filtering out system message:', {
                    id: message.message_id,
                    content: message.content.substring(0, 50),
                    metadata: message.metadata
                  });
                }
                
                return shouldShow;
              }
              
              return false;
            })
            .map((message) => {
              // Check if this is an OLD STYLE safety message (system message with red border)
              const isOldStyleSafetyMessage = message.role === 'system' && 
                                      message.metadata?.isSystemSafetyResponse === true &&
                                      message.metadata?.safetyMessageVersion !== '3.0';
              
              // Render different component based on message type
              if (isOldStyleSafetyMessage) {
                // Only use the red SafetyMessage component for old messages
                return (
                  <SafetyMessage 
                    key={message.message_id} 
                    message={message}
                    countryCode={message.metadata?.countryCode as string | undefined}
                  />
                );
              }
              
              // Otherwise render regular chat message (including new safety responses)
              return (
                <ChatMessageComponent 
                  key={message.message_id} 
                  message={message} 
                  chatbotName={chatbot.name}
                  chatbotId={chatbot.chatbot_id}
                  userId={userId || undefined}
                  directAccess={!!searchParams?.get('direct') || directMode}
                />
              );
            })
        )}
        {isLoading && (
          <ThinkingIndicator>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7C11.4696 7 10.9609 7.21071 10.5858 7.58579C10.2107 7.96086 10 8.46957 10 9V12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12V9C14 8.46957 13.7893 7.96086 13.4142 7.58579C13.0391 7.21071 12.5304 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {chatbot.name} is thinking...
          </ThinkingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesList>
      
      {/* Show prompt starters above chat input when appropriate */}
      {!isFetchingMessages && 
       ((messages.length === 0) || 
        (messages.length === 1 && messages[0].metadata?.isWelcomeMessage)) &&
       chatbot.prompt_starters && 
       chatbot.prompt_starters.length > 0 && (
        <PromptStartersContainer>
          <PromptStartersTitle>Try asking:</PromptStartersTitle>
          {chatbot.prompt_starters.filter(starter => starter && starter.trim()).map((starter, index) => (
            <PromptStarterButton
              key={index}
              onClick={() => handlePromptStarterClick(starter)}
              disabled={isLoading}
            >
              {starter}
            </PromptStarterButton>
          ))}
        </PromptStartersContainer>
      )}
      
      <StyledChatInputContainer $isReadingRoom={isReadingRoom}>
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
          error={error} 
          onClearError={() => setError(null)}
          onClear={messages.length > 0 ? handleClearChat : undefined}
        />
      </StyledChatInputContainer>
      
      <DisclaimerText>
        Skolr can make mistakes. Always check responses.
      </DisclaimerText>
      
      {chatbot.bot_type === 'assessment' && (
        <AssessmentSection>
          <AssessmentInfo>
            When you're ready, submit your conversation for assessment. Make sure you've answered all questions fully.
          </AssessmentInfo>
          <ModernButton 
            onClick={handleSubmitAssessment} 
            disabled={isLoading || isSubmittingAssessment || messages.filter(m => m.role === 'user').length < 2}
            variant="primary"
            size="medium"
          >
            {isSubmittingAssessment ? 'Submitting Assessment...' : 'Submit for Assessment'}
          </ModernButton>
        </AssessmentSection>
      )}
      
      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          isVisible={!!toastMessage}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      {/* Daily limit modal removed for open source version */}
    </ChatContainer>
  );
}