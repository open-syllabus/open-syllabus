'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiMessageSquare, 
  FiActivity,
  FiClock,
  FiMoreVertical,
  FiEdit,
  FiCopy,
  FiLink,
  FiUpload,
  FiArchive,
  FiTrash2,
  FiBookOpen
} from 'react-icons/fi';
import { ContentCard } from '@/components/ui/UnifiedCards';
import { ModernButton } from '@/components/shared/ModernButton';
import type { TeacherRoom } from '@/types/database.types';
import StudentCsvUpload from './StudentCsvUpload';

interface UnifiedRoomCardProps {
  room: TeacherRoom & { student_count?: number };
  onEdit: (room: TeacherRoom) => void;
  onDelete: (room: TeacherRoom) => void;
  onArchive: (room: TeacherRoom) => void;
}

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

export const UnifiedRoomCard: React.FC<UnifiedRoomCardProps> = ({ 
  room, 
  onEdit, 
  onDelete, 
  onArchive 
}) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const studentCount = room.student_count || 0;
  const chatbotCount = room.room_chatbots?.length || 0;
  
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
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
  
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.room_code);
      alert(`Room code "${room.room_code}" copied to clipboard!`);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      alert('Failed to copy room code.');
    }
  };

  const generateJoinUrl = async () => {
    try {
      const joinLink = `${window.location.origin}/join-room?code=${room.room_code}`;
      await navigator.clipboard.writeText(joinLink);
      alert(`Student join URL copied to clipboard:\n${joinLink}`);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error generating join link:', error);
      alert('Failed to generate join link.');
    }
  };

  const handleCardClick = () => {
    router.push(`/teacher-dashboard/rooms/${room.room_id}`);
  };

  return (
    <>
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
          title={room.room_name}
          subtitle={`Code: ${room.room_code}`}
          description={room.description || undefined}
          icon={<FiBookOpen />}
          variant="primary"
          onClick={handleCardClick}
          metadata={[
            { 
              label: "Students", 
              value: studentCount, 
              icon: <FiUsers /> 
            },
            { 
              label: "Skolrs", 
              value: chatbotCount, 
              icon: <FiMessageSquare /> 
            },
            { 
              label: "Status", 
              value: room.is_active ? 'Active' : 'Inactive',
              icon: room.is_active ? <FiActivity /> : <FiClock />
            }
          ]}
          actions={
            <ModernButton variant="primary" size="small" fullWidth onClick={handleCardClick}>
              View Room →
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
                <DropdownItem onClick={() => {
                  onEdit(room);
                  setIsDropdownOpen(false);
                }}>
                  <FiEdit />
                  Edit Room
                </DropdownItem>
                <DropdownItem onClick={copyRoomCode}>
                  <FiCopy />
                  Copy Room Code
                </DropdownItem>
                <DropdownItem onClick={generateJoinUrl}>
                  <FiLink />
                  Copy Join URL
                </DropdownItem>
                <DropdownItem onClick={() => {
                  setShowCsvUpload(true);
                  setIsDropdownOpen(false);
                }}>
                  <FiUpload />
                  Import Students
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onClick={() => {
                  onArchive(room);
                  setIsDropdownOpen(false);
                }}>
                  <FiArchive />
                  {room.is_archived ? 'Restore' : 'Archive'} Room
                </DropdownItem>
                <DropdownItem onClick={() => {
                  onDelete(room);
                  setIsDropdownOpen(false);
                }}>
                  <FiTrash2 />
                  Delete Room
                </DropdownItem>
              </DropdownMenu>
            </DropdownPortal>
          )}
        </AnimatePresence>
      </div>
      
      {showCsvUpload && (
        <StudentCsvUpload
          roomId={room.room_id}
          roomName={room.room_name}
          onClose={() => setShowCsvUpload(false)}
        />
      )}
    </>
  );
};