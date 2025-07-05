'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FiX, FiSearch, FiPlus, FiUsers, FiCheck } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { useRouter } from 'next/navigation';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';

interface Room {
  room_id: string;
  room_name: string;
  student_count: number;
}

interface RoomAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudentIds: string[];
  onAssign: (roomId: string) => Promise<void>;
  onCreateRoom: (roomName: string) => Promise<string>;
  shouldRedirectToRoom?: boolean; // Optional prop to control redirect behavior
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6B7280;
  transition: color 0.2s;
  
  &:hover {
    color: #111827;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$active ? '#7C3AED' : '#6B7280'};
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #7C3AED;
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.2s;
  }
  
  &:hover {
    color: #7C3AED;
  }
`;

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
`;

const RoomCard = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  
  &:hover {
    background: #F3F4F6;
    border-color: #7C3AED;
    transform: translateY(-1px);
  }
`;

const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const RoomName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const RoomStats = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const CreateRoomForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
  }
`;

const SuccessMessage = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  background: #D1FAE5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #059669;
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const LoadingSpinner = styled(motion.div)`
  width: 24px;
  height: 24px;
  border: 3px solid #E5E7EB;
  border-top-color: #7C3AED;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function RoomAssignmentModal({
  isOpen,
  onClose,
  selectedStudentIds,
  onAssign,
  onCreateRoom,
  shouldRedirectToRoom = true // Default to true for backward compatibility
}: RoomAssignmentModalProps) {
  const router = useRouter();
  const { currentStep, isOnboarding, completeStep } = useOnboarding();
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      setSuccess(false);
      setSelectedRoomName('');
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/teacher/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleAssignToRoom = async (roomId: string, roomName: string) => {
    setLoading(true);
    try {
      await onAssign(roomId);
      setSelectedRoomName(roomName);
      setSelectedRoomId(roomId);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Only navigate to the room page if shouldRedirectToRoom is true
        if (shouldRedirectToRoom) {
          router.push(`/teacher-dashboard/rooms/${roomId}`);
        }
      }, 1500);
    } catch (error) {
      console.error('Error assigning students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setLoading(true);
    try {
      const roomId = await onCreateRoom(newRoomName);
      await onAssign(roomId);
      setSelectedRoomName(newRoomName);
      setSelectedRoomId(roomId);
      setSuccess(true);
      
      // Complete onboarding step if active
      if (isOnboarding && currentStep === OnboardingStep.CREATE_ROOM) {
        completeStep(OnboardingStep.CREATE_ROOM);
      }
      
      setTimeout(() => {
        onClose();
        // During onboarding, navigate to chatbots page instead of room page
        if (isOnboarding && currentStep === OnboardingStep.CREATE_SKOLR) {
          router.push('/teacher-dashboard/skolrs');
        } else if (shouldRedirectToRoom) {
          router.push(`/teacher-dashboard/rooms/${roomId}`);
        }
      }, 1500);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        data-modal="true"
      >
        <ModalContainer
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {success ? (
            <SuccessMessage
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SuccessIcon>
                <FiCheck />
              </SuccessIcon>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700 }}>
                  Success!
                </h3>
                <p style={{ margin: 0, color: '#6B7280' }}>
                  {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} added to {selectedRoomName}
                </p>
              </div>
            </SuccessMessage>
          ) : (
            <>
              <ModalHeader>
                <Title>Assign Students to Room</Title>
                <CloseButton onClick={onClose}>
                  <FiX size={24} />
                </CloseButton>
              </ModalHeader>

              <p style={{ marginBottom: '20px', color: '#6B7280' }}>
                Assigning {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} to a room
              </p>

              <TabContainer>
                <Tab
                  $active={activeTab === 'existing'}
                  onClick={() => setActiveTab('existing')}
                >
                  Existing Rooms
                </Tab>
                <Tab
                  id="create-new-room-tab"
                  $active={activeTab === 'new'}
                  onClick={() => setActiveTab('new')}
                >
                  Create New Room
                </Tab>
              </TabContainer>

              {activeTab === 'existing' ? (
                <>
                  <SearchContainer>
                    <SearchIcon />
                    <SearchInput
                      type="text"
                      placeholder="Search rooms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </SearchContainer>

                  <RoomList>
                    {filteredRooms.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                        {rooms.length === 0 ? 'No rooms created yet' : 'No rooms found'}
                      </div>
                    ) : (
                      filteredRooms.map(room => (
                        <RoomCard
                          key={room.room_id}
                          onClick={() => handleAssignToRoom(room.room_id, room.room_name)}
                          disabled={loading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <RoomInfo>
                            <RoomName>{room.room_name}</RoomName>
                            <RoomStats>
                              <FiUsers />
                              {room.student_count} student{room.student_count !== 1 ? 's' : ''}
                            </RoomStats>
                          </RoomInfo>
                          {loading && <LoadingSpinner />}
                        </RoomCard>
                      ))
                    )}
                  </RoomList>
                </>
              ) : (
                <CreateRoomForm onSubmit={handleCreateRoom}>
                  <Input
                    type="text"
                    placeholder="Room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    autoFocus
                  />
                  <ModernButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={!newRoomName.trim() || loading}
                  >
                    {loading ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <FiPlus />
                        Create Room & Assign Students
                      </>
                    )}
                  </ModernButton>
                </CreateRoomForm>
              )}
            </>
          )}
        </ModalContainer>
      </Overlay>
      
      {/* Onboarding Highlights and Tooltips */}
      {isOpen && (
        <>
          <Highlight
            selector="#create-new-room-tab"
            show={isOnboarding && currentStep === OnboardingStep.CREATE_ROOM}
            cutout={true}
          />
          <Tooltip
            selector="#create-new-room-tab"
            title="Create a Room"
            text="Click here to create a new room for your students. Rooms are like virtual classrooms where students can interact with AI assistants."
            buttonText="Got it"
            onButtonClick={() => {}}
            show={isOnboarding && currentStep === OnboardingStep.CREATE_ROOM}
            placement="bottom"
          />
        </>
      )}
    </AnimatePresence>
  );
}