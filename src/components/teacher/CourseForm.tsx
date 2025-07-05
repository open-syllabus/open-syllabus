import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiImage, FiSave, FiAlertCircle } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { Input, FormField, FormLabel, FormError, FormHelperText } from '@/components/ui';
import type { Course } from '@/types/database.types';

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (courseData: Partial<Course>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const FormContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const FormHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.lg};
  right: ${({ theme }) => theme.spacing.lg};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const FormBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const FormGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.brand.primary}20`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  font-family: inherit;
  background: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.brand.primary}20`};
  }
  
  option {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ThumbnailSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const ThumbnailPreview = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  svg {
    width: 60px;
    height: 60px;
    color: ${({ theme }) => theme.colors.text.muted};
    opacity: 0.5;
  }
`;

const FormFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
`;

const ErrorAlert = styled(motion.div)`
  background: ${({ theme }) => `${theme.colors.status.danger}10`};
  border: 1px solid ${({ theme }) => `${theme.colors.status.danger}30`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.status.danger};
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.status.danger};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const subjects = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Languages',
  'Computer Science',
  'Art & Design',
  'Music',
  'Physical Education',
  'Religious Studies',
  'Other'
];

const yearGroups = [
  { value: 'reception', label: 'Reception' },
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Year 5' },
  { value: '6', label: 'Year 6' },
  { value: '7', label: 'Year 7' },
  { value: '8', label: 'Year 8' },
  { value: '9', label: 'Year 9' },
  { value: '10', label: 'Year 10' },
  { value: '11', label: 'Year 11' },
  { value: '12', label: 'Year 12 (AS Level)' },
  { value: '13', label: 'Year 13 (A Level)' },
];

export const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    subject: course?.subject || '',
    year_group: course?.year_group || '',
    thumbnail_url: course?.thumbnail_url || ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.thumbnail_url && !isValidUrl(formData.thumbnail_url)) {
      newErrors.thumbnail_url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const courseData: Partial<Course> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        subject: formData.subject || null,
        year_group: formData.year_group || null,
        thumbnail_url: formData.thumbnail_url.trim() || null
      };
      
      if (course) {
        courseData.course_id = course.course_id;
      }
      
      await onSubmit(courseData);
    } catch (error) {
      console.error('Error submitting course:', error);
      setGeneralError('Failed to save course. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  // Use portal to render modal outside of any parent containers
  const modalContent = (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <FormContainer
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <FormHeader>
          <HeaderTitle>{course ? 'Edit Course' : 'Create New Course'}</HeaderTitle>
          <CloseButton onClick={onCancel}>
            <FiX />
          </CloseButton>
        </FormHeader>
        
        <FormBody>
          <form onSubmit={handleSubmit}>
            <FormGrid>
              {generalError && (
                <ErrorAlert
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiAlertCircle />
                  <p>{generalError}</p>
                </ErrorAlert>
              )}
              
              <FormField>
                <FormLabel $required>Course Title</FormLabel>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., GCSE Mathematics Foundation"
                  $hasError={!!errors.title}
                  disabled={isLoading}
                />
                {errors.title && <FormError>{errors.title}</FormError>}
              </FormField>
              
              <FormField>
                <FormLabel>Description</FormLabel>
                <TextArea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of what students will learn..."
                  disabled={isLoading}
                />
                {errors.description && <FormError>{errors.description}</FormError>}
                <FormHelperText>
                  {formData.description.length}/500 characters
                </FormHelperText>
              </FormField>
              
              <FormRow>
                <FormField>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </Select>
                </FormField>
                
                <FormField>
                  <FormLabel>Year Group</FormLabel>
                  <Select
                    value={formData.year_group}
                    onChange={(e) => handleChange('year_group', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select year group</option>
                    {yearGroups.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </FormRow>
              
              <ThumbnailSection>
                <FormField>
                  <FormLabel>Thumbnail Image URL</FormLabel>
                  <Input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleChange('thumbnail_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    $hasError={!!errors.thumbnail_url}
                    disabled={isLoading}
                  />
                  {errors.thumbnail_url && <FormError>{errors.thumbnail_url}</FormError>}
                  <FormHelperText>
                    Optional: Add an image to make your course more appealing
                  </FormHelperText>
                </FormField>
                
                {formData.thumbnail_url && isValidUrl(formData.thumbnail_url) && (
                  <ThumbnailPreview>
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Course thumbnail"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </ThumbnailPreview>
                )}
              </ThumbnailSection>
            </FormGrid>
          </form>
        </FormBody>
        
        <FormFooter>
          <ModernButton
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            <FiSave />
            {course ? 'Update Course' : 'Create Course'}
          </ModernButton>
        </FormFooter>
      </FormContainer>
    </Overlay>
  );
  
  // Only render the portal on the client side
  if (typeof document === 'undefined') {
    return null;
  }
  
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};