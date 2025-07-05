'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBookOpen, 
  FiUsers, 
  FiMoreVertical,
  FiEdit,
  FiCopy,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlayCircle
} from 'react-icons/fi';
import { ContentCard } from '@/components/ui/UnifiedCards';
import { ModernButton, ButtonGroup } from '@/components/shared/ModernButton';
import { StatusBadge } from '@/components/ui';
import type { CourseWithDetails } from '@/types/database.types';

interface UnifiedCourseCardProps {
  course: CourseWithDetails;
  onEdit?: (course: CourseWithDetails) => void;
  onDelete?: (course: CourseWithDetails) => void;
  onDuplicate?: (course: CourseWithDetails) => void;
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

const TagsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
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

export const UnifiedCourseCard: React.FC<UnifiedCourseCardProps> = ({ 
  course, 
  onEdit, 
  onDelete, 
  onDuplicate 
}) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
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

  const handleCardClick = () => {
    router.push(`/teacher-dashboard/courses/${course.course_id}`);
  };

  // Build subtitle with status
  const subtitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <StatusBadge isActive={course.is_published}>
        {course.is_published ? (
          <>
            <FiEye /> Published
          </>
        ) : (
          <>
            <FiEyeOff /> Draft
          </>
        )}
      </StatusBadge>
      {(course.subject || course.year_group) && (
        <TagsContainer>
          {course.subject && <Tag>{course.subject}</Tag>}
          {course.year_group && <Tag>Year {course.year_group}</Tag>}
        </TagsContainer>
      )}
    </div>
  );

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
          title={course.title}
          subtitle={subtitle}
          description={course.description || undefined}
          icon={<FiPlayCircle />}
          variant="secondary"
          onClick={handleCardClick}
          metadata={[
            { 
              label: "Lessons", 
              value: course.lesson_count || 0, 
              icon: <FiBookOpen /> 
            },
            { 
              label: "Students", 
              value: course.student_count || 0, 
              icon: <FiUsers /> 
            }
          ]}
          actions={
            <ModernButton variant="primary" size="small" fullWidth onClick={handleCardClick}>
              Manage Course →
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
                {onEdit && (
                  <DropdownItem onClick={() => {
                    onEdit(course);
                    setIsDropdownOpen(false);
                  }}>
                    <FiEdit />
                    Edit Details
                  </DropdownItem>
                )}
                {onDuplicate && (
                  <DropdownItem onClick={() => {
                    onDuplicate(course);
                    setIsDropdownOpen(false);
                  }}>
                    <FiCopy />
                    Duplicate Course
                  </DropdownItem>
                )}
                {onDelete && (
                  <>
                    {(onEdit || onDuplicate) && <DropdownDivider />}
                    <DropdownItem onClick={() => {
                      onDelete(course);
                      setIsDropdownOpen(false);
                    }}>
                      <FiTrash2 />
                      Delete Course
                    </DropdownItem>
                  </>
                )}
              </DropdownMenu>
            </DropdownPortal>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};