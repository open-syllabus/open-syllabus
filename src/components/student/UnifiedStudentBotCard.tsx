'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiMessageSquare, 
  FiHome,
  FiToggleLeft,
  FiToggleRight,
  FiBookOpen,
  FiClipboard,
  FiVideo,
  FiBook,
  FiActivity
} from 'react-icons/fi';
import { ContentCard, CardVariant } from '@/components/ui/UnifiedCards';
import { ModernButton } from '@/components/shared/ModernButton';

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

interface UnifiedStudentSkolrCardProps {
  skolr: StudentSkolr;
}

// Bot type to variant mapping
const BOT_TYPE_VARIANTS: Record<string, CardVariant> = {
  learning: 'primary',
  assessment: 'success',
  reading_room: 'accent',
  viewing_room: 'warning',
  knowledge_book: 'info'
};

// Bot type icons
const BOT_TYPE_ICONS = {
  learning: <FiMessageSquare />,
  assessment: <FiClipboard />,
  reading_room: <FiBookOpen />,
  viewing_room: <FiVideo />,
  knowledge_book: <FiBook />
};

const getBotTypeLabel = (botType: string) => {
  switch (botType) {
    case 'reading_room': return 'Reading';
    case 'viewing_room': return 'Viewing';
    case 'assessment': return 'Assessment';
    case 'knowledge_book': return 'Knowledge';
    default: return 'Learning';
  }
};

export const UnifiedStudentSkolrCard: React.FC<UnifiedStudentSkolrCardProps> = ({ skolr }) => {
  const router = useRouter();
  
  const botType = skolr.bot_type as keyof typeof BOT_TYPE_VARIANTS;
  const variant = BOT_TYPE_VARIANTS[botType] || 'primary';
  const icon = BOT_TYPE_ICONS[botType as keyof typeof BOT_TYPE_ICONS] || <FiMessageSquare />;

  const handleChat = () => {
    router.push(`/chat/${skolr.room_id}?instanceId=${skolr.instance_id}`);
  };

  return (
    <ContentCard
      title={skolr.name}
      subtitle={`${getBotTypeLabel(skolr.bot_type)} • ${skolr.room_name}`}
      description={skolr.description}
      icon={icon}
      variant={variant}
      onClick={handleChat}
      metadata={[
        { 
          label: "Room", 
          value: skolr.room_code, 
          icon: <FiHome /> 
        },
        { 
          label: "Chats", 
          value: skolr.interaction_count || 0,
          icon: <FiActivity />
        },
        { 
          label: "RAG", 
          value: skolr.enable_rag ? 'Active' : 'Inactive',
          icon: skolr.enable_rag ? <FiToggleRight /> : <FiToggleLeft />
        }
      ]}
      actions={
        <ModernButton variant="primary" size="small" fullWidth onClick={handleChat}>
          Start Chat →
        </ModernButton>
      }
    />
  );
};

