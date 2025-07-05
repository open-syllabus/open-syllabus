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

const LastUpdated = styled.p`
  color: #666;
  font-size: 14px;
  margin-bottom: 40px;
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

export default function TermsOfServicePage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>Terms of Service</Title>
        <LastUpdated>Last updated: December 2024</LastUpdated>
        
        <Section>
          <Paragraph>
            These Terms of Service ("Terms") govern your use of Skolr's educational platform and services. 
            By accessing or using our services, you agree to be bound by these Terms. These Terms are 
            governed by the laws of England and Wales.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>1. Definitions</SectionTitle>
          <List>
            <li><strong>"Skolr", "we", "us", "our":</strong> refers to Skolr and its educational platform</li>
            <li><strong>"Services":</strong> all products, services, and features provided by Skolr</li>
            <li><strong>"User", "you", "your":</strong> any person accessing or using our Services</li>
            <li><strong>"Content":</strong> any text, images, audio, video, or other materials</li>
            <li><strong>"Educational Institution":</strong> schools, colleges, or other learning establishments</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>2. Acceptance of Terms</SectionTitle>
          <Paragraph>
            By creating an account or using our Services, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms. If you are using our Services on behalf of an Educational 
            Institution, you represent that you have the authority to bind that institution to these Terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>3. Eligibility</SectionTitle>
          <Paragraph>To use our Services, you must:</Paragraph>
          <List>
            <li>Be at least 13 years old (or have parental consent if younger)</li>
            <li>Be authorised by your Educational Institution (if applicable)</li>
            <li>Provide accurate and complete registration information</li>
            <li>Not be prohibited from using our Services under applicable law</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. User Accounts</SectionTitle>
          <Paragraph>You are responsible for:</Paragraph>
          <List>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorised use</li>
            <li>Ensuring your account information remains accurate and up-to-date</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Acceptable Use</SectionTitle>
          <Paragraph>You agree NOT to:</Paragraph>
          <List>
            <li>Use the Services for any unlawful purpose or in violation of these Terms</li>
            <li>Submit false, inaccurate, or misleading information</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with or disrupt the Services or servers</li>
            <li>Attempt to gain unauthorised access to any part of the Services</li>
            <li>Use automated systems or software to extract data</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Upload or share inappropriate content</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Intellectual Property</SectionTitle>
          <Paragraph>
            All content, features, and functionality of our Services are owned by Skolr, its licensors, 
            or other providers and are protected by UK and international copyright, trademark, and other 
            intellectual property laws.
          </Paragraph>
          <Paragraph>
            You retain ownership of content you submit, but grant us a worldwide, non-exclusive, 
            royalty-free licence to use, reproduce, and distribute your content solely for providing 
            and improving our Services.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>7. AI-Generated Content</SectionTitle>
          <Paragraph>
            Our Services use artificial intelligence to generate educational content. While we strive 
            for accuracy, AI-generated content may contain errors or inaccuracies. You acknowledge that:
          </Paragraph>
          <List>
            <li>AI-generated content is for educational assistance only</li>
            <li>You should verify important information independently</li>
            <li>We are not liable for errors in AI-generated content</li>
            <li>Academic integrity policies of your institution still apply</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>8. Privacy and Data Protection</SectionTitle>
          <Paragraph>
            Your use of our Services is subject to our Privacy Policy, which describes how we collect, 
            use, and protect your personal data in compliance with UK GDPR and the Data Protection Act 2018.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. Fees and Payment</SectionTitle>
          <Paragraph>
            Some features of our Services may require payment. By purchasing a subscription or paid features:
          </Paragraph>
          <List>
            <li>You agree to pay all applicable fees</li>
            <li>Fees are non-refundable unless otherwise stated</li>
            <li>We may change fees with 30 days' notice</li>
            <li>You are responsible for all applicable taxes</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>10. Termination</SectionTitle>
          <Paragraph>
            We may terminate or suspend your account immediately, without prior notice, for:
          </Paragraph>
          <List>
            <li>Breach of these Terms</li>
            <li>Violation of applicable laws</li>
            <li>Conduct harmful to other users or our Services</li>
            <li>Extended periods of inactivity</li>
          </List>
          <Paragraph>
            You may terminate your account at any time through your account settings or by contacting us.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Disclaimers</SectionTitle>
          <Paragraph>
            OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. 
            TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, 
            INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>12. Limitation of Liability</SectionTitle>
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKOLR SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR 
            REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
          </Paragraph>
          <Paragraph>
            IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT PAID BY YOU TO US IN THE 
            12 MONTHS PRECEDING THE CLAIM.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>13. Indemnification</SectionTitle>
          <Paragraph>
            You agree to indemnify, defend, and hold harmless Skolr and its officers, directors, 
            employees, and agents from any claims, damages, losses, liabilities, and expenses 
            arising out of your use of our Services or violation of these Terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>14. Governing Law and Jurisdiction</SectionTitle>
          <Paragraph>
            These Terms are governed by the laws of England and Wales. Any disputes arising from 
            these Terms or your use of our Services shall be subject to the exclusive jurisdiction 
            of the courts of England and Wales.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>15. Changes to Terms</SectionTitle>
          <Paragraph>
            We may modify these Terms at any time. We will notify you of material changes by posting 
            the updated Terms and changing the "Last updated" date. Your continued use of our Services 
            after changes constitutes acceptance of the modified Terms.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>16. Contact Information</SectionTitle>
          <Paragraph>
            If you have questions about these Terms, please contact us at:
          </Paragraph>
          <List>
            <li>Email: legal@skolr.app</li>
            <li>Address: [Your Company Address]</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>17. Severability</SectionTitle>
          <Paragraph>
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
            shall remain in full force and effect.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>18. Entire Agreement</SectionTitle>
          <Paragraph>
            These Terms, together with our Privacy Policy and any other policies referenced herein, 
            constitute the entire agreement between you and Skolr regarding the use of our Services.
          </Paragraph>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}