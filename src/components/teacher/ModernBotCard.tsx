// Modern Skolr card component with pastel design
import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  FiMessageSquare, 
  FiDatabase, 
  FiActivity,
  FiMoreVertical,
  FiEdit,
  FiPlay,
  FiTrash2,
  FiChevronRight,
  FiCpu,
  FiToggleLeft,
  FiToggleRight,
  FiBookOpen,
  FiClipboard,
  FiVideo,
  FiUsers,
  FiArchive,
  FiBook
} from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Chatbot } from '@/types/database.types';
import { ModernButton } from '@/components/shared/ModernButton';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface ModernChatbotCardProps {
  chatbot: Chatbot & { student_count?: number };
  onEdit?: (chatbotId: string) => void; // Made optional since we'll use navigation
  onDelete: (chatbotId: string, chatbotName: string) => void;
  onArchive: (chatbotId: string, chatbotName: string) => void;
}

// Define accent colors for badges and backgrounds
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

const ChatbotTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  padding-right: 28px;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-right: 28px;
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

const StudentCount = styled.div`
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

const ChatbotDescription = styled.p`
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
  padding-right: 28px;
  margin-bottom: 8px;
`;

const ModelInfo = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.muted};
  opacity: 0.7;
  margin-bottom: 16px;
  font-style: italic;
  padding-right: 28px;
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


// Dropdown styles
const DropdownContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
`;

const CardWrapper = styled.div<{ $bgColor: string; $borderColor: string; $accentColor: string }>`
  position: relative;
  height: 100%;
  background: white;
  border: 2px solid ${({ $accentColor }) => $accentColor};
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: ${({ $bgColor }) => $bgColor};
  }
`;

const DropdownButton = styled.button`
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  svg {
    width: 14px;
    height: 14px;
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
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
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
  if (!model || model === 'undefined' || model === 'null') return 'Default';
  
  // Common model mappings
  const modelNames: Record<string, string> = {
    'x-ai/grok-3-mini-beta': 'Grok-3 Mini',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-preview': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-preview-05-20': 'Gemini 2.5 Flash',
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
  
  // Check if we have a predefined name
  if (modelNames[model]) {
    return modelNames[model];
  }
  
  // Otherwise, extract the model name after the provider
  const parts = model.split('/');
  if (parts.length > 1) {
    // Get the last part and clean it up
    let modelName = parts[parts.length - 1];
    // Remove :free suffix if present
    modelName = modelName.replace(':free', '');
    // Capitalize each word and join with hyphens
    return modelName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  }
  
  return model;
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

export const ModernChatbotCard: React.FC<ModernChatbotCardProps> = ({ 
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
  
  // Get the colors for this bot type
  const botType = chatbot.bot_type as keyof typeof BOT_TYPE_ACCENT_COLORS;
  const accentColor = BOT_TYPE_ACCENT_COLORS[botType] || '#6366F1';
  const bgColor = BOT_TYPE_BG_COLORS[botType] || '#EDE9FE';
  const borderColor = BOT_TYPE_BORDER_COLORS[botType] || '#DDD6FE';
  
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 140; // Approximate height of dropdown
      const dropdownWidth = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      
      // Position dropdown
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

  return (
    <CardWrapper $bgColor={bgColor} $borderColor={borderColor} $accentColor={accentColor}>
      <CardContent>
          <DropdownContainer>
            <DropdownButton
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <FiMoreVertical />
            </DropdownButton>
          </DropdownContainer>
          
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
        
        <Header>
          <ChatbotTitle>{chatbot.name}</ChatbotTitle>
          <MetaInfo>
            <TypeTag $color={accentColor}>
              {chatbot.bot_type === 'reading_room' ? <FiBookOpen /> : 
               chatbot.bot_type === 'viewing_room' ? <FiVideo /> : 
               chatbot.bot_type === 'assessment' ? <FiClipboard /> : 
               chatbot.bot_type === 'knowledge_book' ? <FiBook /> :
               <FiMessageSquare />}
              {chatbot.bot_type === 'reading_room' ? 'Reading' : 
               chatbot.bot_type === 'viewing_room' ? 'Viewing' : 
               chatbot.bot_type === 'assessment' ? 'Assessment' : 
               chatbot.bot_type === 'knowledge_book' ? 'Knowledge' :
               'Learning'}
            </TypeTag>
            <Divider />
            <StudentCount>
              <FiUsers />
              {chatbot.student_count || 0}
            </StudentCount>
            <Divider />
            <KnowledgeStatus $active={chatbot.enable_rag || false}>
              {chatbot.enable_rag ? <FiToggleRight /> : <FiToggleLeft />}
              {chatbot.enable_rag ? 'Active' : 'Inactive'}
            </KnowledgeStatus>
          </MetaInfo>
        </Header>
        
        {chatbot.description && (
          <ChatbotDescription>{chatbot.description}</ChatbotDescription>
        )}
        
        <ModelInfo>
          {getModelDisplayName(chatbot.model)}
        </ModelInfo>
        
        <ActionButton
          $accentColor={accentColor}
          onClick={() => router.push(`/teacher-dashboard/chatbots/${chatbot.chatbot_id}/test-chat`)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Test Chat
          <FiChevronRight />
        </ActionButton>
      </CardContent>
    </CardWrapper>
  );
};