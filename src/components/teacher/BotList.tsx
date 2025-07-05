// src/components/teacher/BotList.tsx
'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { ModernButton } from '@/components/shared/ModernButton';
import { Grid, Card, CardBody, Text, Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell, Badge } from '@/components/ui';;
import { UnifiedChatbotCard } from './UnifiedBotCard';
import type { Chatbot } from '@/types/database.types';

// Custom styled components for specific needs
const CompactGrid = styled(Grid)`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin: 0 -16px;
    width: calc(100% + 32px);
    
    table {
      min-width: 800px;
    }
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  flex-wrap: nowrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    gap: 4px;
  }
`;

const DescriptionCell = styled(TableCell)`
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    max-width: 150px;
  }
`;

const ChatbotNameLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
    text-decoration: underline;
  }
`;

const getModelDisplayName = (model: string | undefined) => {
  if (!model) return 'Default Model';
  const modelNames: Record<string, string> = {
    'x-ai/grok-3-mini-beta': 'Grok-3 Mini',
    'google/gemini-2.5-flash-preview': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash',
    'openai/gpt-4.1-mini': 'GPT-4.1 Mini',
    'nvidia/llama-3.1-nemotron-ultra-253b-v1': 'Llama-3.1',
  };
  return modelNames[model] || model;
};

const getChatbotTypeVariant = (botType: string | null | undefined): 'primary' | 'warning' | 'info' => {
  if (botType === 'assessment') return 'warning';
  if (botType === 'reading_room') return 'info';
  if (botType === 'knowledge_book') return 'primary';
  return 'primary';
};

const getChatbotTypeLabel = (botType: string | null | undefined): string => {
  if (!botType) return 'Learning';
  if (botType === 'reading_room') return 'Reading';
  if (botType === 'assessment') return 'Assessment';
  if (botType === 'viewing_room') return 'Viewing';
  if (botType === 'knowledge_book') return 'Knowledge';
  return botType.charAt(0).toUpperCase() + botType.slice(1);
};

// Ensure this interface is EXPORTED
export interface ChatbotListProps {
  chatbots: Chatbot[];
  onEdit?: (chatbotId: string) => void; // Made optional since we use navigation now
  onDelete: (chatbotId: string, chatbotName: string) => void;
  onArchive: (chatbotId: string, chatbotName: string) => void; 
  viewMode: 'card' | 'list';
}

export default function ChatbotList({ chatbots, onEdit, onDelete, onArchive, viewMode }: ChatbotListProps) {

  if (chatbots.length === 0) {
    return (
      <Card variant="minimal">
        <CardBody>
          <Text align="center" color="light">No Skolrs found.</Text>
        </CardBody>
      </Card>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (viewMode === 'list') {
    return (
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Model</TableHeaderCell>
              <TableHeaderCell>Knowledge</TableHeaderCell>
              <TableHeaderCell>Last Modified</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((chatbot) => (
              <TableRow key={chatbot.chatbot_id}>
                <TableCell>
                  <ChatbotNameLink href={`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/test-chat`} title={`Test chat with ${chatbot.name}`}>
                    {chatbot.name}
                  </ChatbotNameLink>
                </TableCell>
                <TableCell>
                  <Badge $variant={getChatbotTypeVariant(chatbot.bot_type)}>
                    {getChatbotTypeLabel(chatbot.bot_type)}
                  </Badge>
                </TableCell>
                <DescriptionCell title={chatbot.description || undefined}>
                  {chatbot.description || '-'}
                </DescriptionCell>
                <TableCell>{getModelDisplayName(chatbot.model)}</TableCell>
                <TableCell>
                  <Badge $variant={chatbot.enable_rag ? 'success' : 'default'}>
                    {chatbot.enable_rag ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(chatbot.updated_at || chatbot.created_at)}</TableCell>
                <TableCell>
                  <ActionButtonsContainer>
                    <Link href={`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/test-chat`}>
                      <ModernButton
                        size="small"
                        variant="primary"
                        as="span"
                      >
                        Test
                      </ModernButton>
                    </Link>
                    <ModernButton                     size="small"
                      variant="ghost"
                      onClick={() => onEdit?.(chatbot.chatbot_id)}
                    >
                      Edit
                    </ModernButton>
                    <ModernButton                     size="small"
                      variant="ghost"
                      onClick={() => onDelete(chatbot.chatbot_id, chatbot.name)}
                    >
                      Delete
                    </ModernButton>
                  </ActionButtonsContainer>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <CompactGrid cols={3} gap="md" minItemWidth="280px">
      {chatbots.map((chatbot) => (
        <UnifiedChatbotCard
          key={chatbot.chatbot_id}
          chatbot={chatbot}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ))}
    </CompactGrid>
  );
}