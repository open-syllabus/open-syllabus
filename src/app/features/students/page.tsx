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

export default function StudentFeaturesPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>Skolr for Students</Title>
        <Subtitle>Your personal AI tutor, available 24/7 to help you succeed</Subtitle>
        
        <Section>
          <FeaturesGrid>
            <FeatureCard>
              <h3>Personalised Learning</h3>
              <p>
                Get explanations tailored to your learning style and pace. Your AI tutor adapts 
                to help you understand concepts in the way that works best for you.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>24/7 Availability</h3>
              <p>
                Study whenever you want, wherever you are. Your AI tutor is always ready to help, 
                whether it's late-night revision or early morning prep.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Instant Feedback</h3>
              <p>
                Get immediate answers to your questions and feedback on your work. No more waiting 
                for office hours or the next class.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Safe Learning Space</h3>
              <p>
                Ask questions without fear of judgement. Your AI tutor provides a supportive 
                environment where no question is too simple or complex.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Study Resources</h3>
              <p>
                Access study guides, practice questions, and revision materials created specifically 
                for your courses and learning objectives.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Progress Tracking</h3>
              <p>
                See your improvement over time with visual progress reports. Celebrate achievements 
                and identify areas for further study.
              </p>
            </FeatureCard>
          </FeaturesGrid>
        </Section>
        
        <Section>
          <SectionTitle>Benefits for Students</SectionTitle>
          <BenefitsList>
            <li>Learn at your own pace without pressure or time constraints</li>
            <li>Get unlimited practice and repetition until you master concepts</li>
            <li>Receive explanations in multiple ways until it clicks</li>
            <li>Build confidence by asking questions in a judgement-free environment</li>
            <li>Prepare effectively for exams with targeted revision support</li>
            <li>Stay motivated with encouraging feedback and progress tracking</li>
            <li>Access help exactly when you need it, not just during school hours</li>
            <li>Develop independent learning skills for lifelong success</li>
          </BenefitsList>
        </Section>
        
        <Section>
          <SectionTitle>How to Use Skolr</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <h3>1. Join Your Classroom</h3>
              <p>
                Use the room code provided by your teacher to join your virtual classroom 
                and access your personalised AI tutors.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>2. Start Learning</h3>
              <p>
                Chat with your AI tutor just like texting a friend. Ask questions, request 
                explanations, or work through problems together.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>3. Track Your Progress</h3>
              <p>
                Review your learning journey, celebrate milestones, and identify areas where 
                you might want to spend more time.
              </p>
            </FeatureCard>
          </FeaturesGrid>
        </Section>
        
        <Section>
          <SectionTitle>Study Tips</SectionTitle>
          <FeaturesGrid>
            <FeatureCard>
              <h3>Be Specific</h3>
              <p>
                The more specific your questions, the better your AI tutor can help. Include 
                context about what you're studying and what you find challenging.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Practice Regularly</h3>
              <p>
                Consistent practice is key to learning. Use your AI tutor for daily revision, 
                not just before exams.
              </p>
            </FeatureCard>
            
            <FeatureCard>
              <h3>Explore Different Approaches</h3>
              <p>
                If one explanation doesn't work, ask for another. Your AI tutor can explain 
                concepts in multiple ways.
              </p>
            </FeatureCard>
          </FeaturesGrid>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}