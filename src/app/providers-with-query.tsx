'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import StyledComponentsRegistry from '@/lib/StyledComponentsRegistry';
import ThemeProvider from '@/components/ThemeProvider';
import { queryClient } from '@/lib/react-query/client';

export default function ProvidersWithQuery({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StyledComponentsRegistry>
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ThemeProvider>
      </StyledComponentsRegistry>
    </QueryClientProvider>
  );
}