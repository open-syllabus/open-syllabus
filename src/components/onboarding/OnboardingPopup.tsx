'use client';

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const PopupOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const PopupContent = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  padding: 32px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;
`;

const Text = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${props => props.$variant === 'primary' ? `
    background: ${props.theme.colors.brand.primary};
    color: white;
    
    &:hover {
      background: ${props.theme.colors.brand.primary};
      transform: translateY(-1px);
    }
  ` : `
    background: ${props.theme.colors.ui.backgroundLight};
    color: ${props.theme.colors.text.secondary};
    
    &:hover {
      background: ${props.theme.colors.ui.border};
      color: ${props.theme.colors.text.primary};
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

interface OnboardingPopupProps {
  show: boolean;
  onClose: () => void;
  title: string;
  text: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export function OnboardingPopup({
  show,
  onClose,
  title,
  text,
  primaryButtonText = 'Continue',
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick
}: OnboardingPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <PopupOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <PopupContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={onClose}>
              <FiX />
            </CloseButton>
            <Title>{title}</Title>
            <Text>{text}</Text>
            <ButtonGroup>
              {secondaryButtonText && (
                <Button $variant="secondary" onClick={onSecondaryClick || onClose}>
                  {secondaryButtonText}
                </Button>
              )}
              <Button $variant="primary" onClick={onPrimaryClick || onClose}>
                {primaryButtonText}
              </Button>
            </ButtonGroup>
          </PopupContent>
        </PopupOverlay>
      )}
    </AnimatePresence>
  );
}