// src/components/shared/LightbulbLoader.tsx
// Rotating lightbulb loader component
'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import Image from 'next/image';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
`;

const LoaderWrapper = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => 
    $size === 'small' ? '32px' : 
    $size === 'large' ? '64px' : 
    '48px'
  };
  height: ${({ $size }) => 
    $size === 'small' ? '32px' : 
    $size === 'large' ? '64px' : 
    '48px'
  };
  animation: 
    ${rotate} 2s linear infinite,
    ${pulse} 1.5s ease-in-out infinite;
`;

const LightbulbImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

interface LightbulbLoaderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function LightbulbLoader({ 
  size = 'medium',
  className 
}: LightbulbLoaderProps) {
  const dimensions = {
    small: 32,
    medium: 48,
    large: 64
  };

  return (
    <LoaderWrapper $size={size} className={className}>
      <LightbulbImage
        src="/images/lightbulb.png"
        alt="Loading..."
        width={dimensions[size]}
        height={dimensions[size]}
        priority
      />
    </LoaderWrapper>
  );
}

// Export a full page loader variant
const FullPageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 9999;
`;

const LoadingContent = styled.div`
  text-align: center;
  
  p {
    margin-top: 16px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 500;
    font-size: 16px;
  }
`;

interface FullPageLightbulbLoaderProps {
  message?: string;
}

export function FullPageLightbulbLoader({ 
  message = 'Loading...' 
}: FullPageLightbulbLoaderProps) {
  return (
    <FullPageWrapper>
      <LoadingContent>
        <LightbulbLoader size="large" />
        <p>{message}</p>
      </LoadingContent>
    </FullPageWrapper>
  );
}