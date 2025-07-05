'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';

// Define the steps in the onboarding process
export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  NAVIGATE_TO_STUDENTS = 'navigate_to_students',
  ADD_STUDENTS = 'add_students',
  UPLOAD_STUDENTS = 'upload_students',
  SELECT_ALL_STUDENTS = 'select_all_students',
  CREATE_ROOM = 'create_room',
  CREATE_SKOLR = 'create_skolr',
  COMPLETED = 'completed'
}

interface OnboardingContextType {
  currentStep: OnboardingStep;
  isOnboarding: boolean;
  isLoading: boolean;
  startOnboarding: () => void;
  completeStep: (step: OnboardingStep) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = 'teacher_onboarding_state';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.NOT_STARTED);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(ONBOARDING_KEY);
    console.log('[Onboarding] Loading saved state:', savedState);
    
    // Check if we're coming from teacher-onboarding page (new user setup)
    const urlParams = new URLSearchParams(window.location.search);
    const isFromOnboarding = urlParams.has('_t'); // teacher-onboarding adds timestamp
    
    console.log('[Onboarding] URL check:', { isFromOnboarding, url: window.location.href });
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('[Onboarding] Parsed state:', parsed);
        
        // Always use the saved state if available
        setCurrentStep(parsed.currentStep || OnboardingStep.NOT_STARTED);
        setIsOnboarding(parsed.isOnboarding || false);
        setIsLoading(false);
        
        console.log('[Onboarding] State loaded from localStorage:', {
          currentStep: parsed.currentStep,
          isOnboarding: parsed.isOnboarding
        });
        
        // If we're in an active onboarding flow, don't re-check
        if (parsed.isOnboarding && parsed.currentStep !== OnboardingStep.COMPLETED) {
          console.log('[Onboarding] Active onboarding flow detected, not re-checking user status');
          return;
        }
      } catch (error) {
        console.error('Error parsing onboarding state:', error);
        // If there's an error, check if new user
        checkIfNewUser();
      }
    } else {
      // No saved state or coming from teacher-onboarding - check if this is a new user
      console.log('[Onboarding] No saved state or from teacher-onboarding, checking if new user...');
      checkIfNewUser();
    }
  }, []);

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveToLocalStorage = useCallback(() => {
    const stateToSave = {
      currentStep,
      isOnboarding
    };
    console.log('[Onboarding] Saving state to localStorage:', stateToSave, 'Current URL:', window.location.pathname);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(stateToSave));
  }, [currentStep, isOnboarding]);
  
  // Save state to localStorage with debouncing
  useEffect(() => {
    // Don't save during initial load
    if (isLoading) return;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, 500);
    
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentStep, isOnboarding, isLoading, saveToLocalStorage]);

  const checkIfNewUser = async () => {
    try {
      console.log('[Onboarding] Checking if new user...');
      
      // If we're already in an onboarding flow, don't check again
      if (isOnboarding) {
        console.log('[Onboarding] Already in onboarding flow, skipping new user check');
        setIsLoading(false);
        return;
      }
      
      // Track if we successfully fetched all data
      let allFetchesSuccessful = true;
      
      // First check if we have students
      const studentsResponse = await fetch('/api/teacher/students');
      let hasStudents = false;
      if (studentsResponse.ok) {
        const data = await studentsResponse.json();
        hasStudents = data.students && data.students.length > 0;
        console.log('[Onboarding] Students check:', { hasStudents, count: data.students?.length || 0 });
      } else {
        console.log('[Onboarding] Students API error:', studentsResponse.status);
        allFetchesSuccessful = false;
      }
      
      // Then check if we have rooms
      const roomsResponse = await fetch('/api/teacher/rooms');
      let hasRooms = false;
      if (roomsResponse.ok) {
        const rooms = await roomsResponse.json();
        hasRooms = rooms.length > 0;
        console.log('[Onboarding] Rooms check:', { hasRooms, count: rooms.length });
      } else {
        console.log('[Onboarding] Rooms API error:', roomsResponse.status);
        allFetchesSuccessful = false;
      }
      
      // Then check if we have chatbots
      const chatbotsResponse = await fetch('/api/teacher/chatbots');
      let hasChatbots = false;
      if (chatbotsResponse.ok) {
        const chatbots = await chatbotsResponse.json();
        hasChatbots = chatbots.length > 0;
        console.log('[Onboarding] Chatbots check:', { hasChatbots, count: chatbots.length });
      } else {
        console.log('[Onboarding] Chatbots API error:', chatbotsResponse.status);
        allFetchesSuccessful = false;
      }
      
      // If any API calls failed, assume new user and start onboarding
      if (!allFetchesSuccessful) {
        console.log('[Onboarding] Some API calls failed - assuming new user and starting onboarding.');
        setCurrentStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
        setIsOnboarding(true);
        return;
      }
      
      // Determine onboarding state based on what the user has
      if (!hasStudents && !hasRooms && !hasChatbots) {
        // Brand new user - start from the beginning  
        console.log('[Onboarding] New user detected - no students, rooms, or chatbots. Starting onboarding.');
        setCurrentStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
        setIsOnboarding(true);
      } else if (hasStudents && !hasRooms) {
        // Has students but no rooms - continue from where they were
        console.log('[Onboarding] User has students but no rooms.');
        // Check if we're on the students page, which means they just uploaded students
        if (window.location.pathname === '/teacher-dashboard/students') {
          console.log('[Onboarding] On students page - continuing from SELECT_ALL_STUDENTS');
          setCurrentStep(OnboardingStep.SELECT_ALL_STUDENTS);
        } else {
          console.log('[Onboarding] Starting from CREATE_ROOM');
          setCurrentStep(OnboardingStep.CREATE_ROOM);
        }
        setIsOnboarding(true);
      } else if (hasRooms && !hasChatbots) {
        // Has rooms but no chatbots - start from chatbot creation
        console.log('[Onboarding] User has rooms but no chatbots. Starting from chatbot creation.');
        setCurrentStep(OnboardingStep.CREATE_SKOLR);
        setIsOnboarding(true);
      } else {
        // Existing user with everything - no onboarding needed
        console.log('[Onboarding] Existing user with complete setup - no onboarding needed');
        setCurrentStep(OnboardingStep.COMPLETED);
        setIsOnboarding(false);
      }
    } catch (error) {
      console.error('[Onboarding] Error checking if new user:', error);
      // On error, assume they're a new user and start onboarding
      // This is safer than skipping onboarding for new users
      console.log('[Onboarding] Due to error, starting onboarding to be safe');
      setCurrentStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
      setIsOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  };

  const startOnboarding = () => {
    setCurrentStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
    setIsOnboarding(true);
  };

  const completeStep = (step: OnboardingStep) => {
    console.log('[Onboarding] Completing step:', step, '- Current step:', currentStep);
    
    // Only progress if we're actually on the step being completed
    if (step !== currentStep) {
      console.log('[Onboarding] Step mismatch - ignoring completion. Expected:', currentStep, 'Got:', step);
      return;
    }
    
    // Move to the next step based on current step
    switch (step) {
      case OnboardingStep.NAVIGATE_TO_STUDENTS:
        console.log('[Onboarding] Moving to ADD_STUDENTS');
        setCurrentStep(OnboardingStep.ADD_STUDENTS);
        break;
      case OnboardingStep.ADD_STUDENTS:
        console.log('[Onboarding] Moving to UPLOAD_STUDENTS');
        setCurrentStep(OnboardingStep.UPLOAD_STUDENTS);
        break;
      case OnboardingStep.UPLOAD_STUDENTS:
        console.log('[Onboarding] Moving to SELECT_ALL_STUDENTS');
        setCurrentStep(OnboardingStep.SELECT_ALL_STUDENTS);
        break;
      case OnboardingStep.SELECT_ALL_STUDENTS:
        console.log('[Onboarding] Moving to CREATE_ROOM');
        setCurrentStep(OnboardingStep.CREATE_ROOM);
        break;
      case OnboardingStep.CREATE_ROOM:
        console.log('[Onboarding] Moving to CREATE_SKOLR');
        setCurrentStep(OnboardingStep.CREATE_SKOLR);
        break;
      case OnboardingStep.CREATE_SKOLR:
        console.log('[Onboarding] Onboarding completed!');
        setCurrentStep(OnboardingStep.COMPLETED);
        setIsOnboarding(false);
        break;
    }
  };

  const skipOnboarding = () => {
    setCurrentStep(OnboardingStep.COMPLETED);
    setIsOnboarding(false);
  };

  const resetOnboarding = () => {
    setCurrentStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
    setIsOnboarding(true);
  };

  return (
    <OnboardingContext.Provider value={{
      currentStep,
      isOnboarding,
      isLoading,
      startOnboarding,
      completeStep,
      skipOnboarding,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}