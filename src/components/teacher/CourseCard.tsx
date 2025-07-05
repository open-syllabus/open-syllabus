import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FiPlayCircle, 
  FiUsers, 
  FiBookOpen, 
  FiMoreVertical, 
  FiEdit,
  FiTrash2,
  FiCopy,
  FiExternalLink,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import type { CourseWithDetails } from '@/types/database.types';
import { ModernButton } from '@/components/shared/ModernButton';
import { Badge, StatusBadge } from '@/components/ui';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface CourseCardProps {
  course: CourseWithDetails;
  onEdit?: (course: CourseWithDetails) => void;
  onDelete?: (course: CourseWithDetails) => void;
  onDuplicate?: (course: CourseWithDetails) => void;
  viewMode?: 'grid' | 'list';
}

const CardContainer = styled(motion.div)<{ $viewMode: 'grid' | 'list' }>`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 16px;
  box-shadow: 0 8px 32px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  display: ${({ $viewMode }) => $viewMode === 'list' ? 'flex' : 'block'};
  align-items: ${({ $viewMode }) => $viewMode === 'list' ? 'center' : 'stretch'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
    border-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.12)};
    }
  }
`;

const ThumbnailSection = styled.div<{ $viewMode: 'grid' | 'list' }>`
  position: relative;
  width: ${({ $viewMode }) => $viewMode === 'list' ? '140px' : '100%'};
  height: ${({ $viewMode }) => $viewMode === 'list' ? '100px' : '140px'};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.ui.pastelGray}, ${({ theme }) => theme.colors.ui.border});
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: ${({ $viewMode }) => $viewMode === 'list' ? '100px' : '100%'};
    height: ${({ $viewMode }) => $viewMode === 'list' ? '80px' : '120px'};
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`;

const PlayButton = styled.div`
  width: 60px;
  height: 60px;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: 0 4px 12px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
  transition: all 0.2s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.1);
    box-shadow: 0 6px 20px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  }
  
  svg {
    width: 28px;
    height: 28px;
    color: ${({ theme }) => theme.colors.brand.primary};
    margin-left: 4px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 40px;
    height: 40px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const CardContent = styled.div<{ $viewMode: 'grid' | 'list' }>`
  padding: ${({ $viewMode }) => $viewMode === 'list' ? '20px 24px' : '24px'};
  flex: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ $viewMode }) => $viewMode === 'list' ? '16px 20px' : '20px'};
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  flex: 1;
  margin-right: 12px;
  line-height: 1.4;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`;

const Description = styled.p`
  margin: 6px 0 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 0.8125rem;
    margin: 4px 0 10px;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 12px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const TagsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 4px 12px;
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  color: ${({ theme }) => theme.colors.brand.primary};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ViewButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(2px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

const DropdownMenu = styled.div`
  position: relative;
  z-index: 10;
`;

const DropdownButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    border-color: ${({ theme }) => theme.colors.ui.borderDark};
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  
  &:hover svg {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const DropdownContent = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  z-index: 1000;
  min-width: 180px;
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
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

export const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  onEdit, 
  onDelete, 
  onDuplicate,
  viewMode = 'grid' 
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };
  
  const handleAction = (action: () => void) => {
    action();
    setShowDropdown(false);
  };

  return (
    <CardContainer
      $viewMode={viewMode}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <ThumbnailSection $viewMode={viewMode}>
        {course.thumbnail_url ? (
          <ThumbnailImage src={course.thumbnail_url} alt={course.title} />
        ) : null}
        <ThumbnailOverlay />
        <PlayButton>
          <FiPlayCircle />
        </PlayButton>
      </ThumbnailSection>
      
      <CardContent $viewMode={viewMode}>
        <HeaderRow>
          <Title>{course.title}</Title>
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
        </HeaderRow>
        
        {course.description && (
          <Description>{course.description}</Description>
        )}
        
        <MetaInfo>
          <MetaItem>
            <FiBookOpen />
            {course.lesson_count || 0} lessons
          </MetaItem>
          <MetaItem>
            <FiUsers />
            {course.student_count || 0} students
          </MetaItem>
        </MetaInfo>
        
        {(course.subject || course.year_group) && (
          <TagsRow>
            {course.subject && <Tag>{course.subject}</Tag>}
            {course.year_group && <Tag>Year {course.year_group}</Tag>}
          </TagsRow>
        )}
        
        <ActionRow>
          <ViewButton href={`/teacher-dashboard/courses/${course.course_id}`}>
            Manage Course
            <FiExternalLink />
          </ViewButton>
          
          <DropdownMenu>
            <DropdownButton onClick={handleDropdownClick}>
              <FiMoreVertical />
            </DropdownButton>
            
            {showDropdown && (
              <DropdownContent
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {onEdit && (
                  <DropdownItem onClick={() => handleAction(() => onEdit(course))}>
                    <FiEdit />
                    Edit Details
                  </DropdownItem>
                )}
                {onDuplicate && (
                  <DropdownItem onClick={() => handleAction(() => onDuplicate(course))}>
                    <FiCopy />
                    Duplicate Course
                  </DropdownItem>
                )}
                {onDelete && (
                  <DropdownItem onClick={() => handleAction(() => onDelete(course))}>
                    <FiTrash2 />
                    Delete Course
                  </DropdownItem>
                )}
              </DropdownContent>
            )}
          </DropdownMenu>
        </ActionRow>
      </CardContent>
    </CardContainer>
  );
};