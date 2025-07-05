'use client';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { ModernButton } from '@/components/shared/ModernButton';
import styled from 'styled-components';

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 24px;
  color: #111827;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #E5E7EB;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  font-weight: 600;
  color: #374151;
`;

const Value = styled.span`
  color: #6B7280;
  font-family: monospace;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

export default function OnboardingDebugPage() {
  const { currentStep, isOnboarding, isLoading, startOnboarding, completeStep, skipOnboarding, resetOnboarding } = useOnboarding();
  
  const clearLocalStorage = () => {
    localStorage.removeItem('teacher_onboarding_state');
    window.location.reload();
  };
  
  return (
    <Container>
      <Title>Onboarding Debug Panel</Title>
      
      <Section>
        <h2>Current State</h2>
        <InfoRow>
          <Label>Is Loading:</Label>
          <Value>{isLoading ? 'true' : 'false'}</Value>
        </InfoRow>
        <InfoRow>
          <Label>Is Onboarding:</Label>
          <Value>{isOnboarding ? 'true' : 'false'}</Value>
        </InfoRow>
        <InfoRow>
          <Label>Current Step:</Label>
          <Value>{currentStep}</Value>
        </InfoRow>
        <InfoRow>
          <Label>LocalStorage:</Label>
          <Value>{localStorage.getItem('teacher_onboarding_state') || 'null'}</Value>
        </InfoRow>
      </Section>
      
      <Section>
        <h2>Actions</h2>
        <ButtonGroup>
          <ModernButton onClick={startOnboarding} variant="primary">
            Start Onboarding
          </ModernButton>
          <ModernButton onClick={resetOnboarding} variant="secondary">
            Reset Onboarding
          </ModernButton>
          <ModernButton onClick={skipOnboarding} variant="secondary">
            Skip Onboarding
          </ModernButton>
          <ModernButton onClick={clearLocalStorage} variant="danger">
            Clear LocalStorage
          </ModernButton>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h2>Manual Step Progression</h2>
        <ButtonGroup>
          <ModernButton 
            onClick={() => completeStep('navigate_to_students' as any)} 
            variant="secondary"
            size="small"
          >
            Complete NAVIGATE_TO_STUDENTS
          </ModernButton>
          <ModernButton 
            onClick={() => completeStep('add_students' as any)} 
            variant="secondary"
            size="small"
          >
            Complete ADD_STUDENTS
          </ModernButton>
          <ModernButton 
            onClick={() => completeStep('create_room' as any)} 
            variant="secondary"
            size="small"
          >
            Complete CREATE_ROOM
          </ModernButton>
          <ModernButton 
            onClick={() => completeStep('create_skolr' as any)} 
            variant="secondary"
            size="small"
          >
            Complete CREATE_SKOLR
          </ModernButton>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h2>Test Navigation</h2>
        <ButtonGroup>
          <ModernButton 
            onClick={() => window.location.href = '/teacher-dashboard'} 
            variant="secondary"
          >
            Go to Dashboard
          </ModernButton>
          <ModernButton 
            onClick={() => window.location.href = '/teacher-dashboard/students'} 
            variant="secondary"
          >
            Go to Students
          </ModernButton>
        </ButtonGroup>
      </Section>
    </Container>
  );
}