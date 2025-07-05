// Animated loading components
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import LightbulbLoader from './LightbulbLoader';

// Export lightbulb loader as the default pulse loader
export const PulseLoader: React.FC = () => <LightbulbLoader size="large" />;

// Export lightbulb loader as the default dot loader
export const DotLoader: React.FC = () => <LightbulbLoader size="medium" />;

// Skeleton loader for content
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

export const SkeletonLoader = styled.div<{ 
  width?: string; 
  height?: string;
  borderRadius?: string;
}>`
  display: inline-block;
  width: ${({ width = '100%' }) => width};
  height: ${({ height = '20px' }) => height};
  background-color: ${({ theme }) => theme.colors.ui.background};
  background-image: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.ui.background} 0px,
    ${({ theme }) => theme.colors.ui.backgroundDark} 20px,
    ${({ theme }) => theme.colors.ui.background} 40px
  );
  background-size: 200px 100%;
  background-repeat: no-repeat;
  border-radius: ${({ borderRadius = '4px' }) => borderRadius};
  animation: ${shimmer} 1.5s infinite;
`;

// Loading overlay with glassmorphism
const LoadingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
`;

const LoadingContent = styled(motion.div)`
  text-align: center;
  
  p {
    margin-top: 16px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 500;
  }
`;

interface FullPageLoaderProps {
  message?: string;
  variant?: 'pulse' | 'dots' | 'lightbulb';
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ 
  message = 'Loading...', 
  variant = 'lightbulb' 
}) => {
  return (
    <LoadingOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingContent
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <LightbulbLoader size="large" />
        <p>{message}</p>
      </LoadingContent>
    </LoadingOverlay>
  );
};

// Inline spinner - now a wrapper for LightbulbLoader
interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 20 }) => {
  const loaderSize = size <= 20 ? 'small' : size <= 32 ? 'medium' : 'large';
  return <LightbulbLoader size={loaderSize} />;
};