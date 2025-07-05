'use client';

import React from 'react';
import styled from 'styled-components';
import { ModernNav } from '@/components/teacher/ModernNav';
import { FiBook, FiMessageCircle, FiCheckCircle, FiArrowRight, FiInfo, FiVideo, FiUsers } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';

// Styled Components
const GuideWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelPink}10 0%, 
    ${({ theme }) => theme.colors.ui.pastelPurple}10 50%, 
    ${({ theme }) => theme.colors.ui.pastelBlue}10 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -20%;
    width: 40%;
    height: 40%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
      transparent 70%);
    opacity: 0.4;
    animation: float 20s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    right: -20%;
    width: 40%;
    height: 40%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelGreen}20 0%, 
      transparent 70%);
    opacity: 0.4;
    animation: float 25s ease-in-out infinite reverse;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  padding: 40px 40px 80px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 20px 20px 60px;
  }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxxl};
  animation: fadeInUp 0.6s ease-out;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelPurple}50 0%, 
    ${({ theme }) => theme.colors.ui.pastelPink}50 100%);
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xxxl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at top right, 
      ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
      transparent 50%);
    opacity: 0.5;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  position: relative;
  z-index: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.75rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
  position: relative;
  z-index: 1;
`;

const IntroText = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const BotTypesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-bottom: 60px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const BotTypeCard = styled.div<{ $gradient?: string; $delay?: string }>`
  background: ${({ $gradient, theme }) => $gradient || `linear-gradient(135deg, 
    ${theme.colors.ui.pastelPurple}30 0%, 
    ${theme.colors.ui.pastelPink}30 100%)`};
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
  animation-delay: ${props => props.$delay || '0s'};
  animation-fill-mode: backwards;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -30%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, 
      rgba(255, 255, 255, 0.2) 0%, 
      transparent 70%);
    opacity: 0.5;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const BotIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: 2.5rem;
  position: relative;
  z-index: 1;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const BotTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const BotDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  position: relative;
  z-index: 1;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  position: relative;
  z-index: 1;
  
  &::before {
    content: '✨';
    margin-right: ${({ theme }) => theme.spacing.sm};
    flex-shrink: 0;
  }
`;

const StepsSection = styled.div`
  margin-top: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  &::before {
    content: '✨';
    font-size: 1.5rem;
  }
`;

const StepsContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xxl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.colors.ui.pastelPurple} 0%, 
      ${({ theme }) => theme.colors.ui.pastelPink} 25%, 
      ${({ theme }) => theme.colors.ui.pastelBlue} 50%, 
      ${({ theme }) => theme.colors.ui.pastelGreen} 75%, 
      ${({ theme }) => theme.colors.ui.pastelYellow} 100%);
    opacity: 0.8;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.lg}`};
  }
`;

const StepItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelPurple} 0%, 
    ${({ theme }) => theme.colors.ui.pastelPink} 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  margin-right: ${({ theme }) => theme.spacing.lg};
  flex-shrink: 0;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StepDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const TipsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxxl};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
    ${({ theme }) => theme.colors.ui.pastelOrange}20 100%);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xxl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -40%;
    left: -30%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelPink}15 0%, 
      transparent 70%);
    opacity: 0.5;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.lg}`};
  }
`;

const TipsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const TipItem = styled.li`
  display: flex;
  align-items: flex-start;
  position: relative;
  z-index: 1;
  
  &::before {
    content: '💡';
    margin-right: ${({ theme }) => theme.spacing.sm};
    flex-shrink: 0;
    font-size: 1.2rem;
  }
`;

const CTASection = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.xxxl};
  padding: ${({ theme }) => theme.spacing.xxl};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.ui.pastelGreen}30 0%, 
    ${({ theme }) => theme.colors.ui.pastelBlue}30 100%);
  backdrop-filter: blur(20px);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    bottom: -30%;
    right: -30%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, 
      ${({ theme }) => theme.colors.ui.pastelYellow}20 0%, 
      transparent 70%);
    opacity: 0.5;
  }
`;

const CTATitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const CTAText = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;
`;

export default function GuidePage() {
  return (
    <>
      <ModernNav />
      <GuideWrapper>
        <ContentWrapper>
          <HeroSection>
            <PageTitle>Skolr Guide</PageTitle>
            <PageSubtitle>Create Powerful AI Assistants for Your Classroom</PageSubtitle>
            <IntroText>
              Skolr offers five types of AI Skolrs to enhance your teaching. Each type serves a unique purpose 
              in supporting student learning. Plus, create structured courses with lessons and resources. 
              Here's everything you need to know to get started.
            </IntroText>
          </HeroSection>

          <BotTypesGrid>
            <BotTypeCard 
              $gradient="linear-gradient(135deg, #E0F2FE30 0%, #D1FAE530 100%)"
              $delay="0.1s"
            >
              <BotIcon>🎓</BotIcon>
              <BotTitle>Learning Skolr</BotTitle>
              <BotDescription>
                Interactive AI tutors that engage students in dynamic conversations about any topic. 
                Perfect for exploration, revision, and deep learning.
              </BotDescription>
              <FeatureList>
                <FeatureItem>Unlimited student questions</FeatureItem>
                <FeatureItem>Adaptive responses based on student level</FeatureItem>
                <FeatureItem>Tracks engagement and understanding</FeatureItem>
                <FeatureItem>Works with any subject or topic</FeatureItem>
              </FeatureList>
              <ModernButton variant="secondary" style={{ width: '100%' }}>
                Best for: General tutoring & revision
              </ModernButton>
            </BotTypeCard>

            <BotTypeCard 
              $gradient="linear-gradient(135deg, #6366F130 0%, #8B5CF630 100%)"
              $delay="0.2s"
            >
              <BotIcon>📖</BotIcon>
              <BotTitle>Knowledge Book</BotTitle>
              <BotDescription>
                Create AI experts on your specific teaching materials. Upload documents to build a 
                comprehensive knowledge base that students can query with precision.
              </BotDescription>
              <FeatureList>
                <FeatureItem>Upload multiple PDFs & documents</FeatureItem>
                <FeatureItem>AI provides exact answers with citations</FeatureItem>
                <FeatureItem>Perfect for textbooks & study guides</FeatureItem>
                <FeatureItem>Tracks what students are searching for</FeatureItem>
              </FeatureList>
              <ModernButton variant="secondary" style={{ width: '100%' }}>
                Best for: Document-based learning
              </ModernButton>
            </BotTypeCard>

            <BotTypeCard 
              $gradient="linear-gradient(135deg, #EDE9FE30 0%, #FCE7F330 100%)"
              $delay="0.3s"
            >
              <BotIcon>📚</BotIcon>
              <BotTitle>Reading Room</BotTitle>
              <BotDescription>
                Specialised Skolrs that help students engage with specific texts. Upload any document 
                and create an AI companion for deep reading comprehension.
              </BotDescription>
              <FeatureList>
                <FeatureItem>Upload PDFs, documents, or web pages</FeatureItem>
                <FeatureItem>AI guides comprehension & analysis</FeatureItem>
                <FeatureItem>Helps with close reading skills</FeatureItem>
                <FeatureItem>Perfect for literature & essays</FeatureItem>
              </FeatureList>
              <ModernButton variant="secondary" style={{ width: '100%' }}>
                Best for: Text analysis & comprehension
              </ModernButton>
            </BotTypeCard>

            <BotTypeCard 
              $gradient="linear-gradient(135deg, #FEF3C730 0%, #FED7AA30 100%)"
              $delay="0.4s"
            >
              <BotIcon>🎬</BotIcon>
              <BotTitle>Viewing Room</BotTitle>
              <BotDescription>
                Watch educational videos alongside an AI tutor. Students can ask questions about 
                the video content in real-time and complete linked assessments.
              </BotDescription>
              <FeatureList>
                <FeatureItem>YouTube & Vimeo video support</FeatureItem>
                <FeatureItem>Real-time Q&A about video content</FeatureItem>
                <FeatureItem>Link to assessment Skolrs</FeatureItem>
                <FeatureItem>Track viewing engagement</FeatureItem>
              </FeatureList>
              <ModernButton variant="secondary" style={{ width: '100%' }}>
                Best for: Video-based learning
              </ModernButton>
            </BotTypeCard>

            <BotTypeCard 
              $gradient="linear-gradient(135deg, #FCE7F330 0%, #FED7AA30 100%)"
              $delay="0.5s"
            >
              <BotIcon>📝</BotIcon>
              <BotTitle>Assessment Skolr</BotTitle>
              <BotDescription>
                Conduct one-on-one assessments through natural conversation. Get detailed insights 
                into student understanding without traditional testing.
              </BotDescription>
              <FeatureList>
                <FeatureItem>Conversational assessment format</FeatureItem>
                <FeatureItem>Automatic grading & feedback</FeatureItem>
                <FeatureItem>Detailed performance analytics</FeatureItem>
                <FeatureItem>Reduces assessment anxiety</FeatureItem>
              </FeatureList>
              <ModernButton variant="secondary" style={{ width: '100%' }}>
                Best for: Formative & summative assessment
              </ModernButton>
            </BotTypeCard>
          </BotTypesGrid>

          <StepsSection>
            <SectionTitle>📚 Courses: Structured Learning Pathways</SectionTitle>
            <StepsContainer>
              <div style={{ 
                background: 'linear-gradient(135deg, #EDE9FE30 0%, #FCE7F330 100%)', 
                padding: '24px', 
                borderRadius: '12px', 
                marginBottom: '32px',
                position: 'relative',
                zIndex: 1
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 700 }}>
                  Create Complete Learning Experiences
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '1.125rem', lineHeight: 1.6 }}>
                  Beyond individual Skolrs, you can now create structured courses with multiple lessons, 
                  each containing video content, reading materials, and linked Skolrs for interaction.
                </p>
                <FeatureList>
                  <FeatureItem>Organise content into chapters and lessons</FeatureItem>
                  <FeatureItem>Add videos and reading resources to each lesson</FeatureItem>
                  <FeatureItem>Link relevant Skolrs for student support</FeatureItem>
                  <FeatureItem>Track student progress through the course</FeatureItem>
                  <FeatureItem>Perfect for flipped classroom or homework</FeatureItem>
                </FeatureList>
              </div>
              
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Create a Course</StepTitle>
                  <StepDescription>
                    Navigate to "Courses" and click "Create Course". Give it a name, description, 
                    and select the subject area. Courses help you structure learning over time.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Add Lessons</StepTitle>
                  <StepDescription>
                    Create lessons within your course. Each lesson can have a video (YouTube/Vimeo), 
                    reading materials (PDFs), and a linked Skolr to help students with the content.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Assign to Classrooms</StepTitle>
                  <StepDescription>
                    Once your course is ready, assign it to one or more classrooms. Students will see 
                    the course in their dashboard and can work through lessons at their own pace.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Monitor Progress</StepTitle>
                  <StepDescription>
                    Track which students have completed each lesson, how long they spent, and their 
                    engagement with the linked Skolrs. Perfect for homework or revision programmes.
                  </StepDescription>
                </StepContent>
              </StepItem>
            </StepsContainer>
          </StepsSection>

          <StepsSection>
            <SectionTitle>🚀 How to Create Your First Skolr</SectionTitle>
            <StepsContainer>
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Navigate to Skolrs</StepTitle>
                  <StepDescription>
                    From your teacher dashboard, click on "Skolrs" in the navigation menu. 
                    You'll see all your existing Skolrs and a button to create new ones.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Choose Your Skolr Type</StepTitle>
                  <StepDescription>
                    Click "Create New Skolr" and select the type that best fits your needs. 
                    Each type has different configuration options tailored to its purpose.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Configure Basic Settings</StepTitle>
                  <StepDescription>
                    Give your Skolr a name, select the subject area, and write clear instructions. 
                    The instructions tell the AI how to interact with students and what to focus on.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Add to Your Classrooms</StepTitle>
                  <StepDescription>
                    Once created, assign your Skolr to one or more classrooms. Students in those 
                    rooms will immediately have access to interact with the Skolr.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>5</StepNumber>
                <StepContent>
                  <StepTitle>Monitor & Refine</StepTitle>
                  <StepDescription>
                    Track student interactions, view chat histories, and refine your Skolr's 
                    instructions based on how students are using it. You can edit settings at any time.
                  </StepDescription>
                </StepContent>
              </StepItem>
            </StepsContainer>
          </StepsSection>

          <StepsSection>
            <SectionTitle>👥 How to Enrol Students</SectionTitle>
            <StepsContainer>
              <div style={{ 
                background: 'linear-gradient(135deg, #E0F2FE30 0%, #D1FAE530 100%)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '32px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <p style={{ margin: 0, fontSize: '1.125rem', color: '#047857', fontWeight: 600 }}>
                  🎉 No Email or Passwords Required!
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#6B7280' }}>
                  Students can join with just a room code and their name. Simple as that!
                </p>
              </div>
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Create a Classroom</StepTitle>
                  <StepDescription>
                    Go to "Classrooms" and click "Create New Room". Give it a name like "Year 9 English" 
                    or "Period 3 Science". Each room gets a unique 6-character code.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Share the Room Code</StepTitle>
                  <StepDescription>
                    Give students the 6-character room code (e.g., "ABC123"). They can join by:
                    • Going to skolr.app and clicking "Join Room"
                    • Entering the room code
                    • Entering their name only (no email required!)
                    • They're instantly added to your classroom
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Student Navigation</StepTitle>
                  <StepDescription>
                    Once in a classroom, students follow this flow:
                    • Dashboard shows all their classrooms
                    • Click "Enter Classroom" to enter a specific room
                    • Inside the room, they see available Skolrs and courses
                    • Click on any Skolr to start chatting with it
                    • Access courses through the same classroom view
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Set Up PIN Access (Returning Students)</StepTitle>
                  <StepDescription>
                    For students who need to log back in:
                    • After first joining, students can set up a 4-digit PIN
                    • They'll get a unique username (e.g., john.smith)
                    • Next time, they use username + PIN to log in
                    • Access via "Student Login" on the homepage
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>5</StepNumber>
                <StepContent>
                  <StepTitle>Bulk Import (CSV)</StepTitle>
                  <StepDescription>
                    For whole classes:
                    • Prepare a CSV file with student names (and optional year groups)
                    • Go to your classroom → Students → Import CSV
                    • System generates usernames and 4-digit PINs
                    • Download the credentials list for your students
                    • Students log in with username + PIN
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>6</StepNumber>
                <StepContent>
                  <StepTitle>Manage Student Access</StepTitle>
                  <StepDescription>
                    • View all enrolled students in the classroom dashboard
                    • See who's active and their engagement levels
                    • Reset PINs if students forget them
                    • Generate magic links for direct access
                    • Archive inactive students to keep lists clean
                  </StepDescription>
                </StepContent>
              </StepItem>
            </StepsContainer>
          </StepsSection>

          <StepsSection>
            <SectionTitle>📖 Using Knowledge Books</SectionTitle>
            <StepsContainer>
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Create a Knowledge Book Skolr</StepTitle>
                  <StepDescription>
                    Select "Knowledge Book" when creating a new Skolr. This type is designed to be an 
                    expert on specific documents you upload, perfect for textbooks or study guides.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Upload Your Documents</StepTitle>
                  <StepDescription>
                    Upload PDFs of textbooks, study guides, or any reference materials. The AI will 
                    index these documents and be able to provide precise answers with page citations.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Configure Citation Settings</StepTitle>
                  <StepDescription>
                    Knowledge Books always provide citations, showing students exactly where information 
                    comes from. This builds good research habits and allows verification.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Student Queries</StepTitle>
                  <StepDescription>
                    Students can ask specific questions and get accurate answers drawn directly from 
                    your uploaded materials. Perfect for homework help or exam preparation.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>5</StepNumber>
                <StepContent>
                  <StepTitle>Track Popular Topics</StepTitle>
                  <StepDescription>
                    See what students are searching for most frequently. This helps you identify areas 
                    where students need more support or clarification in class.
                  </StepDescription>
                </StepContent>
              </StepItem>
            </StepsContainer>
          </StepsSection>

          <StepsSection>
            <SectionTitle>🎬 Using Viewing Rooms</SectionTitle>
            <StepsContainer>
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Create a Viewing Room Skolr</StepTitle>
                  <StepDescription>
                    Select "Viewing Room" when creating a new Skolr. Give it a descriptive name 
                    like "Photosynthesis Video Lesson" or "Shakespeare Documentary".
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Add Your Video</StepTitle>
                  <StepDescription>
                    Paste a YouTube or Vimeo URL in the video field. The AI will be able to answer 
                    questions about the video content as students watch.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Link an Assessment (Optional)</StepTitle>
                  <StepDescription>
                    Create an assessment Skolr for the video topic, then link it to your viewing room. 
                    Students will see a "Start Assessment" button after watching.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Student Experience</StepTitle>
                  <StepDescription>
                    Students see the video on the left and chat on the right (desktop) or video on top 
                    (mobile). They can pause and ask questions at any time, making learning interactive.
                  </StepDescription>
                </StepContent>
              </StepItem>

              <StepItem>
                <StepNumber>5</StepNumber>
                <StepContent>
                  <StepTitle>Review Engagement</StepTitle>
                  <StepDescription>
                    Check chat histories to see what questions students asked during the video. 
                    This reveals which concepts they found challenging or interesting.
                  </StepDescription>
                </StepContent>
              </StepItem>
            </StepsContainer>
          </StepsSection>

          <TipsSection>
            <SectionTitle>💡 Pro Tips for Success</SectionTitle>
            <TipsList>
              <TipItem>
                <span>
                  <strong>Quick Start:</strong> The fastest way to get students using Skolr is the room 
                  code method. They don't need emails or accounts - just the code and their name!
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Clear Instructions:</strong> Write detailed instructions for your Skolr. 
                  Include the student year group, key topics to cover, and the tone you want.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Start Simple:</strong> Begin with one Skolr per subject and expand as 
                  you see how students engage with the technology.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Regular Updates:</strong> Update your Skolr instructions based on common 
                  student questions or misconceptions you observe.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Combine Types:</strong> Use different Skolr types together - a viewing room 
                  for video content linked to an assessment Skolr to check understanding.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Knowledge Book Power:</strong> Upload your entire textbook to a Knowledge Book 
                  Skolr. Students can ask questions and get instant answers with page references.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Course Structure:</strong> Create courses for revision programmes or flipped 
                  classroom approaches. Each lesson can combine video, reading, and AI support.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Student Feedback:</strong> Ask students which Skolrs they find most helpful 
                  and adjust your approach accordingly.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Safety First:</strong> Our AI monitors all conversations for safety. Review 
                  flagged chats promptly to support students who may need help.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Room Codes:</strong> Room codes are your classroom key. They're 6 characters 
                  long and case-insensitive. Share them in class or via your school's LMS.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Student Flow:</strong> Students access Skolrs through their classrooms. The flow 
                  is: Student Dashboard → Enter Classroom → Select Skolr. This keeps everything organised 
                  by classroom context.
                </span>
              </TipItem>
              <TipItem>
                <span>
                  <strong>Video Selection:</strong> For viewing rooms, choose educational videos that are 
                  age-appropriate and align with your curriculum objectives.
                </span>
              </TipItem>
            </TipsList>
          </TipsSection>

          <CTASection>
            <CTATitle>Ready to Transform Your Teaching?</CTATitle>
            <CTAText>
              Create your first AI assistant in minutes, build a Knowledge Book from your textbooks, 
              or design a complete course. See how Skolr can enhance student engagement and learning outcomes.
            </CTAText>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <ModernButton 
                variant="primary" 
                size="large"
                onClick={() => window.location.href = '/teacher-dashboard/chatbots'}
              >
                Create Your First Skolr
                <FiArrowRight />
              </ModernButton>
              <ModernButton 
                variant="secondary" 
                size="large"
                onClick={() => window.location.href = '/teacher-dashboard/courses'}
              >
                Build a Course
                <FiBook />
              </ModernButton>
            </div>
          </CTASection>
        </ContentWrapper>
      </GuideWrapper>
    </>
  );
}