import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const TerminalTextWrapper = styled.span`
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;
  display: inline-block;
  position: relative;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.85em;
  font-weight: 600;
  letter-spacing: -0.02em;
  
  &::before {
    content: '> ';
    color: ${({ theme }) => theme.colors.brand.primary};
    opacity: 0.8;
    font-weight: 600;
  }
  
  &::after {
    content: '_';
    animation: ${blink} 1s infinite;
    color: ${({ theme }) => theme.colors.brand.primary};
    font-weight: 600;
    margin-left: 2px;
  }
`;

export default function TerminalText() {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Engaging Skolr Mode...';
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 100; // milliseconds per character
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, typingSpeed);
      } else {
        setTimeout(() => setIsComplete(true), 500);
      }
    };
    
    // Start typing after a short delay
    setTimeout(typeNextChar, 500);
  }, []);
  
  return (
    <TerminalTextWrapper style={{ opacity: isComplete ? 0.95 : 1 }}>
      {displayText}
    </TerminalTextWrapper>
  );
}
