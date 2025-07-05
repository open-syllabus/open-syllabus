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
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #000;
  margin-bottom: 20px;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #000;
  margin-bottom: 16px;
`;

const Paragraph = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 16px;
`;

const List = styled.ul`
  margin: 16px 0 16px 20px;
  
  li {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 8px;
  }
`;

export default function AboutPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>About Skolr</Title>
        
        <Section>
          <Paragraph>
            Skolr is an innovative AI-powered educational platform designed to transform the way 
            students learn and teachers educate across the United Kingdom. By leveraging cutting-edge 
            artificial intelligence technology, we create personalised learning experiences that adapt 
            to each student's unique needs and learning style.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Our Mission</SectionTitle>
          <Paragraph>
            To democratise quality education by providing every student with a personalised AI tutor 
            and empowering teachers with intelligent tools that enhance their ability to educate, 
            monitor progress, and ensure student safety.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>What We Do</SectionTitle>
          <List>
            <li>
              <strong>Personalised Learning:</strong> Our AI tutors adapt to each student's pace, 
              learning style, and knowledge level to provide customised educational support.
            </li>
            <li>
              <strong>Teacher Empowerment:</strong> We provide educators with powerful tools to 
              create custom AI assistants, monitor student progress, and identify areas where 
              students need additional support.
            </li>
            <li>
              <strong>Safe Learning Environment:</strong> Built-in safety features ensure appropriate 
              interactions and flag potential concerns for teacher review.
            </li>
            <li>
              <strong>Curriculum Alignment:</strong> Our platform aligns with UK educational standards 
              and can be customised to match specific school curricula.
            </li>
          </List>
        </Section>

        <Section>
          <SectionTitle>Our Values</SectionTitle>
          <List>
            <li>
              <strong>Accessibility:</strong> Education should be available to all students, 
              regardless of background or learning differences.
            </li>
            <li>
              <strong>Innovation:</strong> We continuously evolve our platform to incorporate the 
              latest educational research and AI advancements.
            </li>
            <li>
              <strong>Privacy:</strong> Student data protection is paramount. We adhere to strict 
              UK GDPR requirements and educational data protection standards.
            </li>
            <li>
              <strong>Collaboration:</strong> We believe in working closely with educators to ensure 
              our platform meets real classroom needs.
            </li>
          </List>
        </Section>

        <Section>
          <SectionTitle>How It Works</SectionTitle>
          <Paragraph>
            Skolr uses advanced language models to create interactive learning experiences. Students 
            can engage with AI tutors that understand context, provide explanations, answer questions, 
            and guide them through complex topics. Teachers can monitor these interactions, customise 
            the AI behaviour, and gain insights into student understanding.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Join Our Community</SectionTitle>
          <Paragraph>
            Whether you're a teacher looking to enhance your classroom experience, a school 
            administrator seeking innovative educational solutions, or a student ready to explore 
            personalised learning, Skolr is here to support your educational journey.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>Contact Us</SectionTitle>
          <Paragraph>
            Have questions or want to learn more about bringing Skolr to your school?
          </Paragraph>
          <List>
            <li>Email: hello@skolr.app</li>
            <li>For support: support@skolr.app</li>
            <li>For partnerships: partnerships@skolr.app</li>
          </List>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}