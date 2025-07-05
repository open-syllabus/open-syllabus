import { 
  FiFile, 
  FiFileText, 
  FiImage, 
  FiVideo, 
  FiMusic,
  FiArchive,
  FiDownload
} from 'react-icons/fi';
import { IconType } from 'react-icons';

export interface FileTypeInfo {
  icon: IconType;
  color: string;
  category: string;
}

export const getFileTypeInfo = (fileName: string, mimeType?: string): FileTypeInfo => {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  
  // Document types
  if (['pdf'].includes(extension)) {
    return { icon: FiFileText, color: '#EF4444', category: 'PDF' };
  }
  
  if (['doc', 'docx'].includes(extension)) {
    return { icon: FiFileText, color: '#2563EB', category: 'Document' };
  }
  
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return { icon: FiFileText, color: '#059669', category: 'Spreadsheet' };
  }
  
  if (['ppt', 'pptx'].includes(extension)) {
    return { icon: FiFileText, color: '#DC2626', category: 'Presentation' };
  }
  
  if (['txt', 'rtf'].includes(extension)) {
    return { icon: FiFileText, color: '#6B7280', category: 'Text' };
  }
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return { icon: FiImage, color: '#7C3AED', category: 'Image' };
  }
  
  // Video types
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return { icon: FiVideo, color: '#DC2626', category: 'Video' };
  }
  
  // Audio types
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
    return { icon: FiMusic, color: '#059669', category: 'Audio' };
  }
  
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { icon: FiArchive, color: '#D97706', category: 'Archive' };
  }
  
  // Default
  return { icon: FiFile, color: '#6B7280', category: 'File' };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const truncateFileName = (fileName: string, maxLength: number): string => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExtension.substring(0, maxLength - extension!.length - 4) + '...';
  
  return truncatedName + '.' + extension;
};

export const validateFileType = (fileName: string, allowedTypes?: string[]): boolean => {
  if (!allowedTypes) return true;
  
  const extension = fileName.toLowerCase().split('.').pop() || '';
  return allowedTypes.includes(extension);
};

export const validateFileSize = (fileSize: number, maxSizeMB: number = 10): boolean => {
  return fileSize <= maxSizeMB * 1024 * 1024;
};