'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { Container } from '@/styles/StyledComponents';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LoadingPage = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  position: relative;
  
  /* Modern animated background */
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(76, 190, 243, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(152, 93, 215, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 40% 20%, rgba(200, 72, 175, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
`;

const LoadingContent = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 8px 32px rgba(152, 93, 215, 0.1);
  border: 1px solid rgba(152, 93, 215, 0.1);
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Message = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`;

export default function StudentLoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Just redirect to the student-access page
    setTimeout(() => {
      router.push('/student-access');
    }, 500); // Reduced delay for faster transition
  }, [router]);
  
  return (
    <LoadingPage>
      <LoadingContent>
        <LoadingSpinner size="large" />
        <Message>
          Taking you to the student login page...
        </Message>
      </LoadingContent>
    </LoadingPage>
  );
}