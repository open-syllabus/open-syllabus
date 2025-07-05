'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const TooltipContainer = styled(motion.div)<{ $position: { top: number; left: number } }>`
  position: fixed;
  top: ${props => props.$position.top}px;
  left: ${props => props.$position.left}px;
  z-index: 10000;
  pointer-events: none;
  
  /* Hide when modal is open */
  .modal-open & {
    opacity: 0;
    pointer-events: none;
  }
`;

const TooltipContent = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border: 2px solid ${({ theme }) => theme.colors.brand.primary};
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 320px;
  pointer-events: auto;
`;

const TooltipArrow = styled.div<{ $placement: 'top' | 'bottom' | 'left' | 'right' }>`
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  
  ${props => {
    switch (props.$placement) {
      case 'top':
        return `
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px 10px 0 10px;
          border-color: ${props.theme.colors.brand.primary} transparent transparent transparent;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: -8px;
            border-style: solid;
            border-width: 8px 8px 0 8px;
            border-color: ${props.theme.colors.ui.background} transparent transparent transparent;
          }
        `;
      case 'bottom':
        return `
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 0 10px 10px 10px;
          border-color: transparent transparent ${props.theme.colors.brand.primary} transparent;
          
          &::after {
            content: '';
            position: absolute;
            top: 2px;
            left: -8px;
            border-style: solid;
            border-width: 0 8px 8px 8px;
            border-color: transparent transparent ${props.theme.colors.ui.background} transparent;
          }
        `;
      case 'left':
        return `
          right: -10px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 10px 0 10px 10px;
          border-color: transparent transparent transparent ${props.theme.colors.brand.primary};
          
          &::after {
            content: '';
            position: absolute;
            right: 2px;
            top: -8px;
            border-style: solid;
            border-width: 8px 0 8px 8px;
            border-color: transparent transparent transparent ${props.theme.colors.ui.background};
          }
        `;
      case 'right':
        return `
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          border-width: 10px 10px 10px 0;
          border-color: transparent ${props.theme.colors.brand.primary} transparent transparent;
          
          &::after {
            content: '';
            position: absolute;
            left: 2px;
            top: -8px;
            border-style: solid;
            border-width: 8px 8px 8px 0;
            border-color: transparent ${props.theme.colors.ui.background} transparent transparent;
          }
        `;
    }
  }}
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

const Text = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 12px 0;
  line-height: 1.5;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface TooltipProps {
  selector: string;
  title: string;
  text: string;
  buttonText?: string;
  onButtonClick?: () => void;
  show: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

export function Tooltip({ 
  selector, 
  title, 
  text, 
  buttonText = 'Got it',
  onButtonClick,
  show, 
  placement = 'bottom',
  offset = 20
}: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissed state whenever show prop changes
    setDismissed(false);
  }, [show]);
  
  // Monitor for modal open state
  useEffect(() => {
    const checkModalState = () => {
      const hasModal = document.querySelector('[role="dialog"], .modal-backdrop, [data-modal="true"]');
      if (hasModal && !dismissed) {
        console.log('[Tooltip] Modal detected, auto-dismissing tooltip');
        setDismissed(true);
      }
    };
    
    // Check immediately and on DOM changes
    checkModalState();
    
    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [dismissed]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const calculatePosition = () => {
      const element = document.querySelector(selector);
      if (!element) {
        console.log('[Tooltip] Element not found for selector:', selector);
        return;
      }

      const bounds = element.getBoundingClientRect();
      const tooltipWidth = 320; // max-width
      const tooltipHeight = 150; // approximate
      
      let top = 0;
      let left = 0;
      let finalPlacement = placement;

      // Calculate initial position based on placement
      switch (placement) {
        case 'top':
          top = bounds.top - tooltipHeight - offset;
          left = bounds.left + bounds.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = bounds.bottom + offset;
          left = bounds.left + bounds.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = bounds.top + bounds.height / 2 - tooltipHeight / 2;
          left = bounds.left - tooltipWidth - offset;
          break;
        case 'right':
          top = bounds.top + bounds.height / 2 - tooltipHeight / 2;
          left = bounds.right + offset;
          break;
      }

      // Adjust if tooltip would go off screen
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      if (top < 10) {
        top = bounds.bottom + offset;
        finalPlacement = 'bottom';
      }
      if (top + tooltipHeight > window.innerHeight - 10) {
        top = bounds.top - tooltipHeight - offset;
        finalPlacement = 'top';
      }

      setPosition({ top, left });
      setActualPlacement(finalPlacement);
    };

    // Wait a bit before calculating to ensure element is rendered
    const timer = setTimeout(() => {
      calculatePosition();
    }, 300);

    // Recalculate on resize and scroll
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    // Also recalculate when element appears
    const observer = new MutationObserver(calculatePosition);
    observer.observe(document.body, { childList: true, subtree: true });

    // Set up interval to update position less frequently
    const updateInterval = setInterval(calculatePosition, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(updateInterval);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
      observer.disconnect();
    };
  }, [selector, show, placement, offset]);

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <TooltipContainer
          $position={position}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ 
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <TooltipContent>
            <TooltipArrow $placement={actualPlacement} />
            <Title>{title}</Title>
            <Text>{text}</Text>
            <Button onClick={() => {
              setDismissed(true);
              if (onButtonClick) onButtonClick();
            }}>{buttonText}</Button>
          </TooltipContent>
        </TooltipContainer>
      )}
    </AnimatePresence>
  );
}