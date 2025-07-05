'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
  }
  
  70% {
    box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
  }
  
  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
  }
`;

const HighlightOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  pointer-events: none;
`;

const HighlightBox = styled.div<{ $bounds: DOMRect }>`
  position: fixed;
  top: ${props => props.$bounds.top - 8}px;
  left: ${props => props.$bounds.left - 8}px;
  width: ${props => props.$bounds.width + 16}px;
  height: ${props => props.$bounds.height + 16}px;
  border: 3px solid #7C3AED;
  border-radius: 8px;
  background: rgba(124, 58, 237, 0.1);
  animation: ${pulse} 2s infinite;
  z-index: 9999;
  pointer-events: none;
`;

const CutoutSvg = styled.svg`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  pointer-events: none;
`;

interface HighlightProps {
  selector: string;
  children?: ReactNode;
  show: boolean;
  onClick?: () => void;
  cutout?: boolean;
}

export function Highlight({ selector, children, show, onClick, cutout = true }: HighlightProps) {
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!show) {
      console.log('[Highlight] Not showing highlight for selector:', selector);
      setBounds(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(selector);
      console.log('[Highlight] Looking for element:', selector, 'Found:', !!element);
      if (element) {
        const rect = element.getBoundingClientRect();
        console.log('[Highlight] Element bounds:', rect);
        setBounds(rect);
      } else {
        console.log('[Highlight] Element not found yet, will keep trying...');
      }
    };

    // Initial check
    findElement();

    // Set up observer for when element appears
    const observer = new MutationObserver(findElement);
    observer.observe(document.body, { childList: true, subtree: true });

    // Also check on resize and scroll to keep highlight stuck to element
    window.addEventListener('resize', findElement);
    window.addEventListener('scroll', findElement, true);

    // Try again after a short delay
    const retryTimer = setTimeout(findElement, 500);
    
    // Set up interval to continuously update position
    const updateInterval = setInterval(findElement, 100);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', findElement);
      window.removeEventListener('scroll', findElement, true);
      clearTimeout(retryTimer);
      clearInterval(updateInterval);
    };
  }, [selector, show]);

  if (!show || !bounds) return null;

  return (
    <>
      {cutout && (
        <CutoutSvg>
          <defs>
            <mask id="highlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={bounds.left - 8}
                y={bounds.top - 8}
                width={bounds.width + 16}
                height={bounds.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#highlight-mask)"
          />
        </CutoutSvg>
      )}
      <HighlightBox $bounds={bounds} onClick={onClick} />
      {children}
    </>
  );
}