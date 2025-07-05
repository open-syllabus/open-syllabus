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

const CookieTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  
  th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
  }
  
  th {
    background-color: #f0f0f0;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    
    th, td {
      padding: 8px;
    }
  }
`;

export default function CookiePolicyPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Title>Cookie Policy</Title>
        <LastUpdated>Last updated: December 2024</LastUpdated>
        
        <Section>
          <Paragraph>
            This Cookie Policy explains how Skolr ("we", "us", or "our") uses cookies and similar 
            technologies when you visit our website and use our services. This policy complies with 
            the UK Privacy and Electronic Communications Regulations (PECR) and the UK General Data 
            Protection Regulation (UK GDPR).
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>1. What Are Cookies?</SectionTitle>
          <Paragraph>
            Cookies are small text files that are placed on your device when you visit a website. 
            They help websites remember information about your visit, making your next visit easier 
            and the site more useful to you.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. How We Use Cookies</SectionTitle>
          <Paragraph>We use cookies for the following purposes:</Paragraph>
          <List>
            <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
            <li><strong>Performance Cookies:</strong> Help us understand how visitors use our website</li>
            <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Collect anonymous information about site usage</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. Types of Cookies We Use</SectionTitle>
          <CookieTable>
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>sb-access-token</td>
                <td>Authentication and session management</td>
                <td>Session</td>
                <td>Essential</td>
              </tr>
              <tr>
                <td>sb-refresh-token</td>
                <td>Session renewal</td>
                <td>7 days</td>
                <td>Essential</td>
              </tr>
              <tr>
                <td>theme-preference</td>
                <td>Stores user's theme choice</td>
                <td>1 year</td>
                <td>Functionality</td>
              </tr>
              <tr>
                <td>cookie-consent</td>
                <td>Records cookie consent choices</td>
                <td>1 year</td>
                <td>Essential</td>
              </tr>
              <tr>
                <td>_ga</td>
                <td>Google Analytics - distinguishes users</td>
                <td>2 years</td>
                <td>Analytics</td>
              </tr>
              <tr>
                <td>_gid</td>
                <td>Google Analytics - distinguishes users</td>
                <td>24 hours</td>
                <td>Analytics</td>
              </tr>
            </tbody>
          </CookieTable>
        </Section>

        <Section>
          <SectionTitle>4. Third-Party Cookies</SectionTitle>
          <Paragraph>
            We may use third-party services that set their own cookies, including:
          </Paragraph>
          <List>
            <li><strong>Google Analytics:</strong> For website usage analysis</li>
            <li><strong>Stripe:</strong> For payment processing (on payment pages only)</li>
            <li><strong>Cloudflare:</strong> For security and performance</li>
          </List>
          <Paragraph>
            These third parties have their own privacy policies addressing how they use such information.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>5. Your Cookie Choices</SectionTitle>
          <Paragraph>
            When you first visit our website, you will be asked to consent to our use of cookies. 
            You can manage your cookie preferences at any time by:
          </Paragraph>
          <List>
            <li>Using our cookie consent banner when you visit the site</li>
            <li>Adjusting your browser settings to refuse cookies</li>
            <li>Deleting cookies that have already been set</li>
          </List>
          <Paragraph>
            Please note that disabling certain cookies may impact the functionality of our website 
            and prevent you from using some features.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Browser Cookie Settings</SectionTitle>
          <Paragraph>
            Most web browsers allow you to control cookies through their settings. You can usually 
            find these settings in the "Options" or "Preferences" menu of your browser. The following 
            links provide information for common browsers:
          </Paragraph>
          <List>
            <li>Chrome: chrome://settings/cookies</li>
            <li>Firefox: about:preferences#privacy</li>
            <li>Safari: Preferences → Privacy</li>
            <li>Edge: edge://settings/privacy</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Do Not Track Signals</SectionTitle>
          <Paragraph>
            Some browsers have a "Do Not Track" feature that lets you tell websites you do not want 
            your online activities tracked. We currently do not respond to Do Not Track signals, but 
            we limit tracking to what is described in this policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>8. Cookies and Personal Data</SectionTitle>
          <Paragraph>
            Some cookies we use may collect personal data. Where this occurs, our Privacy Policy 
            applies to the processing of that data. We process cookie data under the following legal bases:
          </Paragraph>
          <List>
            <li><strong>Consent:</strong> For non-essential cookies</li>
            <li><strong>Legitimate Interests:</strong> For essential cookies necessary for site operation</li>
          </List>
        </Section>

        <Section>
          <SectionTitle>9. Updates to This Policy</SectionTitle>
          <Paragraph>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for legal reasons. We will notify you of any material changes by updating the "Last 
            updated" date and, where appropriate, through notice on our website.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>10. Contact Us</SectionTitle>
          <Paragraph>
            If you have questions about our use of cookies, please contact us at:
          </Paragraph>
          <List>
            <li>Email: privacy@skolr.app</li>
            <li>Address: [Your Company Address]</li>
          </List>
          <Paragraph>
            For more information about cookies and how to manage them, visit the Information 
            Commissioner's Office website at ico.org.uk/your-data-matters/online/cookies/
          </Paragraph>
        </Section>
      </ContentContainer>
      <Footer />
    </PageContainer>
  );
}