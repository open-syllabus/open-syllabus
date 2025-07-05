// Modern confirmation modal component
'use client';

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiTrash2, FiCheck } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Modal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.lg};
  right: ${({ theme }) => theme.spacing.lg};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const IconWrapper = styled.div<{ $variant: 'danger' | 'warning' | 'info' }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${({ theme }) => theme.spacing.md} auto;
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'danger': return theme.colors.status.danger + '20';
      case 'warning': return theme.colors.status.warning + '20';
      case 'info': return theme.colors.brand.primary + '20';
      default: return theme.colors.brand.primary + '20';
    }
  }};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme, $variant }) => {
      switch ($variant) {
        case 'danger': return theme.colors.status.danger;
        case 'warning': return theme.colors.status.warning;
        case 'info': return theme.colors.brand.primary;
        default: return theme.colors.brand.primary;
      }
    }};
  }
`;

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const Message = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  text-align: center;
`;

const Footer = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: flex-end;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
  }
`;

const getDefaultIcon = (variant: 'danger' | 'warning' | 'info') => {
  switch (variant) {
    case 'danger': return <FiTrash2 />;
    case 'warning': return <FiAlertTriangle />;
    case 'info': return <FiCheck />;
    default: return <FiCheck />;
  }
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <Modal
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Header>
              <CloseButton onClick={onClose} aria-label="Close">
                <FiX />
              </CloseButton>
              
              <IconWrapper $variant={variant}>
                {icon || getDefaultIcon(variant)}
              </IconWrapper>
              
              <Title>{title}</Title>
              <Message>{message}</Message>
            </Header>
            
            <Footer>
              <ModernButton
                variant="ghost"
                onClick={onClose}
              >
                {cancelText}
              </ModernButton>
              <ModernButton
                variant={variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
              >
                {confirmText}
              </ModernButton>
            </Footer>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
}