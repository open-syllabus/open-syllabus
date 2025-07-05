// Portrait-style notebook card component for students
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiBook,
  FiStar,
  FiEdit3,
  FiClock,
  FiFileText
} from 'react-icons/fi';
import Link from 'next/link';
import type { Chatbot } from '@/types/database.types';

// Define notebook interface
interface Notebook {
  notebook_id: string;
  student_id: string;
  chatbot_id: string;
  name: string;  // Primary display field
  title?: string; // Optional for compatibility
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  chatbot?: Partial<Chatbot>;
  entry_count?: number;
  last_entry_date?: string;
}

interface NotebookCardProps {
  notebook: Notebook;
  onToggleStar?: (notebookId: string) => void;
}

// Portrait-oriented card wrapper
const CardWrapper = styled(motion.div)`
  width: 200px;
  height: 280px;
  position: relative;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 160px;
    height: 240px;
  }
`;

// Notebook-style card with realistic design
const NotebookBody = styled.div<{ $color: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: 8px 12px 12px 8px;
  position: relative;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset -2px 0 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.15),
      inset -2px 0 0 rgba(0, 0, 0, 0.1);
  }
  
  // Notebook spiral binding effect
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 30px;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.05) 0%,
      transparent 100%
    );
  }
  
  // Spiral holes
  &::after {
    content: '';
    position: absolute;
    left: 12px;
    top: 20px;
    bottom: 20px;
    width: 2px;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 8px,
      rgba(0, 0, 0, 0.3) 8px,
      rgba(0, 0, 0, 0.3) 10px
    );
  }
`;

// Notebook content area
const NotebookContent = styled.div`
  padding: 24px;
  padding-left: 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px;
    padding-left: 36px;
  }
`;

// Label on the notebook cover
const NotebookLabel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const NotebookTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`;

const NotebookMeta = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: white;
  opacity: 0.9;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

// Star button
const StarButton = styled(motion.button)<{ $isStarred: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  background: ${({ $isStarred }) => $isStarred ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'};
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${({ $isStarred }) => $isStarred ? '#FFB800' : 'white'};
    fill: ${({ $isStarred }) => $isStarred ? '#FFB800' : 'none'};
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

// Notebook colors palette
const notebookColors = [
  '#6366F1', // Primary Purple
  '#4CBEF3', // Accent Cyan
  '#C848AF', // Magenta
  '#FFB612', // Secondary Orange
  '#7BBC44', // Green
  '#FE4372', // Coral
  '#3B82F6', // Blue (similar to primary)
  '#EF4444', // Red (similar to danger)
];

// Get consistent color for notebook based on ID
const getNotebookColor = (notebookId: string) => {
  let hash = 0;
  for (let i = 0; i < notebookId.length; i++) {
    hash = notebookId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return notebookColors[Math.abs(hash) % notebookColors.length];
};

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    if (diffInHours < 1) return 'Just now';
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export function NotebookCard({ notebook, onToggleStar }: NotebookCardProps) {
  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(notebook.notebook_id);
    }
  };
  
  const notebookColor = getNotebookColor(notebook.notebook_id);
  
  return (
    <Link href={`/student/notebooks/${notebook.notebook_id}`} passHref>
      <CardWrapper
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <NotebookBody $color={notebookColor}>
          {onToggleStar && (
            <StarButton
              $isStarred={notebook.is_starred}
              onClick={handleStarClick}
              whileTap={{ scale: 0.9 }}
            >
              <FiStar />
            </StarButton>
          )}
          
          <NotebookContent>
            <NotebookLabel>
              <NotebookTitle>{notebook.name || notebook.title}</NotebookTitle>
            </NotebookLabel>
            
            <NotebookMeta>
              <MetaItem>
                <FiFileText />
                {notebook.entry_count || 0} notes
              </MetaItem>
              <MetaItem>
                <FiClock />
                {formatDate(notebook.last_entry_date || notebook.updated_at)}
              </MetaItem>
            </NotebookMeta>
          </NotebookContent>
        </NotebookBody>
      </CardWrapper>
    </Link>
  );
}