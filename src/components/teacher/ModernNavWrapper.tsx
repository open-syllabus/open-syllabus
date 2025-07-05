import React from 'react';
import { ModernNav } from './ModernNav';
import { useOnboarding } from '@/contexts/OnboardingContext';

// This wrapper component provides onboarding context to ModernNav
export const ModernNavWithOnboarding: React.FC = () => {
  const onboardingContext = useOnboarding();
  return <ModernNav onboardingContext={onboardingContext} />;
};

// This component is used when no onboarding context is available
export const ModernNavWithoutOnboarding: React.FC = () => {
  return <ModernNav onboardingContext={null} />;
};