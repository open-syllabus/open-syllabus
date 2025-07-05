import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults for production
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000,
      // Retry failed queries 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (good for real-time data)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Teacher queries
  teacher: {
    dashboard: ['teacher', 'dashboard'] as const,
    rooms: ['teacher', 'rooms'] as const,
    room: (roomId: string) => ['teacher', 'room', roomId] as const,
    students: (roomId?: string) => roomId 
      ? ['teacher', 'students', roomId] as const 
      : ['teacher', 'students'] as const,
    chatbots: ['teacher', 'chatbots'] as const,
    chatbot: (chatbotId: string) => ['teacher', 'chatbot', chatbotId] as const,
    stats: ['teacher', 'stats'] as const,
  },
  
  // Student queries
  student: {
    dashboard: ['student', 'dashboard'] as const,
    profile: (studentId: string) => ['student', 'profile', studentId] as const,
    notebooks: (studentId: string) => ['student', 'notebooks', studentId] as const,
    assessments: (studentId: string) => ['student', 'assessments', studentId] as const,
    rooms: (studentId: string) => ['student', 'rooms', studentId] as const,
  },
  
  // Chat queries
  chat: {
    messages: (roomId: string, chatbotId: string) => ['chat', 'messages', roomId, chatbotId] as const,
    history: (roomId: string) => ['chat', 'history', roomId] as const,
  },
  
  // Common queries
  common: {
    user: ['user'] as const,
    role: (userId: string) => ['role', userId] as const,
  },
};