// Student Skolr card component with identical styling to teacher's card
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { 
  FiMessageSquare, 
  FiDatabase, 
  FiActivity,
  FiChevronRight,
  FiToggleLeft,
  FiToggleRight,
  FiBookOpen,
  FiClipboard,
  FiVideo,
  FiBook,
  FiHome
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface StudentSkolr {
  instance_id: string;
  chatbot_id: string;
  room_id: string;
  room_name: string;
  room_code: string;
  name: string;
  description: string;
  model?: string;
  bot_type: string;
  welcome_message?: string;
  enable_rag: boolean;
  interaction_count: number;
  created_at: string;
}

interface StudentSkolrCardProps {
  skolr: StudentSkolr;
}

// Define accent colors for badges and backgrounds (same as teacher)
const BOT_TYPE_ACCENT_COLORS = {
  learning: '#6366F1',  // Primary Purple
  assessment: '#7BBC44', // Green
  reading_room: '#EC4899', // Pink
  viewing_room: '#FFB612', // Orange
  knowledge_book: '#4CBEF3' // Cyan
} as const;

// Define background colors for bot types
const BOT_TYPE_BG_COLORS = {
  learning: '#EDE9FE',  // Light Purple
  assessment: '#D1FAE5', // Light Green
  reading_room: '#FCE7F3', // Light Pink
  viewing_room: '#FEF3C7', // Light Orange
  knowledge_book: '#CFFAFE' // Light Cyan
} as const;

// Define border colors for bot types
const BOT_TYPE_BORDER_COLORS = {
  learning: '#DDD6FE',  // Purple border
  assessment: '#A7F3D0', // Green border
  reading_room: '#F9A8D4', // Pink border
  viewing_room: '#FDE68A', // Orange border
  knowledge_book: '#A5F3FC' // Cyan border
} as const;

const CardWrapper = styled(GlassCard)<{ $bgColor: string; $borderColor: string; $accentColor: string }>`
  position: relative;
  height: 100%;
  border: 2px solid ${({ $accentColor }) => $accentColor};
  cursor: pointer;
  
  &:hover {
    background: ${({ $bgColor }) => $bgColor};
  }
`;

const CardContent = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: 140px;
`;

const Header = styled.div`
  margin-bottom: 12px;
`;

const SkolrTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`;

const TypeTag = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}20;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const Divider = styled.div`
  width: 3px;
  height: 3px;
  background: ${({ theme }) => theme.colors.text.secondary};
  border-radius: 50%;
  opacity: 0.4;
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const KnowledgeStatus = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${({ $active, theme }) => $active ? theme.colors.status.success : theme.colors.text.secondary};
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const SkolrDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  margin-bottom: 8px;
`;

const InteractionInfo = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.muted};
  opacity: 0.7;
  margin-bottom: 16px;
  font-style: italic;
`;

const ActionButton = styled(motion.button)<{ $accentColor: string }>`
  margin-top: auto;
  background: transparent;
  border: none;
  padding: 8px 0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $accentColor }) => $accentColor};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  
  &:hover {
    background: ${({ $accentColor }) => $accentColor}10;
  }
  
  svg {
    width: 12px;
    height: 12px;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(2px);
  }
`;

export const StudentSkolrCard: React.FC<StudentSkolrCardProps> = ({ skolr }) => {
  const router = useRouter();
  
  // Get the colors for this bot type
  const botType = skolr.bot_type as keyof typeof BOT_TYPE_ACCENT_COLORS;
  const accentColor = BOT_TYPE_ACCENT_COLORS[botType] || '#6366F1';
  const bgColor = BOT_TYPE_BG_COLORS[botType] || '#EDE9FE';
  const borderColor = BOT_TYPE_BORDER_COLORS[botType] || '#DDD6FE';
  
  const handleChatClick = () => {
    // Navigate to the chat page with the room ID and instance ID
    router.push(`/chat/${skolr.room_id}?instanceId=${skolr.instance_id}`);
  };

  return (
    <CardWrapper 
      $bgColor={bgColor} 
      $borderColor={borderColor} 
      $accentColor={accentColor}
      variant="light"
      $hoverable
      onClick={handleChatClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <CardContent>
        <Header>
          <SkolrTitle>{skolr.name}</SkolrTitle>
          <MetaInfo>
            <TypeTag $color={accentColor}>
              {skolr.bot_type === 'reading_room' ? <FiBookOpen /> : 
               skolr.bot_type === 'viewing_room' ? <FiVideo /> : 
               skolr.bot_type === 'assessment' ? <FiClipboard /> : 
               skolr.bot_type === 'knowledge_book' ? <FiBook /> :
               <FiMessageSquare />}
              {skolr.bot_type === 'reading_room' ? 'Reading' : 
               skolr.bot_type === 'viewing_room' ? 'Viewing' : 
               skolr.bot_type === 'assessment' ? 'Assessment' : 
               skolr.bot_type === 'knowledge_book' ? 'Knowledge' :
               'Learning'}
            </TypeTag>
            <Divider />
            <RoomInfo>
              <FiHome />
              {skolr.room_name}
            </RoomInfo>
            <Divider />
            <KnowledgeStatus $active={skolr.enable_rag}>
              {skolr.enable_rag ? <FiToggleRight /> : <FiToggleLeft />}
              {skolr.enable_rag ? 'Active' : 'Inactive'}
            </KnowledgeStatus>
          </MetaInfo>
        </Header>
        
        {skolr.description && (
          <SkolrDescription>{skolr.description}</SkolrDescription>
        )}
        
        <InteractionInfo>
          {skolr.interaction_count > 0 
            ? `${skolr.interaction_count} interaction${skolr.interaction_count !== 1 ? 's' : ''}`
            : 'No interactions yet'
          }
        </InteractionInfo>
        
        <ActionButton
          $accentColor={accentColor}
          onClick={(e) => {
            e.stopPropagation();
            handleChatClick();
          }}
        >
          Start Chat
          <FiChevronRight />
        </ActionButton>
      </CardContent>
    </CardWrapper>
  );
};