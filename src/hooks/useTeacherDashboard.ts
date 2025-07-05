import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/client';

interface DashboardData {
  totalStudents: number;
  totalRooms: number;
  totalChatbots: number;
  activeRooms: number;
  recentActivity: any[];
  studentEngagement: any[];
}

// Hook for fetching teacher dashboard data with caching
export function useTeacherDashboard() {
  return useQuery({
    queryKey: queryKeys.teacher.dashboard,
    queryFn: async () => {
      const response = await fetch('/api/teacher/dashboard-data');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json() as Promise<DashboardData>;
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for fetching teacher stats with caching
export function useTeacherStats() {
  return useQuery({
    queryKey: queryKeys.teacher.stats,
    queryFn: async () => {
      const response = await fetch('/api/teacher/dashboard-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    // Stats can be cached longer
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Hook for prefetching dashboard data
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    // Prefetch dashboard data
    queryClient.prefetchQuery({
      queryKey: queryKeys.teacher.dashboard,
      queryFn: async () => {
        const response = await fetch('/api/teacher/dashboard-data');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        return response.json();
      },
    });
    
    // Prefetch stats
    queryClient.prefetchQuery({
      queryKey: queryKeys.teacher.stats,
      queryFn: async () => {
        const response = await fetch('/api/teacher/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        return response.json();
      },
    });
  };
}