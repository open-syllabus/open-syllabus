// src/components/teacher/BotWizard/WizardContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiCheck, FiChevronRight } from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};

// Helper function to darken a color
const darken = (color: string, amount: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!result) return color;
  
  const r = Math.max(0, parseInt(result[1], 16) - amount);
  const g = Math.max(0, parseInt(result[2], 16) - amount);
  const b = Math.max(0, parseInt(result[3], 16) - amount);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  complete: boolean;
}

const WizardWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.ui.backgroundLight} 0%, ${({ theme }) => theme.colors.ui.background} 100%);
  padding: 32px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelYellow, 0.1)} 0%, 
      transparent 70%);
    animation: float 20s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }
  
  @media (max-width: 480px) {
    padding: 24px 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  position: relative;
  z-index: 1;
`;

const WizardHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    margin-bottom: 32px;
  }
`;

const WizardTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const WizardSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ProgressSection = styled.div`
  margin-bottom: 48px;
`;

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const StepIndicator = styled(motion.div)<{ $active: boolean; $complete: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  cursor: pointer;
  
  @media (max-width: 768px) {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    gap: 16px;
  }
`;

const StepCircle = styled(motion.div)<{ $active: boolean; $complete: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  
  background: ${({ $active, $complete, theme }) => 
    $complete ? theme.colors.brand.primary :
    $active ? theme.colors.ui.pastelPurple :
    theme.colors.ui.backgroundLight};
    
  color: ${({ $active, $complete, theme }) => 
    $complete ? '#fff' :
    $active ? theme.colors.brand.primary :
    theme.colors.text.muted};
    
  border: 3px solid ${({ $active, $complete, theme }) => 
    $complete ? theme.colors.brand.primary :
    $active ? theme.colors.brand.primary :
    'transparent'};
    
  box-shadow: ${({ $active, theme }) => 
    $active ? `0 4px 12px ${hexToRgba(theme.colors.brand.primary, 0.15)}` : '0 1px 3px rgba(0, 0, 0, 0.1)'};
    
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
`;

const StepContent = styled.div<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
  
  @media (max-width: 768px) {
    margin-top: 0;
    align-items: flex-start;
    flex: 1;
  }
`;

const StepTitle = styled.h3<{ $active: boolean; $complete: boolean }>`
  font-size: 1rem;
  font-weight: ${({ $active }) => $active ? '700' : '600'};
  color: ${({ $active, $complete, theme }) => 
    $active || $complete ? theme.colors.text.primary : theme.colors.text.muted};
  margin-bottom: 4px;
  transition: all 0.2s ease;
`;

const StepSubtitle = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
  
  @media (max-width: 768px) {
    text-align: left;
  }
`;

const StepConnector = styled.div<{ $complete: boolean }>`
  position: absolute;
  top: 30px;
  left: 60px;
  right: -60px;
  height: 2px;
  background: ${({ $complete, theme }) => 
    $complete ? theme.colors.brand.primary : theme.colors.ui.borderDark};
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ContentArea = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 48px;
  
  @media (max-width: 480px) {
    margin-top: 32px;
  }
`;

const NavButton = styled(motion.button)<{ $primary?: boolean }>`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  background: ${({ $primary, theme }) => 
    $primary ? theme.colors.brand.primary : theme.colors.ui.backgroundLight};
  color: ${({ $primary, theme }) => 
    $primary ? '#fff' : theme.colors.text.primary};
    
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: ${({ $primary, theme }) => 
      $primary ? darken(theme.colors.brand.primary, 10) : theme.colors.ui.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

const HelpText = styled.div`
  text-align: center;
  margin-top: 32px;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.muted};
  
  a {
    color: ${({ theme }) => theme.colors.brand.primary};
    font-weight: 600;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const StatusMessage = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.pastelBlue};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &::before {
    content: '⚡';
    font-size: 1.2rem;
  }
`;

interface WizardContainerProps {
  children: React.ReactNode;
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  isCreating?: boolean;
  canProceed?: boolean;
  statusMessage?: string | null;
}

export default function WizardContainer({ 
  children, 
  currentStep, 
  onStepChange,
  onComplete,
  isCreating = false,
  canProceed = true,
  botType = '',
  statusMessage = null,
}: WizardContainerProps & { botType?: string; statusMessage?: string | null }) {
  const router = useRouter();
  
  // Dynamically create steps based on bot type
  const getSteps = () => {
    const baseSteps = [
      {
        id: 1,
        title: "Skolr Details",
        subtitle: "Name & configure your Skolr",
        icon: "✨",
        complete: false
      },
      {
        id: 2,
        title: "Add Knowledge",
        subtitle: "Upload content & set behavior",
        icon: "🧠",
        complete: false
      }
    ];
    
    // Add content upload step for reading/viewing rooms
    if (botType === 'reading_room' || botType === 'viewing_room') {
      baseSteps.push({
        id: 3,
        title: botType === 'reading_room' ? "Upload Document" : "Add Video",
        subtitle: botType === 'reading_room' ? "Upload PDF for reading" : "Add video content",
        icon: botType === 'reading_room' ? "📄" : "🎬",
        complete: false
      });
    }
    
    return baseSteps;
  };
  
  const [steps, setSteps] = useState<WizardStep[]>(getSteps());

  useEffect(() => {
    // Update steps when bot type changes
    setSteps(getSteps());
  }, [botType]);
  
  useEffect(() => {
    // Update step completion status
    setSteps(prev => prev.map(step => ({
      ...step,
      complete: step.id < currentStep
    })));
  }, [currentStep]);

  const handleNext = () => {
    const totalSteps = steps.length;
    if (currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow going back to completed steps or the current step
    if (stepId <= currentStep) {
      onStepChange(stepId);
    }
  };

  return (
    <WizardWrapper>
      <Container>
        <WizardHeader>
          <WizardTitle>Let's Create Your Skolr</WizardTitle>
          <WizardSubtitle>
            Follow our simple steps to set up a delightful AI learning companion for your students
          </WizardSubtitle>
        </WizardHeader>

        <ProgressSection>
          <ProgressBar>
            {steps.map((step, index) => (
              <StepIndicator
                key={step.id}
                $active={step.id === currentStep}
                $complete={step.complete}
                onClick={() => handleStepClick(step.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <StepCircle
                  $active={step.id === currentStep}
                  $complete={step.complete}
                  initial={false}
                  animate={{
                    scale: step.id === currentStep ? 1.1 : 1,
                  }}
                >
                  {step.complete ? <FiCheck /> : step.icon}
                </StepCircle>
                <StepContent $active={step.id === currentStep}>
                  <StepTitle 
                    $active={step.id === currentStep}
                    $complete={step.complete}
                  >
                    {step.title}
                  </StepTitle>
                  <StepSubtitle>{step.subtitle}</StepSubtitle>
                </StepContent>
                {index < steps.length - 1 && (
                  <StepConnector $complete={step.complete} />
                )}
              </StepIndicator>
            ))}
          </ProgressBar>
        </ProgressSection>

        <ContentArea>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </ContentArea>

        <NavigationButtons>
          <NavButton
            onClick={handlePrevious}
            disabled={currentStep === 1}
            whileHover={{ x: -5 }}
          >
            ← Previous
          </NavButton>
          
          <NavButton
            $primary
            onClick={handleNext}
            disabled={isCreating || !canProceed}
            whileHover={{ x: 5 }}
          >
            {isCreating ? 'Creating Skolr...' : currentStep === steps.length ? 'Complete Setup' : 'Next Step'}
            <FiChevronRight />
          </NavButton>
        </NavigationButtons>

        {statusMessage && (
          <StatusMessage
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {statusMessage}
          </StatusMessage>
        )}

        <HelpText>
          Need help? Check out our <a href="/teacher-dashboard/guide">setup guide</a> or contact support
        </HelpText>
      </Container>
    </WizardWrapper>
  );
}