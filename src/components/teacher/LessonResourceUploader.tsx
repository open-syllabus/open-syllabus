'use client';

import React, { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDownload, 
  FiPlus, 
  FiX, 
  FiUpload, 
  FiFile, 
  FiTrash2,
  FiExternalLink
} from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { getFileTypeInfo, formatFileSize, truncateFileName } from '@/utils/file-icons';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface LessonResource {
  id?: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  file?: File;
}

interface LessonResourceUploaderProps {
  resources: LessonResource[];
  onResourcesChange: (resources: LessonResource[]) => void;
  disabled?: boolean;
}

const ResourcesSection = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const ResourcesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResourceItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
    border-color: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
`;

const FileIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: ${({ $color }) => $color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ $color }) => $color};
  }
`;

const ResourceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResourceName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ResourceMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ResourceCategory = styled.span<{ $color: string }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  background: ${({ $color }) => $color}15;
  color: ${({ $color }) => $color};
`;

const ResourceActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &.delete:hover {
    color: ${({ theme }) => theme.colors.status.danger};
    background: ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.1)};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const UploadArea = styled.div<{ $isDragOver: boolean }>`
  border: 2px dashed ${({ $isDragOver, theme }) => 
    $isDragOver ? theme.colors.brand.primary : hexToRgba(theme.colors.brand.primary, 0.3)};
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  background: ${({ $isDragOver, theme }) => 
    $isDragOver ? hexToRgba(theme.colors.brand.primary, 0.05) : 'transparent'};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.02)};
  }
`;

const UploadIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const UploadText = styled.div`
  h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  p {
    margin: 0;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
`;

export const LessonResourceUploader: React.FC<LessonResourceUploaderProps> = ({
  resources,
  onResourcesChange,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;
    
    const newResources: LessonResource[] = [];
    
    Array.from(files).forEach(file => {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
      
      newResources.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      });
    });
    
    if (newResources.length > 0) {
      onResourcesChange([...resources, ...newResources]);
    }
  };
  
  const handleUploadClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };
  
  const removeResource = (index: number) => {
    if (disabled) return;
    const newResources = resources.filter((_, i) => i !== index);
    onResourcesChange(newResources);
  };
  
  const downloadResource = (resource: LessonResource) => {
    if (resource.url) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  return (
    <ResourcesSection>
      <SectionTitle>
        <FiDownload />
        Downloadable Resources
      </SectionTitle>
      
      <ResourcesList>
        <AnimatePresence>
          {resources.map((resource, index) => {
            const fileTypeInfo = getFileTypeInfo(resource.name, resource.type);
            const IconComponent = fileTypeInfo.icon;
            
            return (
              <ResourceItem
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FileIcon $color={fileTypeInfo.color}>
                  <IconComponent />
                </FileIcon>
                
                <ResourceInfo>
                  <ResourceName title={resource.name}>
                    {truncateFileName(resource.name, 30)}
                  </ResourceName>
                  <ResourceMeta>
                    <ResourceCategory $color={fileTypeInfo.color}>
                      {fileTypeInfo.category}
                    </ResourceCategory>
                    {resource.size && (
                      <span>{formatFileSize(resource.size)}</span>
                    )}
                    {resource.file && (
                      <span>• Pending upload</span>
                    )}
                  </ResourceMeta>
                </ResourceInfo>
                
                <ResourceActions>
                  {resource.url && (
                    <ActionButton
                      onClick={() => downloadResource(resource)}
                      title="Download resource"
                    >
                      <FiExternalLink />
                    </ActionButton>
                  )}
                  <ActionButton
                    className="delete"
                    onClick={() => removeResource(index)}
                    title="Remove resource"
                    disabled={disabled}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ResourceActions>
              </ResourceItem>
            );
          })}
        </AnimatePresence>
        
        {!disabled && (
          <UploadArea
            $isDragOver={isDragOver}
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon>
              <FiUpload />
            </UploadIcon>
            <UploadText>
              <h4>Upload Resources</h4>
              <p>
                Drag and drop files here, or click to select files
                <br />
                <small>Maximum 10MB per file • PDF, DOC, XLS, PPT, Images supported</small>
              </p>
            </UploadText>
          </UploadArea>
        )}
        
        {resources.length === 0 && disabled && (
          <EmptyState>
            No resources uploaded for this lesson
          </EmptyState>
        )}
        
        <HiddenInput
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.zip,.rar"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </ResourcesList>
    </ResourcesSection>
  );
};