// Simple toast notification component
'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';

interface ToastProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const ToastContainer = styled(motion.div)<{ $type: 'success' | 'error' | 'warning' | 'info' }>`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1100;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border-left: 4px solid ${({ theme, $type }) => {
    switch ($type) {
      case 'success': return theme.colors.status.success;
      case 'error': return theme.colors.status.danger;
      case 'warning': return theme.colors.status.warning;
      case 'info': return theme.colors.status.info;
      default: return theme.colors.status.info;
    }
  }};
  display: flex;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    min-width: none;
  }
`;

const IconWrapper = styled.div<{ $type: 'success' | 'error' | 'warning' | 'info' }>`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme, $type }) => {
      switch ($type) {
        case 'success': return theme.colors.status.success;
        case 'error': return theme.colors.status.danger;
        case 'warning': return theme.colors.status.warning;
        case 'info': return theme.colors.status.info;
        default: return theme.colors.status.info;
      }
    }};
  }
`;

const Content = styled.div`
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const getIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
  switch (type) {
    case 'success': return <FiCheckCircle />;
    case 'error': return <FiXCircle />;
    case 'warning': return <FiAlertCircle />;
    case 'info': return <FiInfo />;
    default: return <FiInfo />;
  }
};

export function Toast({ 
  isVisible, 
  onClose, 
  message, 
  type = 'info', 
  duration = 5000 
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <ToastContainer
          $type={type}
          initial={{ opacity: 0, x: 100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <IconWrapper $type={type}>
            {getIcon(type)}
          </IconWrapper>
          
          <Content>
            {message}
          </Content>
          
          <CloseButton onClick={onClose} aria-label="Close notification">
            <FiX />
          </CloseButton>
        </ToastContainer>
      )}
    </AnimatePresence>
  );
}