'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSave,
  FiX,
  FiCheck,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiChevronRight,
  FiSettings,
  FiUsers,
  FiMessageSquare,
  FiBookOpen
} from 'react-icons/fi';
import { PageWrapper } from '@/components/shared/PageStructure';
import { ModernButton, IconButton, ButtonGroup } from '@/components/shared/ModernButton';
import { 
  Container, 
  Section, 
  Card, 
  CardBody,
  Heading, 
  Text,
  Grid,
  Flex,
  Stack,
  Badge,
  StatusBadge,
  CodeBadge,
  StatsCard,
  SearchInput,
  Input,
  TextArea,
  Select,
  Label,
  FormGroup,
  Checkbox,
  Radio,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell
} from '@/components/ui';
import { 
  StatsCard as UnifiedStatsCard, 
  ContentCard, 
  SummaryCard 
} from '@/components/ui/UnifiedCards';
import { 
  FiActivity, 
  FiDatabase, 
  FiCpu, 
  FiClipboard 
} from 'react-icons/fi';

const ComponentSection = styled(Section)`
  margin-bottom: 48px;
`;

const ComponentGrid = styled(Grid)`
  gap: 24px;
  margin-top: 24px;
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 100%;
  height: 80px;
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => {
    // Determine if we need light or dark text
    const isLight = $color.includes('pastel') || $color.includes('white') || $color.includes('gray');
    return isLight ? '#111827' : 'white';
  }};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ButtonDemo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
  padding: 24px;
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: ${({ theme }) => theme.borderRadius.large};
`;

const FormDemo = styled.div`
  max-width: 400px;
  padding: 24px;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;


const ComponentsPage: React.FC = () => {
  return (
    <PageWrapper
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Container size="large">
        <Heading level="h1" gradient>UI Components Showcase</Heading>
        <div style={{ marginBottom: 48 }}>
          <Text size="large" color="light">
            A comprehensive overview of all UI components in the Skolr design system
          </Text>
        </div>

        {/* Colors Section */}
        <ComponentSection>
          <Heading level="h2">Colors</Heading>
          <ComponentGrid cols={4} gap="md">
            <div>
              <ColorSwatch $color="#6366F1">Primary</ColorSwatch>
              <Text size="small" align="center">#6366F1</Text>
            </div>
            <div>
              <ColorSwatch $color="#4CBEF3">Blue</ColorSwatch>
              <Text size="small" align="center">#4CBEF3</Text>
            </div>
            <div>
              <ColorSwatch $color="#FE4372">Pink</ColorSwatch>
              <Text size="small" align="center">#FE4372</Text>
            </div>
            <div>
              <ColorSwatch $color="#C848AF">Magenta</ColorSwatch>
              <Text size="small" align="center">#C848AF</Text>
            </div>
          </ComponentGrid>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Pastel Colors</Heading></div>
          <ComponentGrid cols={4} gap="md">
            <div>
              <ColorSwatch $color="#E0F2FE">Pastel Blue</ColorSwatch>
              <Text size="small" align="center">#E0F2FE</Text>
            </div>
            <div>
              <ColorSwatch $color="#EDE9FE">Pastel Purple</ColorSwatch>
              <Text size="small" align="center">#EDE9FE</Text>
            </div>
            <div>
              <ColorSwatch $color="#FCE7F3">Pastel Pink</ColorSwatch>
              <Text size="small" align="center">#FCE7F3</Text>
            </div>
            <div>
              <ColorSwatch $color="#D1FAE5">Pastel Green</ColorSwatch>
              <Text size="small" align="center">#D1FAE5</Text>
            </div>
            <div>
              <ColorSwatch $color="#FEF3C7">Pastel Yellow</ColorSwatch>
              <Text size="small" align="center">#FEF3C7</Text>
            </div>
            <div>
              <ColorSwatch $color="#FED7AA">Pastel Orange</ColorSwatch>
              <Text size="small" align="center">#FED7AA</Text>
            </div>
            <div>
              <ColorSwatch $color="#CFFAFE">Pastel Cyan</ColorSwatch>
              <Text size="small" align="center">#CFFAFE</Text>
            </div>
            <div>
              <ColorSwatch $color="#F3F4F6">Pastel Gray</ColorSwatch>
              <Text size="small" align="center">#F3F4F6</Text>
            </div>
          </ComponentGrid>
        </ComponentSection>

        {/* Buttons Section */}
        <ComponentSection>
          <Heading level="h2">Buttons</Heading>
          
          <Heading level="h3">Variants</Heading>
          <ButtonDemo>
            <ModernButton variant="primary">Primary</ModernButton>
            <ModernButton variant="secondary">Secondary</ModernButton>
            <ModernButton variant="ghost">Ghost</ModernButton>
            <ModernButton variant="danger">Danger</ModernButton>
            <ModernButton variant="success">Success</ModernButton>
            <ModernButton variant="primary" disabled>Disabled</ModernButton>
          </ButtonDemo>

          <Heading level="h3">Sizes</Heading>
          <ButtonDemo>
            <ModernButton size="small">Small</ModernButton>
            <ModernButton size="medium">Medium</ModernButton>
            <ModernButton size="large">Large</ModernButton>
          </ButtonDemo>

          <Heading level="h3">With Icons</Heading>
          <ButtonDemo>
            <ModernButton variant="primary">
              <FiPlus /> Create New
            </ModernButton>
            <ModernButton variant="secondary">
              <FiEdit /> Edit
            </ModernButton>
            <ModernButton variant="danger" size="small">
              <FiTrash2 /> Delete
            </ModernButton>
            <ModernButton variant="ghost">
              Settings <FiSettings />
            </ModernButton>
          </ButtonDemo>

          <Heading level="h3">Icon Buttons</Heading>
          <ButtonDemo>
            <IconButton $variant="primary" $size="small">
              <FiPlus />
            </IconButton>
            <IconButton $variant="secondary">
              <FiEdit />
            </IconButton>
            <IconButton $variant="ghost" $size="large">
              <FiSettings />
            </IconButton>
            <IconButton $variant="danger">
              <FiTrash2 />
            </IconButton>
          </ButtonDemo>

          <Heading level="h3">Full Width</Heading>
          <ButtonDemo style={{ flexDirection: 'column' }}>
            <ModernButton variant="primary" fullWidth>
              Full Width Primary Button
            </ModernButton>
            <ModernButton variant="secondary" fullWidth>
              Full Width Secondary Button
            </ModernButton>
          </ButtonDemo>
        </ComponentSection>

        {/* Cards Section */}
        <ComponentSection>
          <Heading level="h2">Cards</Heading>
          <ComponentGrid cols={3} gap="lg">
            <Card>
              <CardBody>
                <Heading level="h4">Default Card</Heading>
                <Text>This is a default card with standard styling.</Text>
              </CardBody>
            </Card>
            
            <Card variant="pastel" pastelColor="blue">
              <CardBody>
                <Heading level="h4">Pastel Blue Card</Heading>
                <Text>A card with pastel blue background.</Text>
              </CardBody>
            </Card>
            
            <Card variant="pastel" pastelColor="purple" hoverable>
              <CardBody>
                <Heading level="h4">Hoverable Card</Heading>
                <Text>This card scales on hover.</Text>
              </CardBody>
            </Card>
          </ComponentGrid>
        </ComponentSection>

        {/* Typography Section */}
        <ComponentSection>
          <Heading level="h2">Typography</Heading>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Headings</Heading></div>
          <Stack spacing="lg">
            <div>
              <Heading level="h1" noMargin>Heading Level 1</Heading>
              <Text variant="caption" color="muted" noMargin>36px • Bold • Used for page titles</Text>
            </div>
            <div>
              <Heading level="h2" noMargin>Heading Level 2</Heading>
              <Text variant="caption" color="muted" noMargin>24px • Bold • Used for section titles</Text>
            </div>
            <div>
              <Heading level="h3" noMargin>Heading Level 3</Heading>
              <Text variant="caption" color="muted" noMargin>18px • Bold • Used for card titles</Text>
            </div>
            <div>
              <Heading level="h4" noMargin>Heading Level 4</Heading>
              <Text variant="caption" color="muted" noMargin>16px • Bold • Used for sub-headings</Text>
            </div>
            <div>
              <Heading level="h5" noMargin>Heading Level 5</Heading>
              <Text variant="caption" color="muted" noMargin>14px • Bold • Used for small headings</Text>
            </div>
            <div>
              <Heading level="h1" gradient noMargin>Gradient Heading</Heading>
              <Text variant="caption" color="muted" noMargin>36px • Bold • Purple-to-magenta gradient</Text>
            </div>
          </Stack>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Text Sizes</Heading></div>
          <Stack spacing="md">
            <div>
              <Text size="large" noMargin>Large text (18px)</Text>
              <Text variant="caption" color="muted" noMargin>Used for important paragraphs and introductions</Text>
            </div>
            <div>
              <Text size="medium" noMargin>Medium text (14px)</Text>
              <Text variant="caption" color="muted" noMargin>Default body text size</Text>
            </div>
            <div>
              <Text size="small" noMargin>Small text (12px)</Text>
              <Text variant="caption" color="muted" noMargin>Used for captions and secondary information</Text>
            </div>
          </Stack>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Text Variants</Heading></div>
          <Stack spacing="md">
            <div>
              <Text variant="subtitle" noMargin>Subtitle Text</Text>
              <Text variant="caption" color="muted" noMargin>16px • Used for subtitles and descriptions</Text>
            </div>
            <div>
              <Text variant="body" noMargin>Body Text</Text>
              <Text variant="caption" color="muted" noMargin>14px • Default paragraph text</Text>
            </div>
            <div>
              <Text variant="caption" noMargin>Caption Text</Text>
              <Text variant="overline" color="muted" noMargin>12px • Used for captions and labels</Text>
            </div>
            <div>
              <Text variant="overline" noMargin>Overline Text</Text>
              <Text variant="caption" color="muted" noMargin>11px • Uppercase • Used for categories</Text>
            </div>
          </Stack>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Font Weights</Heading></div>
          <Stack spacing="md">
            <div>
              <Text weight="normal" noMargin>Normal weight (400)</Text>
              <Text variant="caption" color="muted" noMargin>Standard body text</Text>
            </div>
            <div>
              <Text weight="medium" noMargin>Medium weight (500)</Text>
              <Text variant="caption" color="muted" noMargin>Slightly emphasized text</Text>
            </div>
            <div>
              <Text weight="semibold" noMargin>Semibold weight (600)</Text>
              <Text variant="caption" color="muted" noMargin>Important text and labels</Text>
            </div>
            <div>
              <Text weight="bold" noMargin>Bold weight (700)</Text>
              <Text variant="caption" color="muted" noMargin>Headings and emphasis</Text>
            </div>
          </Stack>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Text Colors</Heading></div>
          <Stack spacing="md">
            <div>
              <Text color="default" noMargin>Default Text</Text>
              <Text variant="caption" color="muted" noMargin>Primary text color</Text>
            </div>
            <div>
              <Text color="light" noMargin>Light Text</Text>
              <Text variant="caption" color="muted" noMargin>Secondary text color</Text>
            </div>
            <div>
              <Text color="muted" noMargin>Muted Text</Text>
              <Text variant="caption" color="muted" noMargin>Tertiary text color</Text>
            </div>
            <div>
              <Text color="primary" noMargin>Primary Text</Text>
              <Text variant="caption" color="muted" noMargin>Brand purple color</Text>
            </div>
            <div>
              <Text color="success" noMargin>Success Text</Text>
              <Text variant="caption" color="muted" noMargin>Blue success color</Text>
            </div>
            <div>
              <Text color="danger" noMargin>Danger Text</Text>
              <Text variant="caption" color="muted" noMargin>Pink danger color</Text>
            </div>
          </Stack>
        </ComponentSection>

        {/* Badges Section */}
        <ComponentSection>
          <Heading level="h2">Badges</Heading>
          <ButtonDemo>
            <Badge $variant="primary">Primary</Badge>
            <Badge $variant="secondary">Secondary</Badge>
            <Badge $variant="success">Success</Badge>
            <Badge $variant="warning">Warning</Badge>
            <Badge $variant="error">Error</Badge>
            <Badge $variant="info">Info</Badge>
          </ButtonDemo>
          
          <Heading level="h3">Status Badges</Heading>
          <ButtonDemo>
            <StatusBadge isActive={true} icon={<FiCheck />}>Active</StatusBadge>
            <StatusBadge isActive={false} icon={<FiX />}>Inactive</StatusBadge>
          </ButtonDemo>
          
          <Heading level="h3">Code Badges</Heading>
          <ButtonDemo>
            <CodeBadge $variant="primary">ABC123</CodeBadge>
            <CodeBadge $variant="secondary" $gradient>XYZ789</CodeBadge>
          </ButtonDemo>
        </ComponentSection>

        {/* Form Elements Section */}
        <ComponentSection>
          <Heading level="h2">Form Elements</Heading>
          <Grid cols={2} gap="lg">
            <FormDemo>
              <Stack spacing="md">
                <FormGroup>
                  <Label htmlFor="input1">Text Input</Label>
                  <Input id="input1" placeholder="Enter text..." />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="search1">Search Input</Label>
                  <SearchInput id="search1" placeholder="Search..." />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="textarea1">Text Area</Label>
                  <TextArea id="textarea1" placeholder="Enter multiple lines..." rows={4} />
                </FormGroup>
              </Stack>
            </FormDemo>
            
            <FormDemo>
              <Stack spacing="md">
                <FormGroup>
                  <Label htmlFor="select1">Select Dropdown</Label>
                  <Select id="select1">
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Checkboxes</Label>
                  <Stack spacing="sm">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Checkbox /> Option A
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Checkbox /> Option B
                    </label>
                  </Stack>
                </FormGroup>
                
                <FormGroup>
                  <Label>Radio Buttons</Label>
                  <Stack spacing="sm">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio name="radio-demo" /> Choice 1
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio name="radio-demo" /> Choice 2
                    </label>
                  </Stack>
                </FormGroup>
              </Stack>
            </FormDemo>
          </Grid>
        </ComponentSection>

        {/* Unified Cards Section - NEW DESIGN SYSTEM */}
        <ComponentSection>
          <Heading level="h2">🎨 Unified Card Design System</Heading>
          <Text size="large" color="light">
            These are the new standardized card components based on the glassmorphism StatsCard design
          </Text>
          
          <div style={{ marginTop: 32 }}><Heading level="h3">Basic Stats Cards</Heading></div>
          <Grid cols={4} gap="md">
            <UnifiedStatsCard
              icon={<FiUsers />}
              title="Total Users"
              value={1234}
              variant="primary"
            />
            <UnifiedStatsCard
              icon={<FiMessageSquare />}
              title="Active Chats"
              value={567}
              variant="info"
            />
            <UnifiedStatsCard
              icon={<FiBookOpen />}
              title="Lessons"
              value={89}
              variant="success"
            />
            <UnifiedStatsCard
              icon={<FiSettings />}
              title="Settings"
              value="Active"
              variant="secondary"
            />
          </Grid>
          
          <div style={{ marginTop: 48 }}><Heading level="h3">Content Cards (for Rooms, Chatbots, etc.)</Heading></div>
          <Grid cols={3} gap="lg">
            <ContentCard
              title="Mathematics Room"
              subtitle="Room Code: MATH123"
              description="A collaborative space for learning algebra and geometry with interactive exercises and real-time support."
              icon={<FiBookOpen />}
              variant="primary"
              metadata={[
                { label: "Students", value: 24, icon: <FiUsers /> },
                { label: "Skolrs", value: 3, icon: <FiMessageSquare /> },
                { label: "Status", value: "Active" }
              ]}
              actions={
                <ModernButton variant="primary" size="small" fullWidth>
                  <FiChevronRight /> View Room
                </ModernButton>
              }
            />
            
            <ContentCard
              title="Science Bot"
              subtitle="Learning Assistant"
              description="An AI tutor specializing in physics and chemistry concepts with RAG-enabled knowledge base."
              icon={<FiCpu />}
              variant="accent"
              metadata={[
                { label: "Type", value: "Learning" },
                { label: "Model", value: "GPT-4" },
                { label: "RAG", value: "Enabled" }
              ]}
              actions={
                <ButtonGroup>
                  <ModernButton variant="ghost" size="small">Edit</ModernButton>
                  <ModernButton variant="primary" size="small">Test Chat</ModernButton>
                </ButtonGroup>
              }
            />
            
            <ContentCard
              title="History Assessment"
              subtitle="World War II Quiz"
              description="Multiple choice assessment covering major events and figures from 1939-1945."
              icon={<FiClipboard />}
              variant="warning"
              metadata={[
                { label: "Questions", value: 25 },
                { label: "Duration", value: "45 min" },
                { label: "Attempts", value: 142 }
              ]}
              actions={
                <ModernButton variant="secondary" size="small" fullWidth>
                  View Results
                </ModernButton>
              }
            />
          </Grid>
          
          <div style={{ marginTop: 48 }}><Heading level="h3">Summary Cards (for Dashboards & Analytics)</Heading></div>
          <Grid cols={2} gap="lg">
            <SummaryCard
              title="Weekly Performance"
              icon={<FiActivity />}
              variant="primary"
              metrics={[
                { label: "Total Sessions", value: "1,234", trend: "up", trendValue: "+12%" },
                { label: "Avg Duration", value: "24m", trend: "up", trendValue: "+3m" },
                { label: "Completion Rate", value: "87%", trend: "neutral" },
                { label: "Active Users", value: 456, trend: "down", trendValue: "-5%" }
              ]}
              actions={
                <ModernButton variant="ghost" size="small" fullWidth>
                  View Detailed Report →
                </ModernButton>
              }
            />
            
            <SummaryCard
              title="Content Overview"
              icon={<FiDatabase />}
              variant="info"
              metrics={[
                { label: "Documents", value: 142 },
                { label: "Videos", value: 38 },
                { label: "Assessments", value: 24 },
                { label: "Storage Used", value: "2.4 GB" }
              ]}
              actions={
                <ButtonGroup>
                  <ModernButton variant="ghost" size="small">Manage</ModernButton>
                  <ModernButton variant="primary" size="small">Upload New</ModernButton>
                </ButtonGroup>
              }
            />
          </Grid>
        </ComponentSection>

        {/* Legacy Stats Cards Section */}
        <ComponentSection>
          <Heading level="h2">Legacy Stats Cards</Heading>
          <Text color="muted" size="small">These will be replaced with the unified card design</Text>
          <Grid cols={4} gap="md">
            <StatsCard
              icon={<FiUsers />}
              title="Total Users"
              value={1234}
              accentColor="primary"
            />
            <StatsCard
              icon={<FiMessageSquare />}
              title="Active Chats"
              value={567}
              accentColor="primary"
            />
            <StatsCard
              icon={<FiBookOpen />}
              title="Lessons"
              value={89}
              accentColor="success"
            />
            <StatsCard
              icon={<FiSettings />}
              title="Settings"
              value="Active"
              accentColor="secondary"
            />
          </Grid>
        </ComponentSection>

        {/* Tables Section */}
        <ComponentSection>
          <Heading level="h2">Tables</Heading>
          <Card>
            <CardBody>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Room Alpha</TableCell>
                    <TableCell>
                      <StatusBadge isActive={true}>Active</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Badge $variant="primary">Learning</Badge>
                    </TableCell>
                    <TableCell>
                      <ButtonGroup>
                        <ModernButton size="small" variant="ghost">Edit</ModernButton>
                        <ModernButton size="small" variant="danger">Delete</ModernButton>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Room Beta</TableCell>
                    <TableCell>
                      <StatusBadge isActive={false}>Inactive</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Badge $variant="success">Assessment</Badge>
                    </TableCell>
                    <TableCell>
                      <ButtonGroup>
                        <ModernButton size="small" variant="ghost">Edit</ModernButton>
                        <ModernButton size="small" variant="danger">Delete</ModernButton>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </ComponentSection>

        {/* Layout Components */}
        <ComponentSection>
          <Heading level="h2">Layout Components</Heading>
          <Stack spacing="lg">
            <Card>
              <CardBody>
                <Heading level="h4">Flex Layout</Heading>
                <div style={{ marginTop: 16 }}><Flex gap="md" align="center">
                  <Badge $variant="primary">Item 1</Badge>
                  <Badge $variant="secondary">Item 2</Badge>
                  <Badge $variant="success">Item 3</Badge>
                </Flex></div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Heading level="h4">Stack Layout</Heading>
                <div style={{ marginTop: 16 }}><Stack spacing="sm">
                  <Text>Stacked item 1</Text>
                  <Text>Stacked item 2</Text>
                  <Text>Stacked item 3</Text>
                </Stack></div>
              </CardBody>
            </Card>
          </Stack>
        </ComponentSection>
      </Container>
    </PageWrapper>
  );
};

export default ComponentsPage;