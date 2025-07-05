// Modern rooms list component with enhanced features
import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity,
  FiChevronRight,
  FiMoreVertical,
  FiEdit,
  FiCopy,
  FiLink,
  FiUpload,
  FiArchive,
  FiTrash2
} from 'react-icons/fi';
import { UnifiedRoomCard } from './UnifiedRoomCard';
import { ModernButton, IconButton } from '@/components/shared/ModernButton';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell, StatusBadge, CodeBadge } from '@/components/ui';;
import type { TeacherRoom } from '@/types/database.types';
import StudentCsvUpload from './StudentCsvUpload';
import Link from 'next/link';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface ModernRoomsListProps {
  rooms: TeacherRoom[];
  onEditRoom: (room: TeacherRoom) => void;
  onDeleteRoom: (room: TeacherRoom) => void;
  onArchiveRoom: (room: TeacherRoom) => void;
  onCreateRoom: () => void;
  canCreateRoom: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

// Custom styled components for grid layout

const RoomsGrid = styled.div<{ $isGrid: boolean }>`
  display: grid;
  grid-template-columns: ${({ $isGrid }) => 
    $isGrid ? 'repeat(auto-fill, minmax(380px, 1fr))' : '1fr'
  };
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: ${({ $isGrid }) => 
      $isGrid ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr'
    };
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;


const RoomNameLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const ActionButtonsCell = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

// Dropdown Menu Styles
const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled(IconButton)`
  padding: 8px;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: fixed;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  z-index: 10000;
  min-width: 200px;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.ui.border};
  margin: 4px 0;
`;

// Dropdown menu component
const RoomDropdownMenu: React.FC<{
  room: TeacherRoom;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCopyCode: () => void;
  onCopyLink: () => void;
  onImportStudents: () => void;
}> = ({ room, onEdit, onArchive, onDelete, onCopyCode, onCopyLink, onImportStudents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton
        $variant="ghost"
        $size="small"
        aria-label="Room options"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMoreVertical />
      </DropdownButton>
      
      <AnimatePresence>
        {isOpen && (
          <DropdownMenu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DropdownItem onClick={onEdit}>
              <FiEdit />
              Edit Room
            </DropdownItem>
            <DropdownItem onClick={onCopyCode}>
              <FiCopy />
              Copy Room Code
            </DropdownItem>
            <DropdownItem onClick={onCopyLink}>
              <FiLink />
              Copy Join URL
            </DropdownItem>
            <DropdownItem onClick={onImportStudents}>
              <FiUpload />
              Import Students
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem onClick={onArchive}>
              <FiArchive />
              Archive Room
            </DropdownItem>
            <DropdownItem onClick={onDelete}>
              <FiTrash2 />
              Delete Room
            </DropdownItem>
          </DropdownMenu>
        )}
      </AnimatePresence>
    </DropdownContainer>
  );
};

export const ModernRoomsList: React.FC<ModernRoomsListProps> = ({
  rooms,
  onEditRoom,
  onDeleteRoom,
  onArchiveRoom,
  onCreateRoom,
  canCreateRoom,
  viewMode: externalViewMode,
  onViewModeChange
}) => {
  const [csvUploadRoom, setCsvUploadRoom] = useState<TeacherRoom | null>(null);
  
  // Use external viewMode if provided, otherwise default to 'grid'
  const viewMode = externalViewMode ?? 'grid';
  
  // Helper functions
  const copyRoomCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert(`Room code "${code}" copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      alert('Failed to copy room code.');
    }
  };

  const generateJoinUrl = async (roomCode: string) => {
    try {
      const joinLink = `${window.location.origin}/join-room?code=${roomCode}`;
      await navigator.clipboard.writeText(joinLink);
      alert(`Student join URL copied to clipboard:\n${joinLink}`);
    } catch (error) {
      console.error('Error generating join link:', error);
      alert('Failed to generate join link.');
    }
  };
  
  return (
    <>
      {viewMode === 'grid' ? (
        <AnimatePresence mode="wait">
          <RoomsGrid $isGrid={true}>
            {rooms.map((room, index) => (
              <motion.div
                key={room.room_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <UnifiedRoomCard
                  room={room}
                  onEdit={onEditRoom}
                  onDelete={onDeleteRoom}
                  onArchive={onArchiveRoom}
                />
              </motion.div>
            ))}
          </RoomsGrid>
        </AnimatePresence>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Room Name</TableHeaderCell>
              <TableHeaderCell>Room Code</TableHeaderCell>
              <TableHeaderCell>Chatbots</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.room_id}>
                <TableCell>
                  <RoomNameLink href={`/teacher-dashboard/rooms/${room.room_id}`}>
                    {room.room_name}
                    <FiChevronRight />
                  </RoomNameLink>
                </TableCell>
                <TableCell>
                  <CodeBadge 
                    $variant="primary" 
                    $gradient
                    onClick={() => copyRoomCode(room.room_code)}
                  >
                    {room.room_code}
                  </CodeBadge>
                </TableCell>
                <TableCell>
                  {room.room_chatbots?.length || 0} Active
                </TableCell>
                <TableCell>
                  <StatusBadge 
                    isActive={room.is_active}
                    icon={room.is_active ? <FiActivity /> : null}
                  >
                    {room.is_active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  {new Date(room.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ActionButtonsCell>
                    <ModernButton                       variant="ghost"
                      size="small"
                      onClick={() => onEditRoom(room)}
                    >
                      Edit
                    </ModernButton>
                    <ModernButton                       variant="ghost"
                      size="small"
                      onClick={() => generateJoinUrl(room.room_code)}
                    >
                      Join URL
                    </ModernButton>
                    <ModernButton                       variant="primary"
                      size="small"
                      onClick={() => setCsvUploadRoom(room)}
                    >
                      Import Students
                    </ModernButton>
                    <ModernButton                       variant="ghost"
                      size="small"
                      onClick={() => onArchiveRoom(room)}
                    >
                      Archive
                    </ModernButton>
                    <ModernButton                       variant="ghost"
                      size="small"
                      onClick={() => onDeleteRoom(room)}
                    >
                      Delete
                    </ModernButton>
                  </ActionButtonsCell>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <AnimatePresence>
        {csvUploadRoom && (
          <StudentCsvUpload
            roomId={csvUploadRoom.room_id}
            roomName={csvUploadRoom.room_name}
            onClose={() => setCsvUploadRoom(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};