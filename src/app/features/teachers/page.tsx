'use client';

import styled from 'styled-components';
import Footer from '@/components/layout/Footer';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
`;

const ContentContainer = styled.div`
  flex: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #000;
  margin-bottom: 20px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #666;
  text-align: center;
  margin-bottom: 40px;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #000;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 16px;
    line-height: 1.6;
    color: #666;
  }
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: #000;
  margin-bottom: 24px;
  text-align: center;
`;

const BenefitsList = styled.ul`
  max-width: 800px;
  margin: 0 auto;
  
  li {
    font-size: 16px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 12px;
    padding-left: 20px;
    position: relative;
    
    &:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #4CAF50;
      font-weight: bold;
    }
  }
`;

export default function TeacherFeaturesPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>Skolr for Teachers</Title>
        <Subtitle>Empower your teaching with AI-powered tools designed for UK educators</Subtitle>
        
        <Section>
          <FeaturesGrid>
            <FeatureCard>
              <h3>Custom AI Assistants</h3>
              <p>
                Create personalised AI tutors tailored to your curriculum, teaching style, 
                and student needs. Control the personality, knowledge base, and interaction style.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Real-Time Monitoring</h3>
              <p>
                Track student interactions, identify learning gaps, and receive alerts for 
                potential concerns. Get insights into student engagement and understanding.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Safety Controls</h3>
              <p>
                Built-in safeguarding features flag concerning conversations, ensure appropriate 
                content, and maintain a safe learning environment for all students.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Progress Analytics</h3>
              <p>
                Comprehensive dashboards show individual and class progress, helping you identify 
                where students excel and where they need additional support.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Curriculum Alignment</h3>
              <p>
                Align AI assistants with UK national curriculum standards, exam boards, and your 
                specific schemes of work for seamless integration.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Resource Library</h3>
              <p>
                Upload documents, create assessments, and build a knowledge base that your AI 
                assistants can reference to provide accurate, relevant support.
              </p>
            </FeatureCard>
          </FeaturesGrid>
        </Section>
        
        <Section>
          <SectionTitle>Benefits for Teachers</SectionTitle>
          <BenefitsList>
            <li>Save time on repetitive questions while focusing on high-value teaching</li>
            <li>Provide 24/7 support to students without increasing your workload</li>
            <li>Identify struggling students early through AI-powered insights</li>
            <li>Differentiate instruction automatically based on individual student needs</li>
            <li>Maintain oversight and control over all student interactions</li>
            <li>Generate detailed reports for parents and school leadership</li>
            <li>Ensure consistent teaching quality across all student interactions</li>
            <li>Support students with different learning styles and paces</li>
          </BenefitsList>
        </Section>
        
        <Section>
          <SectionTitle>Getting Started</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <h3>1. Set Up Your Classroom</h3>
              <p>
                Create virtual classrooms and invite your students. Organise by subject, 
                year group, or any structure that works for you.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>2. Configure AI Assistants</h3>
              <p>
                Choose from templates or create custom AI tutors. Set their knowledge domains, 
                personality, and interaction guidelines.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>3. Monitor and Optimise</h3>
              <p>
                Watch how students interact, review analytics, and continuously improve your 
                AI assistants based on real usage data.
              </p>
            </FeatureCard>
          </FeaturesGrid>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}