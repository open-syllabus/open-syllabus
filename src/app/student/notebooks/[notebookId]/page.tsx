// Individual notebook page with enhanced inline notes and highlighting
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { 
  FiChevronLeft, 
  FiEdit2, 
  FiTrash2, 
  FiDownload,
  FiCopy,
  FiCheck,
  FiX,
  FiStar,
  FiEdit3,
  FiMessageSquare,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiEyeOff,
  FiBookOpen
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import LightbulbLoader from '@/components/shared/LightbulbLoader';
import { ModernButton } from '@/components/shared/ModernButton';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { Toast } from '@/components/shared/Toast';
import { StudyGuideModal } from '@/components/shared/StudyGuideModal';
import { createClient } from '@/lib/supabase/client';

// Import proper types
import type { 
  NotebookEntryWithAnnotations, 
  HighlightColor,
  NotebookHighlight,
  NotebookStudentNote 
} from '@/types/notebook.types';

interface Notebook {
  notebook_id: string;
  student_id: string;
  chatbot_id: string;
  name: string;
  title?: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
  padding: ${({ theme }) => theme.spacing.xl} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg} 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

const Header = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.brand.primary};
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  margin: -${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 1;
`;

const Title = styled.h1<{ $isEditing?: boolean }>`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  display: ${({ $isEditing }) => $isEditing ? 'none' : 'block'};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 24px;
  }
`;

const TitleInput = styled.input`
  font-size: 28px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 2px solid ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  width: 100%;
  background: white;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 24px;
  }
`;

const StarButton = styled(motion.button)<{ $isStarred: boolean }>`
  background: ${({ theme, $isStarred }) => 
    $isStarred ? theme.colors.brand.secondary + '20' : 'transparent'
  };
  border: 2px solid ${({ theme, $isStarred }) => 
    $isStarred ? theme.colors.brand.secondary : theme.colors.ui.border
  };
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme, $isStarred }) => 
      $isStarred ? theme.colors.brand.secondary : theme.colors.text.secondary
    };
    fill: ${({ theme, $isStarred }) => 
      $isStarred ? theme.colors.brand.secondary : 'none'
    };
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.secondary + '20'};
    border-color: ${({ theme }) => theme.colors.brand.secondary};
    
    svg {
      color: ${({ theme }) => theme.colors.brand.secondary};
    }
  }
`;

const MetaInfo = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  span {
    margin: 0 ${({ theme }) => theme.spacing.xs};
  }
`;

const StudyGuidesSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border}20;
`;

const StudyGuidesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const StudyGuideCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.pastelBlue}10;
  border: 1px solid ${({ theme }) => theme.colors.ui.pastelBlue}40;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.pastelBlue}20;
    border-color: ${({ theme }) => theme.colors.ui.pastelBlue};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.soft};
  }
`;

const StudyGuideCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StudyGuideTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  flex: 1;
`;

const StudyGuideDate = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StudyGuideActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const EntriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const EntryCard = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  overflow: visible;
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
`;

const NoteContainer = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const QuestionSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.pastelBlue}10;
  border-left: 4px solid ${({ theme }) => theme.colors.ui.pastelBlue};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const QuestionLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: 600;
`;

const QuestionText = styled.div`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
  line-height: 1.6;
`;

const AnswerSection = styled.div<{ $hasMarginNotes?: boolean }>`
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.8;
  font-size: 1rem;
  position: relative;
  margin-right: ${({ $hasMarginNotes }) => $hasMarginNotes ? '280px' : '0'};
  transition: margin-right ${({ theme }) => theme.transitions.fast};
  user-select: text;
  cursor: text;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-right: 0;
  }
  
  /* Markdown styling */
  h1, h2, h3, h4, h5, h6 {
    margin-top: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    font-weight: 600;
    line-height: 1.3;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1.125rem; }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
    position: relative;
  }
  
  ul, ol {
    margin: ${({ theme }) => theme.spacing.md} 0;
    padding-left: ${({ theme }) => theme.spacing.xl};
    list-style-position: inside;
  }
  
  li {
    margin-bottom: 0; /* Margin is now on ListItemWrapper */
    position: relative;
  }
  
  blockquote {
    margin: ${({ theme }) => theme.spacing.lg} 0;
    padding-left: ${({ theme }) => theme.spacing.lg};
    border-left: 4px solid ${({ theme }) => theme.colors.ui.border};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-style: italic;
  }
  
  code {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
    padding: 0.125rem 0.375rem;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.875em;
  }
  
  pre {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
    padding: ${({ theme }) => theme.spacing.md};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    overflow-x: auto;
    margin: ${({ theme }) => theme.spacing.md} 0;
    
    code {
      background: none;
      padding: 0;
    }
  }
  
  a {
    color: ${({ theme }) => theme.colors.brand.primary};
    text-decoration: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.brand.primary}30;
    transition: all ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      border-bottom-color: ${({ theme }) => theme.colors.brand.primary};
    }
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: ${({ theme }) => theme.spacing.lg} 0;
    
    th, td {
      padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
      border: 1px solid ${({ theme }) => theme.colors.ui.border};
      text-align: left;
    }
    
    th {
      background: ${({ theme }) => theme.colors.ui.pastelGray};
      font-weight: 600;
    }
  }
  
  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
    margin: ${({ theme }) => theme.spacing.xl} 0;
  }
`;

const EntryHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.ui.pastelGray}50;
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border}20;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EntryDate = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EntryActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxxl} 0;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  
  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 1.125rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const ExportMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  overflow: hidden;
  min-width: 180px;
  z-index: 10;
`;

const ExportOption = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.pastelGray};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Enhanced highlighting components
const HighlightToolbar = styled(motion.div)`
  position: fixed;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xs};
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  z-index: 1000;
`;

const HighlightButton = styled.button<{ $color?: HighlightColor; $isNote?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $color, $isNote }) => {
    if ($isNote) return '#FFFFFF';
    switch($color) {
      case 'yellow': return '#FEF3C7';
      case 'green': return '#D1FAE5';
      case 'blue': return '#DBEAFE';
      case 'pink': return '#FCE7F3';
      case 'orange': return '#FED7AA';
      default: return '#FEF3C7';
    }
  }};
  
  &:hover {
    transform: scale(1.1);
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const HighlightedText = styled.span<{ $color: HighlightColor }>`
  background-color: ${({ $color }) => {
    switch($color) {
      case 'yellow': return '#FEF3C7';
      case 'green': return '#D1FAE5';
      case 'blue': return '#DBEAFE';
      case 'pink': return '#FCE7F3';
      case 'orange': return '#FED7AA';
      default: return '#FEF3C7';
    }
  }};
  padding: 0 2px;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    filter: brightness(0.9);
  }
`;

// Inline note components
const InlineNoteMarker = styled.sup`
  color: ${({ theme }) => theme.colors.brand.primary};
  font-weight: 600;
  cursor: pointer;
  margin-left: 2px;
  font-size: 0.75em;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary}20;
    padding: 0 4px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }
`;

const MarginNotesContainer = styled.div`
  position: absolute;
  right: -280px;
  top: 0;
  width: 260px;
  padding-left: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const MarginNote = styled(motion.div)<{ $top: number }>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  width: 100%;
  background: ${({ theme }) => theme.colors.ui.pastelYellow}20;
  border: 1px solid ${({ theme }) => theme.colors.ui.pastelYellow}60;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: 0.875rem;
  line-height: 1.5;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const NoteContent = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const NoteActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  justify-content: flex-end;
`;

const NoteActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const InlineNoteInput = styled(motion.div)`
  position: absolute;
  background: white;
  border: 2px solid ${({ theme }) => theme.colors.brand.primary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.sm};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 100;
  width: 300px;
`;

const NoteTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const NoteInputActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
  justify-content: flex-end;
`;

const ClickableContent = styled.div`
  cursor: text;
  user-select: text;
  position: relative;
`;

const AddNoteHint = styled.button`
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.brand.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.brand.primary}30;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  z-index: 10;
  padding: 0;
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary}20;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    opacity: 1;
  }
  
  svg {
    width: 12px;
    height: 12px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const ParagraphWrapper = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  &:hover .add-note-hint {
    opacity: 1;
  }
`;

const ListItemWrapper = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  
  &:hover .add-note-hint {
    opacity: 1;
  }
`;

// Mobile note list for tablets and phones
const MobileNotesList = styled.div`
  display: none;
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border}20;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: block;
  }
`;

const MobileNoteCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.pastelYellow}20;
  border: 1px solid ${({ theme }) => theme.colors.ui.pastelYellow}60;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const MobileNoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Helper function to get text position in DOM, excluding note markers
const getTextPositionInDOM = (container: HTMLElement, targetNode: Node, targetOffset: number): number => {
  let position = 0;
  let found = false;

  const walkTextNodes = (node: Node): void => {
    if (found) return;
    
    // Skip note marker elements
    if (node.nodeType === Node.ELEMENT_NODE && 
        (node as HTMLElement).hasAttribute('data-note-id')) {
      return;
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      if (node === targetNode) {
        position += targetOffset;
        found = true;
        return;
      }
      position += node.textContent?.length || 0;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        walkTextNodes(node.childNodes[i]);
        if (found) return;
      }
    }
  };

  walkTextNodes(container);
  return position;
};

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params?.notebookId as string;
  const supabase = createClient();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [entries, setEntries] = useState<NotebookEntryWithAnnotations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedText, setSelectedText] = useState<{text: string, entryId: string, start: number, end: number} | null>(null);
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputPosition, setNoteInputPosition] = useState({ x: 0, y: 0, entryId: '', position: 0 });
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Study guide state
  const [isGeneratingStudyGuide, setIsGeneratingStudyGuide] = useState(false);
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  const [studyGuideContent, setStudyGuideContent] = useState('');
  const [existingStudyGuides, setExistingStudyGuides] = useState<any[]>([]);
  const [selectedStudyGuideId, setSelectedStudyGuideId] = useState<string | null>(null);
  
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const noteMarkersRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Apply highlights to rendered content
  useEffect(() => {
    entries.forEach(entry => {
      if (entry.highlights && entry.highlights.length > 0) {
        const container = contentRefs.current[entry.entry_id];
        if (container) {
          applyHighlightsToDOM(container, entry.highlights, entry.entry_id);
        }
      }
    });
  }, [entries]);

  const applyHighlightsToDOM = (container: HTMLElement, highlights: NotebookHighlight[], entryId: string) => {
    // Clear existing highlights first
    const existingHighlights = container.querySelectorAll('[data-highlight-id]');
    existingHighlights.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize(); // Merge adjacent text nodes
      }
    });

    // Apply highlights by matching the actual selected text instead of positions
    highlights.forEach(highlight => {
      try {
        // Find all text nodes in the container
        const walker = document.createTreeWalker(
          container,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip text nodes that are inside note markers or other HTML elements we added
              const parent = node.parentElement;
              if (parent?.hasAttribute('data-note-id') || parent?.tagName === 'SUP') {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let allText = '';
        const textNodes: Text[] = [];
        
        // Collect all text content and nodes
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          textNodes.push(node);
          allText += node.textContent || '';
        }

        // Find the highlight text in the combined text
        const highlightStart = allText.indexOf(highlight.selected_text);
        if (highlightStart === -1) {
          console.warn('Could not find highlight text:', highlight.selected_text);
          return;
        }
        
        const highlightEnd = highlightStart + highlight.selected_text.length;

        // Find which text node(s) contain the highlight
        let currentPos = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;

        for (const node of textNodes) {
          const nodeLength = node.textContent?.length || 0;
          
          if (startNode === null && currentPos + nodeLength > highlightStart) {
            startNode = node;
            startOffset = highlightStart - currentPos;
          }
          
          if (currentPos + nodeLength >= highlightEnd) {
            endNode = node;
            endOffset = highlightEnd - currentPos;
            break;
          }
          
          currentPos += nodeLength;
        }

        if (startNode && endNode && startOffset >= 0 && endOffset > 0) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          const span = document.createElement('span');
          span.setAttribute('data-highlight-id', highlight.highlight_id);
          span.style.backgroundColor = getHighlightColor(highlight.color);
          span.style.padding = '0 2px';
          span.style.borderRadius = '2px';
          span.style.cursor = 'pointer';
          span.title = 'Double-click to remove highlight';
          
          span.addEventListener('dblclick', () => handleDeleteHighlight(entryId, highlight.highlight_id));
          span.addEventListener('mouseenter', () => span.style.filter = 'brightness(0.9)');
          span.addEventListener('mouseleave', () => span.style.filter = 'brightness(1)');

          try {
            range.surroundContents(span);
          } catch (e) {
            // If surroundContents fails, extract and wrap the content
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        }
      } catch (error) {
        console.error('Error applying highlight:', error);
      }
    });
  };

  const getHighlightColor = (color: HighlightColor): string => {
    switch(color) {
      case 'yellow': return '#FEF3C7';
      case 'green': return '#D1FAE5';
      case 'blue': return '#DBEAFE';
      case 'pink': return '#FCE7F3';
      case 'orange': return '#FED7AA';
      default: return '#FEF3C7';
    }
  };

  // Helper function to show confirmation modal
  const showConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  // Helper function to show toast
  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    if (notebookId) {
      fetchNotebookAndEntries();
      fetchStudyGuides();
    }
  }, [notebookId]);

  const fetchStudyGuides = async () => {
    try {
      const response = await fetch(`/api/student/study-guides?notebook_id=${notebookId}`);
      const data = await response.json();
      
      if (response.ok && data.studyGuides) {
        setExistingStudyGuides(data.studyGuides);
      }
    } catch (error) {
      console.error('Error fetching study guides:', error);
    }
  };

  // Handle click outside to close toolbars
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (!target.closest('.highlight-toolbar') && showHighlightToolbar) {
        setShowHighlightToolbar(false);
        setSelectedText(null);
      }
      
      if (!target.closest('.note-input') && !target.closest('.add-note-hint') && showNoteInput) {
        setShowNoteInput(false);
        setNewNoteContent('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHighlightToolbar, showNoteInput]);

  const fetchNotebookAndEntries = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/student/notebooks/${notebookId}/entries`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching notebook:', data.error);
        router.push('/student/notebooks');
        return;
      }

      setNotebook(data.notebook);
      setEntries(data.entries || []);
      setNewTitle(data.notebook.title || data.notebook.name);
    } catch (error) {
      console.error('Error:', error);
      router.push('/student/notebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!notebook) {
      setIsEditingTitle(false);
      return;
    }
    const currentTitle = notebook.title || notebook.name;
    if (newTitle === currentTitle) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch('/api/student/notebooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebook.notebook_id,
          title: newTitle
        })
      });

      if (response.ok) {
        setNotebook({ ...notebook, title: newTitle });
      }
    } catch (error) {
      console.error('Error updating title:', error);
      setNewTitle(notebook.title || notebook.name);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleToggleStar = async () => {
    if (!notebook) return;

    const newStarredState = !(notebook.is_starred || false);
    
    // Optimistic update
    setNotebook({ ...notebook, is_starred: newStarredState });

    try {
      const response = await fetch('/api/student/notebooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebook.notebook_id,
          is_starred: newStarredState
        })
      });

      if (!response.ok) {
        // Revert on error
        setNotebook({ ...notebook, is_starred: notebook.is_starred || false });
      }
    } catch (error) {
      console.error('Error updating star:', error);
      setNotebook({ ...notebook, is_starred: notebook.is_starred || false });
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    showConfirmation(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`/api/student/notebooks/${notebookId}/entries?entryId=${entryId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setEntries(entries.filter(e => e.entry_id !== entryId));
          }
        } catch (error) {
          console.error('Error deleting entry:', error);
        }
      }
    );
  };

  const handleCopyEntry = async (entry: NotebookEntryWithAnnotations) => {
    try {
      await navigator.clipboard.writeText(entry.content);
      setCopiedEntryId(entry.entry_id);
      setTimeout(() => setCopiedEntryId(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  // Enhanced text selection handler
  const handleTextSelection = useCallback((entryId: string) => {
    console.log('Text selection triggered for entry:', entryId);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection or no range');
      return;
    }
    
    const range = selection.getRangeAt(0);
    const container = contentRefs.current[entryId];
    if (!container) return;

    // Extract the actual text content, excluding note markers
    const clonedRange = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(clonedRange);
    
    // Remove note markers from the selection
    const noteMarkers = tempDiv.querySelectorAll('[data-note-id]');
    noteMarkers.forEach(marker => marker.remove());
    
    const selectedText = tempDiv.textContent?.trim() || '';
    console.log('Selected text (cleaned):', selectedText);
    
    if (!selectedText) {
      setShowHighlightToolbar(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    
    // Calculate position relative to the entry content, excluding note markers
    const startPos = getTextPositionInDOM(container, range.startContainer, range.startOffset);
    const endPos = startPos + selectedText.length;

    setSelectedText({
      text: selectedText,
      entryId,
      start: startPos,
      end: endPos
    });
    
    setToolbarPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    
    console.log('Setting toolbar position:', { x: rect.left + rect.width / 2, y: rect.top - 10 });
    console.log('Setting showHighlightToolbar to true');
    setShowHighlightToolbar(true);
  }, []);

  // Handle highlight creation
  const handleCreateHighlight = async (color: HighlightColor) => {
    console.log('handleCreateHighlight called with color:', color);
    console.log('selectedText:', selectedText);
    
    if (!selectedText) {
      console.log('No selectedText available, exiting');
      return;
    }

    console.log('Making API request to create highlight...');
    try {
      const response = await fetch(`/api/student/notebooks/${notebookId}/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: selectedText.entryId,
          start_position: selectedText.start,
          end_position: selectedText.end,
          selected_text: selectedText.text,
          color
        })
      });
      
      console.log('API response status:', response.status);

      if (response.ok) {
        const { highlight } = await response.json();
        console.log('Highlight created successfully:', highlight);
        
        // Update local state
        setEntries(entries.map(entry => {
          if (entry.entry_id === selectedText.entryId) {
            const updatedEntry = {
              ...entry,
              highlights: [...(entry.highlights || []), highlight]
            };
            console.log('Updated entry with highlight:', updatedEntry);
            return updatedEntry;
          }
          return entry;
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to create highlight:', response.status, errorData);
        showToastMessage(`Failed to save highlight: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
      showToastMessage('Error creating highlight. Please try again.', 'error');
    }

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowHighlightToolbar(false);
    setSelectedText(null);
  };

  // Handle highlight deletion
  const handleDeleteHighlight = async (entryId: string, highlightId: string) => {
    try {
      const response = await fetch(`/api/student/notebooks/${notebookId}/highlights?highlightId=${highlightId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEntries(entries.map(entry => {
          if (entry.entry_id === entryId) {
            return {
              ...entry,
              highlights: entry.highlights?.filter(h => h.highlight_id !== highlightId) || []
            };
          }
          return entry;
        }));
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  // Handle clearing all highlights for an entry
  const handleClearAllHighlights = (entryId: string, highlightCount: number) => {
    showConfirmation(
      'Clear All Highlights',
      `Are you sure you want to remove all ${highlightCount} highlights from this note? This action cannot be undone.`,
      async () => {
        const entry = entries.find(e => e.entry_id === entryId);
        if (!entry?.highlights) return;

        try {
          // Delete all highlights for this entry
          const deletePromises = entry.highlights.map(highlight =>
            fetch(`/api/student/notebooks/${notebookId}/highlights?highlightId=${highlight.highlight_id}`, {
              method: 'DELETE'
            })
          );

          const responses = await Promise.all(deletePromises);
          const allSuccessful = responses.every(response => response.ok);

          if (allSuccessful) {
            setEntries(entries.map(e => {
              if (e.entry_id === entryId) {
                return {
                  ...e,
                  highlights: []
                };
              }
              return e;
            }));
            showToastMessage('All highlights cleared successfully', 'success');
          } else {
            showToastMessage('Some highlights could not be cleared', 'error');
          }
        } catch (error) {
          console.error('Error clearing highlights:', error);
          showToastMessage('Error clearing highlights. Please try again.', 'error');
        }
      }
    );
  };

  // Handle inline note creation
  const handleAddInlineNote = (entryId: string, position: number, x: number, y: number) => {
    setNoteInputPosition({ x, y, entryId, position });
    setNewNoteContent('');
    setShowNoteInput(true);
  };

  // Handle add note button click
  const handleAddNoteClick = (e: React.MouseEvent<HTMLButtonElement>, entryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const container = contentRefs.current[entryId];
    if (container) {
      const wrapper = button.closest('.paragraph-wrapper, .list-item-wrapper');
      if (wrapper) {
        const textElement = wrapper.querySelector('p, li');
        if (textElement && textElement.firstChild) {
          // Get the end position of the paragraph/list item
          const position = getTextPositionInDOM(container, textElement, textElement.textContent?.length || 0);
          handleAddInlineNote(entryId, position, rect.left, rect.bottom + 5);
        }
      }
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const response = await fetch(`/api/student/notebooks/${notebookId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: noteInputPosition.entryId,
          content: newNoteContent,
          anchor_position: noteInputPosition.position
        })
      });

      if (response.ok) {
        const { note } = await response.json();
        
        setEntries(entries.map(entry => {
          if (entry.entry_id === noteInputPosition.entryId) {
            return {
              ...entry,
              student_notes: [...(entry.student_notes || []), note].sort((a, b) => 
                (a.anchor_position || 0) - (b.anchor_position || 0)
              )
            };
          }
          return entry;
        }));
        
        setShowNoteInput(false);
        setNewNoteContent('');
      } else {
        const errorData = await response.json();
        console.error('Failed to create note:', response.status, errorData);
        showToastMessage(`Failed to save note: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      showToastMessage('Error creating note. Please try again.', 'error');
    }
  };

  // Handle note update
  const handleUpdateNote = async (entryId: string, noteId: string) => {
    if (!editNoteContent.trim()) return;

    try {
      const response = await fetch(`/api/student/notebooks/${notebookId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: noteId,
          content: editNoteContent
        })
      });

      if (response.ok) {
        setEntries(entries.map(entry => {
          if (entry.entry_id === entryId) {
            return {
              ...entry,
              student_notes: entry.student_notes?.map(n => 
                n.note_id === noteId ? { ...n, content: editNoteContent } : n
              ) || []
            };
          }
          return entry;
        }));
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
    
    setEditingNoteId(null);
    setEditNoteContent('');
  };

  // Handle note deletion
  const handleDeleteNote = (entryId: string, noteId: string) => {
    showConfirmation(
      'Delete Student Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`/api/student/notebooks/${notebookId}/notes?noteId=${noteId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setEntries(entries.map(entry => {
              if (entry.entry_id === entryId) {
                return {
                  ...entry,
                  student_notes: entry.student_notes?.filter(n => n.note_id !== noteId) || []
                };
              }
              return entry;
            }));
          }
        } catch (error) {
          console.error('Error deleting note:', error);
        }
      }
    );
  };

  // For now, let's simplify and just use regular ReactMarkdown with notes only
  // We'll implement a different highlighting approach later
  const renderEnhancedContent = (
    content: string, 
    highlights: NotebookHighlight[] = [], 
    notes: NotebookStudentNote[] = [],
    entryId: string
  ): React.ReactNode => {
    if (!content) return null;

    // Process content with note markers only for now
    let processedContent = content;
    
    // Insert note markers
    if (notes && notes.length > 0) {
      const sortedNotes = [...notes].sort((a, b) => (a.anchor_position || 0) - (b.anchor_position || 0));
      let offset = 0;
      
      sortedNotes.forEach((note, index) => {
        const noteNumber = index + 1;
        let position = (note.anchor_position || 0) + offset;
        
        // Find a good position to insert the marker - prefer end of words or sentences
        const beforePos = Math.min(position + 20, processedContent.length); // Look ahead 20 chars
        const textAroundPosition = processedContent.slice(Math.max(0, position - 10), beforePos);
        
        // Look for word boundaries after the target position
        const afterText = processedContent.slice(position);
        const wordBoundaryMatch = afterText.match(/^(\S*?)(\s|[.!?]|$)/);
        
        if (wordBoundaryMatch) {
          // Move to the end of the current word
          position += wordBoundaryMatch[1].length;
        }
        
        // Insert the note marker at the adjusted position
        const before = processedContent.slice(0, position);
        const after = processedContent.slice(position);
        const marker = `<sup data-note-id="${note.note_id}" style="color: #6366F1; font-weight: 600; cursor: pointer; margin-left: 2px; font-size: 0.75em;">[${noteNumber}]</sup>`;
        
        processedContent = before + marker + after;
        offset += marker.length;
      });
    }

    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children, ...props }) => (
            <ParagraphWrapper className="paragraph-wrapper">
              <AddNoteHint 
                className="add-note-hint"
                type="button"
                aria-label="Add note"
                onClick={(e) => handleAddNoteClick(e, entryId)}
              >
                <FiPlus />
              </AddNoteHint>
              <p {...props}>{children}</p>
            </ParagraphWrapper>
          ),
          li: ({ children, ...props }) => (
            <ListItemWrapper className="list-item-wrapper">
              <AddNoteHint 
                className="add-note-hint" 
                style={{ left: '-40px' }}
                type="button"
                aria-label="Add note"
                onClick={(e) => handleAddNoteClick(e, entryId)}
              >
                <FiPlus />
              </AddNoteHint>
              <li {...props}>{children}</li>
            </ListItemWrapper>
          ),
          sup: ({ children, ...props }) => {
            // Handle our note markers
            const noteId = (props as any)['data-note-id'];
            if (noteId) {
              return (
                <InlineNoteMarker
                  onClick={() => setHoveredNoteId(hoveredNoteId === noteId ? null : noteId)}
                  ref={(el) => { if (el) noteMarkersRef.current[noteId] = el; }}
                  {...props}
                >
                  {children}
                </InlineNoteMarker>
              );
            }
            return <sup {...props}>{children}</sup>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  // Calculate margin note positions
  const getMarginNotePosition = (noteId: string, entryNotes: NotebookStudentNote[]): number => {
    // Space notes evenly based on their order within this entry
    const noteIndex = entryNotes.findIndex(n => n.note_id === noteId);
    return noteIndex * 80; // Space notes 80px apart
  };

  const handleGenerateStudyGuide = async () => {
    if (entries.length === 0) {
      showToastMessage('No notes to convert into study guide', 'warning');
      return;
    }

    setIsGeneratingStudyGuide(true);
    showToastMessage('Generating your study guide... This may take a moment', 'info');

    try {
      const response = await fetch(`/api/student/notebooks/${notebookId}/study-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate study guide');
      }

      const { studyGuide, studyGuideId, saved } = await response.json();
      
      setStudyGuideContent(studyGuide);
      if (saved && studyGuideId) {
        setSelectedStudyGuideId(studyGuideId);
      }
      setShowStudyGuide(true);
      
      if (saved) {
        showToastMessage('Study guide generated successfully! View it in the Study Guides section.', 'success');
        // Fetch the updated list of study guides
        await fetchStudyGuides();
      } else {
        showToastMessage('Study guide generated but not saved', 'warning');
      }
    } catch (error) {
      console.error('Error generating study guide:', error);
      showToastMessage(
        error instanceof Error ? error.message : 'Failed to generate study guide', 
        'error'
      );
    } finally {
      setIsGeneratingStudyGuide(false);
    }
  };

  const handleDeleteStudyGuide = (studyGuideId: string) => {
    showConfirmation(
      'Delete Study Guide',
      'Are you sure you want to delete this study guide? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`/api/student/study-guides?id=${studyGuideId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setExistingStudyGuides(existingStudyGuides.filter(g => g.study_guide_id !== studyGuideId));
            showToastMessage('Study guide deleted successfully', 'success');
          } else {
            showToastMessage('Failed to delete study guide', 'error');
          }
        } catch (error) {
          console.error('Error deleting study guide:', error);
          showToastMessage('Error deleting study guide', 'error');
        }
      }
    );
  };

  const handleExportAll = async (format: 'markdown' | 'text') => {
    let content = '';
    
    if (format === 'markdown') {
      content = `# ${notebook?.title || notebook?.name}\n\n`;
      content += `Created: ${new Date(notebook?.created_at || '').toLocaleDateString()}\n\n`;
      content += '---\n\n';
      
      // Process entries in Q&A pairs
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const date = new Date(entry.created_at).toLocaleString();
        
        // If this is a user message followed by an assistant message, show them together
        if (entry.metadata?.message_role === 'user' && 
            entries[i + 1]?.metadata?.message_role === 'assistant') {
          content += `## ${date}\n\n`;
          content += `**Question:**\n\n${entry.content}\n\n`;
          content += `**Answer:**\n\n${entries[i + 1].content}\n\n`;
          
          // Add notes if any
          const assistantEntry = entries[i + 1];
          if (assistantEntry.student_notes && assistantEntry.student_notes.length > 0) {
            content += `**Notes:**\n\n`;
            assistantEntry.student_notes.forEach((note, noteIndex) => {
              content += `${noteIndex + 1}. ${note.content}\n`;
            });
            content += '\n';
          }
          
          content += '---\n\n';
          i++; // Skip the next entry since we've already processed it
        } else {
          // Standalone entry
          const role = entry.metadata?.message_role || 'assistant';
          content += `## ${date}\n\n`;
          content += `**${role === 'user' ? 'Question' : 'Note'}:**\n\n`;
          content += `${entry.content}\n\n`;
          
          // Add notes if any
          if (entry.student_notes && entry.student_notes.length > 0) {
            content += `**Notes:**\n\n`;
            entry.student_notes.forEach((note, noteIndex) => {
              content += `${noteIndex + 1}. ${note.content}\n`;
            });
            content += '\n';
          }
          
          content += '---\n\n';
        }
      }
    } else {
      const title = notebook?.title || notebook?.name || '';
      content = `${title}\n`;
      content += `${'='.repeat(title.length)}\n\n`;
      content += `Created: ${new Date(notebook?.created_at || '').toLocaleDateString()}\n\n`;
      
      // Process entries in Q&A pairs
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const date = new Date(entry.created_at).toLocaleString();
        
        // If this is a user message followed by an assistant message, show them together
        if (entry.metadata?.message_role === 'user' && 
            entries[i + 1]?.metadata?.message_role === 'assistant') {
          content += `[${date}]\n\n`;
          content += `QUESTION:\n${entry.content}\n\n`;
          content += `ANSWER:\n${entries[i + 1].content}\n\n`;
          
          // Add notes if any
          const assistantEntry = entries[i + 1];
          if (assistantEntry.student_notes && assistantEntry.student_notes.length > 0) {
            content += `NOTES:\n`;
            assistantEntry.student_notes.forEach((note, noteIndex) => {
              content += `  ${noteIndex + 1}. ${note.content}\n`;
            });
            content += '\n';
          }
          
          content += '-'.repeat(50) + '\n\n';
          i++; // Skip the next entry since we've already processed it
        } else {
          // Standalone entry
          const role = entry.metadata?.message_role || 'assistant';
          content += `[${date}] ${role === 'user' ? 'QUESTION' : 'NOTE'}:\n`;
          content += `${entry.content}\n\n`;
          
          // Add notes if any
          if (entry.student_notes && entry.student_notes.length > 0) {
            content += `NOTES:\n`;
            entry.student_notes.forEach((note, noteIndex) => {
              content += `  ${noteIndex + 1}. ${note.content}\n`;
            });
            content += '\n';
          }
          
          content += '-'.repeat(50) + '\n\n';
        }
      }
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = (notebook?.title || notebook?.name || 'notebook').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${filename}.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LightbulbLoader size="large" />
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  if (!notebook) {
    return null;
  }

  return (
    <PageWrapper>
      <Container>
        <Header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HeaderTop>
            <BackButton onClick={() => router.push('/student/notebooks')}>
              <FiChevronLeft />
              Back to Notebooks
            </BackButton>
            
            <ActionButtons>
              <ModernButton
                variant="primary"
                size="small"
                onClick={handleGenerateStudyGuide}
                disabled={isGeneratingStudyGuide || entries.length === 0}
              >
                <FiBookOpen />
                {isGeneratingStudyGuide ? 'Generating...' : 'Convert to Study Notes'}
              </ModernButton>
              
              <div style={{ position: 'relative' }}>
                <ModernButton
                  variant="secondary"
                  size="small"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <FiDownload />
                  Export
                </ModernButton>
                
                <AnimatePresence>
                  {showExportMenu && (
                    <ExportMenu
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ExportOption onClick={() => handleExportAll('markdown')}>
                        <FiDownload />
                        Export as Markdown
                      </ExportOption>
                      <ExportOption onClick={() => handleExportAll('text')}>
                        <FiDownload />
                        Export as Text
                      </ExportOption>
                    </ExportMenu>
                  )}
                </AnimatePresence>
              </div>
            </ActionButtons>
          </HeaderTop>
          
          <TitleWrapper>
            {isEditingTitle ? (
              <>
                <TitleInput
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') {
                      setNewTitle(notebook?.title || notebook?.name || '');
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                />
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={handleUpdateTitle}
                >
                  <FiCheck />
                </ModernButton>
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    setNewTitle(notebook?.title || notebook?.name || '');
                    setIsEditingTitle(false);
                  }}
                >
                  <FiX />
                </ModernButton>
              </>
            ) : (
              <>
                <Title>{notebook?.title || notebook?.name}</Title>
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <FiEdit2 />
                </ModernButton>
              </>
            )}
            
            <StarButton
              $isStarred={notebook.is_starred || false}
              onClick={handleToggleStar}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiStar />
            </StarButton>
          </TitleWrapper>
          
          <MetaInfo>
            {entries.length} notes
            <span>•</span>
            Created {new Date(notebook.created_at).toLocaleDateString()}
          </MetaInfo>
          
          {/* Study Guides Section */}
          {existingStudyGuides.length > 0 && (
            <StudyGuidesSection>
              <StudyGuidesHeader>
                <h3>Study Guides</h3>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {existingStudyGuides.length} guide{existingStudyGuides.length !== 1 ? 's' : ''}
                </span>
              </StudyGuidesHeader>
              {existingStudyGuides.map((guide, index) => (
                <StudyGuideCard
                  key={guide.study_guide_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setStudyGuideContent(guide.content);
                    setSelectedStudyGuideId(guide.study_guide_id);
                    setShowStudyGuide(true);
                  }}
                >
                  <StudyGuideCardHeader>
                    <StudyGuideTitle>{guide.title}</StudyGuideTitle>
                    <StudyGuideActions onClick={(e) => e.stopPropagation()}>
                      <ActionButton
                        onClick={() => {
                          setStudyGuideContent(guide.content);
                          setSelectedStudyGuideId(guide.study_guide_id);
                          setShowStudyGuide(true);
                        }}
                        title="View study guide"
                      >
                        <FiBookOpen />
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleDeleteStudyGuide(guide.study_guide_id)}
                        title="Delete study guide"
                      >
                        <FiTrash2 />
                      </ActionButton>
                    </StudyGuideActions>
                  </StudyGuideCardHeader>
                  <StudyGuideDate>
                    Generated {new Date(guide.created_at).toLocaleString()}
                  </StudyGuideDate>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                    Based on {guide.source_entries_count} notes
                  </div>
                </StudyGuideCard>
              ))}
            </StudyGuidesSection>
          )}
        </Header>

        {entries.length === 0 ? (
          <EmptyState>
            <h3>No notes yet</h3>
            <p>Save messages from your chat sessions to see them here</p>
          </EmptyState>
        ) : (
          <EntriesContainer>
            {entries.map((entry, index) => {
              // Skip user messages that are followed by assistant messages (they'll be shown together)
              if (entry.metadata?.message_role === 'user' && 
                  entries[index + 1]?.metadata?.message_role === 'assistant') {
                return null;
              }
              
              const hasNotes = entry.student_notes && entry.student_notes.length > 0;
              
              return (
              <EntryCard
                key={entry.entry_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div style={{ width: '100%' }}>
                  <EntryHeader>
                    <EntryDate>
                      {new Date(entry.created_at).toLocaleString()}
                    </EntryDate>
                    <EntryActions>
                      <ActionButton
                        onClick={() => handleCopyEntry(entry)}
                        title="Copy to clipboard"
                      >
                        {copiedEntryId === entry.entry_id ? <FiCheck /> : <FiCopy />}
                      </ActionButton>
                      {entry.highlights && entry.highlights.length > 0 && (
                        <ActionButton
                          onClick={() => handleClearAllHighlights(entry.entry_id, entry.highlights!.length)}
                          title={`Clear all ${entry.highlights.length} highlights`}
                        >
                          <FiEyeOff />
                        </ActionButton>
                      )}
                      <ActionButton
                        onClick={() => handleDeleteEntry(entry.entry_id)}
                        title="Delete note"
                      >
                        <FiTrash2 />
                      </ActionButton>
                    </EntryActions>
                  </EntryHeader>
                  <NoteContainer>
                    {/* For entries that are pairs (user question + assistant response) */}
                    {entries[index - 1]?.metadata?.message_role === 'user' && 
                     entry.metadata?.message_role === 'assistant' && (
                      <>
                        <QuestionSection>
                          <QuestionLabel>Your Question</QuestionLabel>
                          <QuestionText>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                              {entries[index - 1].content}
                            </ReactMarkdown>
                          </QuestionText>
                        </QuestionSection>
                        <ClickableContent>
                          <AnswerSection
                            className="answer-section"
                            $hasMarginNotes={hasNotes}
                            ref={(el) => { if (el) contentRefs.current[entry.entry_id] = el; }}
                            onMouseUp={() => handleTextSelection(entry.entry_id)}
                          >
                            {renderEnhancedContent(
                              entry.content, 
                              entry.highlights || [], 
                              entry.student_notes || [], 
                              entry.entry_id
                            )}
                            
                            
                            {/* Margin notes (desktop only) */}
                            {hasNotes && (
                              <MarginNotesContainer>
                                {entry.student_notes!.map(note => (
                                  <MarginNote
                                    key={note.note_id}
                                    $top={getMarginNotePosition(note.note_id, entry.student_notes!)}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    {editingNoteId === note.note_id ? (
                                      <>
                                        <NoteTextarea
                                          value={editNoteContent}
                                          onChange={(e) => setEditNoteContent(e.target.value)}
                                          autoFocus
                                        />
                                        <NoteActions>
                                          <NoteActionButton
                                            onClick={() => handleUpdateNote(entry.entry_id, note.note_id)}
                                            title="Save"
                                          >
                                            <FiCheck />
                                          </NoteActionButton>
                                          <NoteActionButton
                                            onClick={() => {
                                              setEditingNoteId(null);
                                              setEditNoteContent('');
                                            }}
                                            title="Cancel"
                                          >
                                            <FiX />
                                          </NoteActionButton>
                                        </NoteActions>
                                      </>
                                    ) : (
                                      <>
                                        <NoteContent>{note.content}</NoteContent>
                                        <NoteActions>
                                          <NoteActionButton
                                            onClick={() => {
                                              setEditingNoteId(note.note_id);
                                              setEditNoteContent(note.content);
                                            }}
                                            title="Edit"
                                          >
                                            <FiEdit2 />
                                          </NoteActionButton>
                                          <NoteActionButton
                                            onClick={() => handleDeleteNote(entry.entry_id, note.note_id)}
                                            title="Delete"
                                          >
                                            <FiTrash2 />
                                          </NoteActionButton>
                                        </NoteActions>
                                      </>
                                    )}
                                  </MarginNote>
                                ))}
                              </MarginNotesContainer>
                            )}
                          </AnswerSection>
                          
                          {/* Mobile notes list */}
                          {hasNotes && (
                            <MobileNotesList>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#666' }}>
                                Notes ({entry.student_notes!.length})
                              </h4>
                              {entry.student_notes!.map((note, noteIndex) => (
                                <MobileNoteCard
                                  key={note.note_id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: noteIndex * 0.05 }}
                                >
                                  <MobileNoteHeader>
                                    <span>Note {noteIndex + 1}</span>
                                    <NoteActions>
                                      {editingNoteId === note.note_id ? (
                                        <>
                                          <NoteActionButton
                                            onClick={() => handleUpdateNote(entry.entry_id, note.note_id)}
                                            title="Save"
                                          >
                                            <FiCheck />
                                          </NoteActionButton>
                                          <NoteActionButton
                                            onClick={() => {
                                              setEditingNoteId(null);
                                              setEditNoteContent('');
                                            }}
                                            title="Cancel"
                                          >
                                            <FiX />
                                          </NoteActionButton>
                                        </>
                                      ) : (
                                        <>
                                          <NoteActionButton
                                            onClick={() => {
                                              setEditingNoteId(note.note_id);
                                              setEditNoteContent(note.content);
                                            }}
                                            title="Edit"
                                          >
                                            <FiEdit2 />
                                          </NoteActionButton>
                                          <NoteActionButton
                                            onClick={() => handleDeleteNote(entry.entry_id, note.note_id)}
                                            title="Delete"
                                          >
                                            <FiTrash2 />
                                          </NoteActionButton>
                                        </>
                                      )}
                                    </NoteActions>
                                  </MobileNoteHeader>
                                  {editingNoteId === note.note_id ? (
                                    <NoteTextarea
                                      value={editNoteContent}
                                      onChange={(e) => setEditNoteContent(e.target.value)}
                                      autoFocus
                                    />
                                  ) : (
                                    <NoteContent>{note.content}</NoteContent>
                                  )}
                                </MobileNoteCard>
                              ))}
                            </MobileNotesList>
                          )}
                        </ClickableContent>
                      </>
                    )}
                    
                    {/* For standalone entries */}
                    {(entry.metadata?.message_role === 'user' && 
                      entries[index + 1]?.metadata?.message_role !== 'assistant') && (
                      <QuestionSection>
                        <QuestionLabel>Your Question</QuestionLabel>
                        <QuestionText>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {entry.content}
                          </ReactMarkdown>
                        </QuestionText>
                      </QuestionSection>
                    )}
                    
                    {/* For assistant messages without a preceding user message */}
                    {entry.metadata?.message_role === 'assistant' && 
                     entries[index - 1]?.metadata?.message_role !== 'user' && (
                      <ClickableContent>
                        <AnswerSection
                          className="answer-section"
                          $hasMarginNotes={hasNotes}
                          ref={(el) => { if (el) contentRefs.current[entry.entry_id] = el; }}
                          onMouseUp={() => handleTextSelection(entry.entry_id)}
                        >
                          {renderEnhancedContent(
                            entry.content, 
                            entry.highlights || [], 
                            entry.student_notes || [], 
                            entry.entry_id
                          )}
                          
                          
                          {/* Margin notes (desktop only) */}
                          {hasNotes && (
                            <MarginNotesContainer>
                              {entry.student_notes!.map(note => (
                                <MarginNote
                                  key={note.note_id}
                                  $top={getMarginNotePosition(note.note_id, entry.student_notes!)}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                >
                                  {editingNoteId === note.note_id ? (
                                    <>
                                      <NoteTextarea
                                        value={editNoteContent}
                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                        autoFocus
                                      />
                                      <NoteActions>
                                        <NoteActionButton
                                          onClick={() => handleUpdateNote(entry.entry_id, note.note_id)}
                                          title="Save"
                                        >
                                          <FiCheck />
                                        </NoteActionButton>
                                        <NoteActionButton
                                          onClick={() => {
                                            setEditingNoteId(null);
                                            setEditNoteContent('');
                                          }}
                                          title="Cancel"
                                        >
                                          <FiX />
                                        </NoteActionButton>
                                      </NoteActions>
                                    </>
                                  ) : (
                                    <>
                                      <NoteContent>{note.content}</NoteContent>
                                      <NoteActions>
                                        <NoteActionButton
                                          onClick={() => {
                                            setEditingNoteId(note.note_id);
                                            setEditNoteContent(note.content);
                                          }}
                                          title="Edit"
                                        >
                                          <FiEdit2 />
                                        </NoteActionButton>
                                        <NoteActionButton
                                          onClick={() => handleDeleteNote(entry.entry_id, note.note_id)}
                                          title="Delete"
                                        >
                                          <FiTrash2 />
                                        </NoteActionButton>
                                      </NoteActions>
                                    </>
                                  )}
                                </MarginNote>
                              ))}
                            </MarginNotesContainer>
                          )}
                        </AnswerSection>
                        
                        {/* Mobile notes list */}
                        {hasNotes && (
                          <MobileNotesList>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#666' }}>
                              Notes ({entry.student_notes!.length})
                            </h4>
                            {entry.student_notes!.map((note, noteIndex) => (
                              <MobileNoteCard
                                key={note.note_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: noteIndex * 0.05 }}
                              >
                                <MobileNoteHeader>
                                  <span>Note {noteIndex + 1}</span>
                                  <NoteActions>
                                    {editingNoteId === note.note_id ? (
                                      <>
                                        <NoteActionButton
                                          onClick={() => handleUpdateNote(entry.entry_id, note.note_id)}
                                          title="Save"
                                        >
                                          <FiCheck />
                                        </NoteActionButton>
                                        <NoteActionButton
                                          onClick={() => {
                                            setEditingNoteId(null);
                                            setEditNoteContent('');
                                          }}
                                          title="Cancel"
                                        >
                                          <FiX />
                                        </NoteActionButton>
                                      </>
                                    ) : (
                                      <>
                                        <NoteActionButton
                                          onClick={() => {
                                            setEditingNoteId(note.note_id);
                                            setEditNoteContent(note.content);
                                          }}
                                          title="Edit"
                                        >
                                          <FiEdit2 />
                                        </NoteActionButton>
                                        <NoteActionButton
                                          onClick={() => handleDeleteNote(entry.entry_id, note.note_id)}
                                          title="Delete"
                                        >
                                          <FiTrash2 />
                                        </NoteActionButton>
                                      </>
                                    )}
                                  </NoteActions>
                                </MobileNoteHeader>
                                {editingNoteId === note.note_id ? (
                                  <NoteTextarea
                                    value={editNoteContent}
                                    onChange={(e) => setEditNoteContent(e.target.value)}
                                    autoFocus
                                  />
                                ) : (
                                  <NoteContent>{note.content}</NoteContent>
                                )}
                              </MobileNoteCard>
                            ))}
                          </MobileNotesList>
                        )}
                      </ClickableContent>
                    )}
                  </NoteContainer>
                </div>
              </EntryCard>
              );
            })}
          </EntriesContainer>
        )}
        
        {/* Highlight Toolbar */}
        <AnimatePresence>
          {showHighlightToolbar && (
            <HighlightToolbar
              className="highlight-toolbar"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              style={{
                left: toolbarPosition.x,
                top: toolbarPosition.y,
                transform: 'translateX(-50%) translateY(-100%)'
              }}
            >
              <HighlightButton
                $color="yellow"
                onClick={() => handleCreateHighlight('yellow')}
                title="Highlight in yellow"
              />
              <HighlightButton
                $color="green"
                onClick={() => handleCreateHighlight('green')}
                title="Highlight in green"
              />
              <HighlightButton
                $color="blue"
                onClick={() => handleCreateHighlight('blue')}
                title="Highlight in blue"
              />
              <HighlightButton
                $color="pink"
                onClick={() => handleCreateHighlight('pink')}
                title="Highlight in pink"
              />
              <HighlightButton
                $color="orange"
                onClick={() => handleCreateHighlight('orange')}
                title="Highlight in orange"
              />
              <HighlightButton
                $isNote
                onClick={() => {
                  if (selectedText) {
                    // Use the end position of the selected text
                    handleAddInlineNote(
                      selectedText.entryId,
                      selectedText.end,
                      toolbarPosition.x,
                      toolbarPosition.y + 40
                    );
                    window.getSelection()?.removeAllRanges();
                    setShowHighlightToolbar(false);
                    setSelectedText(null);
                  }
                }}
                title="Add note"
              >
                <FiMessageSquare />
              </HighlightButton>
            </HighlightToolbar>
          )}
        </AnimatePresence>
        
        {/* Inline Note Input */}
        <AnimatePresence>
          {showNoteInput && (
            <InlineNoteInput
              className="note-input"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                left: noteInputPosition.x,
                top: noteInputPosition.y
              }}
            >
              <NoteTextarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add your note here..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateNote();
                  }
                  if (e.key === 'Escape') {
                    setShowNoteInput(false);
                    setNewNoteContent('');
                  }
                }}
              />
              <NoteInputActions>
                <ModernButton
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNewNoteContent('');
                  }}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="small"
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim()}
                >
                  Add Note
                </ModernButton>
              </NoteInputActions>
            </InlineNoteInput>
          )}
        </AnimatePresence>
        
        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmAction || (() => {})}
          title={confirmTitle}
          message={confirmMessage}
          variant="danger"
        />
        
        {/* Toast Notifications */}
        <Toast
          isVisible={showToast}
          onClose={() => setShowToast(false)}
          message={toastMessage}
          type={toastType}
        />
        
        {/* Study Guide Modal */}
        <StudyGuideModal
          isOpen={showStudyGuide}
          onClose={() => {
            setShowStudyGuide(false);
            setSelectedStudyGuideId(null);
          }}
          content={studyGuideContent}
          notebookTitle={notebook?.title || notebook?.name || 'Notebook'}
          studyGuideId={selectedStudyGuideId || undefined}
        />
      </Container>
    </PageWrapper>
  );
}