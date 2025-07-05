'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiDatabase, 
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiArchive,
  FiBook,
  FiBookOpen,
  FiVideo,
  FiClipboard,
  FiUsers,
  FiToggleLeft,
  FiToggleRight,
  FiCpu
} from 'react-icons/fi';
import { ContentCard, CardVariant } from '@/components/ui/UnifiedCards';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Chatbot } from '@/types/database.types';

interface UnifiedChatbotCardProps {
  chatbot: Chatbot & { student_count?: number };
  onEdit?: (chatbotId: string) => void;
  onDelete: (chatbotId: string, chatbotName: string) => void;
  onArchive: (chatbotId: string, chatbotName: string) => void;
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

// Dropdown styles
const DropdownButton = styled.button`
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const DropdownMenu = styled(motion.div)`
  position: fixed;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  z-index: 10000;
  min-width: 180px;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: ${({ theme }) => `${theme.colors.brand.primary}10`};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.ui.border};
  margin: 4px 0;
`;

const getModelDisplayName = (model: string | undefined | null) => {
  if (!model || model === 'undefined' || model === 'null') return 'Default Model';
  
  const modelNames: Record<string, string> = {
    'x-ai/grok-3-mini-beta': 'Grok-3 Mini',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-preview': 'Gemini 2.5 Flash',
    'openai/gpt-4.1-mini': 'GPT-4.1 Mini',
    'nvidia/llama-3.1-nemotron-ultra-253b-v1': 'Llama-3.1 Nemotron',
    'deepseek/deepseek-r1-0528': 'DeepSeek-R1',
    'minimax/minimax-m1': 'Minimax-M1',
    'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'openai/gpt-4o': 'GPT-4o',
    'openai/gpt-4o-mini': 'GPT-4o Mini',
    'google/gemma-3-27b-it:free': 'Gemma-3 27B',
    'microsoft/phi-4-reasoning-plus:free': 'Phi-4 Reasoning',
    'qwen/qwen3-32b:free': 'Qwen3-32B',
    'qwen/qwen3-235b-a22b:free': 'Qwen3-235B'
  };
  
  if (modelNames[model]) {
    return modelNames[model];
  }
  
  const parts = model.split('/');
  if (parts.length > 1) {
    let modelName = parts[parts.length - 1];
    modelName = modelName.replace(':free', '');
    return modelName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }
  
  return model;
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

// Dropdown portal component
const DropdownPortal: React.FC<{
  children: React.ReactNode;
  position: { top: number; left: number };
}> = ({ children, position }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  return createPortal(
    <div style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 10000 }}>
      {children}
    </div>,
    document.body
  );
};

export const UnifiedChatbotCard: React.FC<UnifiedChatbotCardProps> = ({ 
  chatbot, 
  onEdit, 
  onDelete,
  onArchive 
}) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const botType = chatbot.bot_type as keyof typeof BOT_TYPE_VARIANTS;
  const variant = BOT_TYPE_VARIANTS[botType] || 'primary';
  const icon = BOT_TYPE_ICONS[botType as keyof typeof BOT_TYPE_ICONS] || <FiCpu />;
  
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 140;
      const dropdownWidth = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      
      setDropdownPosition({
        top: spaceBelow < dropdownHeight ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: spaceRight < dropdownWidth ? rect.left - dropdownWidth + rect.width : rect.left
      });
    }
  }, [isDropdownOpen]);
    
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleTestChat = () => {
    router.push(`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/test-chat`);
  };

  return (
    <div style={{ position: 'relative' }}>
      <DropdownButton
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
      >
        <FiMoreVertical />
      </DropdownButton>
      
      <ContentCard
        title={chatbot.name}
        subtitle={`${getBotTypeLabel(chatbot.bot_type || 'learning')} • ${getModelDisplayName(chatbot.model)}`}
        description={chatbot.description}
        icon={icon}
        variant={variant}
        metadata={[
          { 
            label: "Students", 
            value: chatbot.student_count || 0, 
            icon: <FiUsers /> 
          },
          { 
            label: "RAG", 
            value: chatbot.enable_rag ? 'Active' : 'Inactive',
            icon: chatbot.enable_rag ? <FiToggleRight /> : <FiToggleLeft />
          }
        ]}
        actions={
          <ModernButton variant="primary" size="small" fullWidth onClick={handleTestChat}>
            Test Chat →
          </ModernButton>
        }
      />
      
      <AnimatePresence>
        {isDropdownOpen && (
          <DropdownPortal position={dropdownPosition}>
            <DropdownMenu
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DropdownItem as={Link} href={`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/edit`}>
                <FiEdit />
                Edit Skolr
              </DropdownItem>
              <DropdownItem as={Link} href={`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/knowledge-base`}>
                <FiDatabase />
                Manage Knowledge Base
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={() => {
                onArchive(chatbot.chatbot_id, chatbot.name);
                setIsDropdownOpen(false);
              }}>
                <FiArchive />
                {chatbot.is_archived ? 'Restore' : 'Archive'} Skolr
              </DropdownItem>
              <DropdownItem onClick={() => {
                onDelete(chatbot.chatbot_id, chatbot.name);
                setIsDropdownOpen(false);
              }}>
                <FiTrash2 />
                Delete Skolr
              </DropdownItem>
            </DropdownMenu>
          </DropdownPortal>
        )}
      </AnimatePresence>
    </div>
  );
};