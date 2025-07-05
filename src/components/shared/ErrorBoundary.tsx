// src/components/shared/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';
import { Alert } from '@/styles/StyledComponents';

const ErrorContainer = styled.div`
  padding: 20px;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: ${({ theme }) => theme.colors.status.danger};
  margin-bottom: 10px;
`;

const ErrorDetails = styled.pre`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  padding: 10px;
  border-radius: 8px;
  font-size: 0.875rem;
  overflow-x: auto;
  text-align: left;
  margin-top: 10px;
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <ErrorContainer>
          <Alert variant="error">
            <ErrorTitle>Something went wrong</ErrorTitle>
            <p>An error occurred while rendering this component.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <ErrorDetails>{this.state.error.toString()}</ErrorDetails>
            )}
          </Alert>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;