// src/components/shared/LoadingSpinner.tsx
// Updated: Uses rotating lightbulb loader by default
'use client';

import LightbulbLoader from './LightbulbLoader';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'dots' | 'spinner' | 'lightbulb';
}

// This component now acts as a wrapper that uses LightbulbLoader by default
export default function LoadingSpinner({ 
  size = 'medium', 
  variant = 'lightbulb' 
}: LoadingSpinnerProps) {
  // Always use the lightbulb loader
  return <LightbulbLoader size={size} />;
}