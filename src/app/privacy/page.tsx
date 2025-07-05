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

const ContactInfo = styled.div`
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  
  p {
    margin: 8px 0;
  }
`;

export default function PrivacyPolicyPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>Privacy Policy</Title>
        <LastUpdated>Last updated: December 2024</LastUpdated>
        
        <Section>
          <Paragraph>
            Skolr ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use our 
            educational platform and services.
          </Paragraph>
          <Paragraph>
            This policy complies with the UK General Data Protection Regulation (UK GDPR) and the 
            Data Protection Act 2018.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>1. Information We Collect</SectionTitle>
          <Paragraph>We collect information that you provide directly to us, including:</Paragraph>
          <List>
            <li>Personal identification information (name, email address, school affiliation)</li>
            <li>Educational information (courses, assignments, grades)</li>
            <li>Communication data (messages within the platform)</li>
            <li>Usage data (how you interact with our services)</li>
            <li>Technical data (IP address, browser type, device information)</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>2. How We Use Your Information</SectionTitle>
          <Paragraph>We use your information to:</Paragraph>
          <List>
            <li>Provide, maintain, and improve our educational services</li>
            <li>Personalise learning experiences using AI technology</li>
            <li>Communicate with you about your account and our services</li>
            <li>Monitor and analyse usage patterns to improve functionality</li>
            <li>Ensure safety and security of our platform</li>
            <li>Comply with legal obligations</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. Legal Basis for Processing</SectionTitle>
          <Paragraph>We process your personal data under the following legal bases:</Paragraph>
          <List>
            <li><strong>Contract:</strong> To provide our educational services to you</li>
            <li><strong>Legitimate Interests:</strong> To improve our services and ensure platform safety</li>
            <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
            <li><strong>Consent:</strong> Where you have given explicit consent for specific processing</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Data Sharing and Disclosure</SectionTitle>
          <Paragraph>We may share your information with:</Paragraph>
          <List>
            <li>Educational institutions you are affiliated with</li>
            <li>Service providers who assist in operating our platform</li>
            <li>Law enforcement or regulatory bodies when required by law</li>
            <li>Professional advisers (lawyers, accountants, auditors)</li>
          </List>
          <Paragraph>
            We do not sell, rent, or trade your personal information to third parties for marketing purposes.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>5. Data Security</SectionTitle>
          <Paragraph>
            We implement appropriate technical and organisational measures to protect your personal data 
            against unauthorised or unlawful processing, accidental loss, destruction, or damage. These 
            measures include:
          </Paragraph>
          <List>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication procedures</li>
            <li>Employee training on data protection</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>6. Data Retention</SectionTitle>
          <Paragraph>
            We retain your personal data only for as long as necessary to fulfil the purposes for which 
            it was collected and to comply with legal obligations. Typically:
          </Paragraph>
          <List>
            <li>Active account data: Duration of account activity plus 1 year</li>
            <li>Educational records: 6 years after course completion</li>
            <li>Communication logs: 2 years</li>
            <li>Technical logs: 6 months</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Your Rights</SectionTitle>
          <Paragraph>Under UK GDPR, you have the following rights:</Paragraph>
          <List>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (right to be forgotten)</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Object:</strong> Object to certain types of processing</li>
            <li><strong>Withdraw consent:</strong> Where processing is based on consent</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>8. Children's Privacy</SectionTitle>
          <Paragraph>
            Our services may be used by children under 16 with appropriate consent from parents or 
            guardians through their educational institution. We take additional precautions to protect 
            the privacy of younger users and comply with applicable regulations regarding children's data.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>9. International Data Transfers</SectionTitle>
          <Paragraph>
            Your data may be transferred to and processed in countries outside the UK. We ensure 
            appropriate safeguards are in place, such as standard contractual clauses approved by 
            the UK Information Commissioner's Office (ICO).
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Changes to This Policy</SectionTitle>
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the "Last updated" date.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>11. Contact Us</SectionTitle>
          <Paragraph>
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
          </Paragraph>
          <ContactInfo>
            <p><strong>Data Protection Officer</strong></p>
            <p>Skolr</p>
            <p>Email: privacy@skolr.app</p>
            <p>Address: [Your Company Address]</p>
          </ContactInfo>
          <Paragraph style={{ marginTop: '20px' }}>
            You also have the right to lodge a complaint with the Information Commissioner's Office (ICO):
          </Paragraph>
          <ContactInfo>
            <p><strong>Information Commissioner's Office</strong></p>
            <p>Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
            <p>Helpline: 0303 123 1113</p>
            <p>Website: ico.org.uk</p>
          </ContactInfo>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}