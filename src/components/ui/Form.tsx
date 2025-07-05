// Unified Form Components
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';

export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'default' | 'search' | 'filled' | 'outline';

interface BaseInputProps {
  $size?: InputSize;
  $variant?: InputVariant;
  $hasError?: boolean;
  $hasIcon?: boolean;
}

const sizeStyles = {
  small: {
    padding: '8px 12px',
    fontSize: '13px',
    iconSize: '16px'
  },
  medium: {
    padding: '12px 16px',
    fontSize: '14px',
    iconSize: '20px'
  },
  large: {
    padding: '16px 20px',
    fontSize: '16px',
    iconSize: '24px'
  }
};

const variantStyles = {
  default: `
    background: white;
    border: 2px solid #E5E7EB;
    
    &:focus {
      border-color: #985DD7;
      box-shadow: 0 0 0 3px rgba(152, 93, 215, 0.1);
    }
  `,
  search: `
    background: white;
    border: 2px solid #E5E7EB;
    padding-left: 48px;
    
    &:focus {
      border-color: #985DD7;
      box-shadow: 0 0 0 3px rgba(152, 93, 215, 0.1);
    }
  `,
  filled: `
    background: #F3F4F6;
    border: 2px solid transparent;
    
    &:focus {
      background: white;
      border-color: #985DD7;
      box-shadow: 0 0 0 3px rgba(152, 93, 215, 0.1);
    }
  `,
  outline: `
    background: transparent;
    border: 2px solid #E5E7EB;
    
    &:focus {
      border-color: #985DD7;
      background: white;
    }
  `
};

export const Input = styled.input<BaseInputProps>`
  width: 100%;
  padding: ${({ $size = 'medium' }) => sizeStyles[$size].padding};
  font-size: ${({ $size = 'medium' }) => sizeStyles[$size].fontSize};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.body};
  outline: none;
  
  ${({ $variant = 'default' }) => variantStyles[$variant]}
  
  ${({ $hasError, theme }) => $hasError && `
    border-color: ${theme.colors.brand.coral};
    
    &:focus {
      border-color: ${theme.colors.brand.coral};
      box-shadow: 0 0 0 3px rgba(254, 67, 114, 0.1);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #F9FAFB;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.7;
  }
`;

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  onClear?: () => void;
}

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SearchIcon = styled(FiSearch)<{ $size: InputSize }>`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.secondary};
  width: ${({ $size }) => sizeStyles[$size].iconSize};
  height: ${({ $size }) => sizeStyles[$size].iconSize};
  pointer-events: none;
`;

export const SearchInput: React.FC<SearchInputProps> = ({
  size = 'medium',
  ...props
}) => {
  return (
    <SearchInputWrapper>
      <SearchIcon $size={size} />
      <Input
        $variant="search"
        $size={size}
        type="text"
        {...props}
      />
    </SearchInputWrapper>
  );
};

export const TextArea = styled.textarea<BaseInputProps>`
  width: 100%;
  padding: ${({ $size = 'medium' }) => sizeStyles[$size].padding};
  font-size: ${({ $size = 'medium' }) => sizeStyles[$size].fontSize};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.body};
  background: white;
  border: 2px solid #E5E7EB;
  resize: vertical;
  min-height: 100px;
  outline: none;
  
  &:focus {
    border-color: #985DD7;
    box-shadow: 0 0 0 3px rgba(152, 93, 215, 0.1);
  }
  
  ${({ $hasError, theme }) => $hasError && `
    border-color: ${theme.colors.brand.coral};
    
    &:focus {
      border-color: ${theme.colors.brand.coral};
      box-shadow: 0 0 0 3px rgba(254, 67, 114, 0.1);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #F9FAFB;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.7;
  }
`;

export const Select = styled.select<BaseInputProps>`
  width: 100%;
  padding: ${({ $size = 'medium' }) => sizeStyles[$size].padding};
  font-size: ${({ $size = 'medium' }) => sizeStyles[$size].fontSize};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.body};
  background: white;
  border: 2px solid #E5E7EB;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
  
  &:focus {
    border-color: #985DD7;
    box-shadow: 0 0 0 3px rgba(152, 93, 215, 0.1);
  }
  
  ${({ $hasError, theme }) => $hasError && `
    border-color: ${theme.colors.brand.coral};
    
    &:focus {
      border-color: ${theme.colors.brand.coral};
      box-shadow: 0 0 0 3px rgba(254, 67, 114, 0.1);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #F9FAFB;
  }
`;

export const FormField = styled.div<{ $spacing?: 'small' | 'medium' | 'large' }>`
  margin-bottom: ${({ $spacing = 'medium' }) => 
    $spacing === 'small' ? '12px' : 
    $spacing === 'large' ? '24px' : '16px'
  };
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const FormLabel = styled.label<{ $required?: boolean }>`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  
  ${({ $required }) => $required && `
    &::after {
      content: ' *';
      color: #FE4372;
    }
  `}
`;

export const FormError = styled(motion.span)`
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.brand.coral};
`;

export const FormHelperText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Aliases for backward compatibility
export const Label = FormLabel;
export const FormText = FormHelperText;

// FormGroup component
export const FormGroup = styled.div<{ $spacing?: 'small' | 'medium' | 'large' }>`
  margin-bottom: ${({ $spacing = 'medium' }) => 
    $spacing === 'small' ? '16px' : 
    $spacing === 'large' ? '32px' : '24px'
  };
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// Checkbox component
export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.brand.primary};
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Radio component
export const Radio = styled.input.attrs({ type: 'radio' })`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.brand.primary};
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;