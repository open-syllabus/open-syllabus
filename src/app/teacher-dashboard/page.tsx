// src/app/teacher-dashboard/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { LazyTeacherNerveCenter as TeacherNerveCenter } from '@/components/shared/LazyComponents';
import { FullPageLoader } from '@/components/shared/AnimatedLoader';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

interface DashboardStats {
  totalStudents: number;
  totalChatbots: number;
  totalRooms: number;
  activeRooms: number;
  assessmentsCompleted: number;
  activeConcerns: number;
  roomEngagement?: any[];
}

interface Activity {
  id: string;
  type: 'student' | 'room' | 'assessment' | 'concern';
  content: string;
  time: string;
  navigationPath?: string;
}

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

function DashboardContent() {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data from optimized endpoint
      const response = await fetch('/api/teacher/dashboard-all');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch dashboard data' }));
        console.error('[TeacherDashboard] API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      console.log('[TeacherDashboard] Received data:', {
        hasProfile: !!data.profile,
        roomsCount: data.rooms?.length || 0,
        hasStats: !!data.stats
      });
      
      // Store the full dashboard data
      setDashboardData(data);
      
      // Set teacher name
      if (data.profile) {
        setTeacherName(data.profile.full_name);
      }

      // Set stats - provide defaults if stats are missing
      setStats({
        totalStudents: data.stats?.totalStudents || 0,
        totalChatbots: data.stats?.totalChatbots || 0,
        totalRooms: data.stats?.totalRooms || 0,
        activeRooms: data.stats?.activeRooms || 0,
        assessmentsCompleted: data.stats?.assessmentsCompleted || 0,
        activeConcerns: data.stats?.pendingConcerns || 0,
        roomEngagement: data.stats?.roomEngagement || []
      });

      // Process recent activity
      const activities: Activity[] = [];
      const roomMap = new Map(data.rooms?.map((r: any) => [r.room_id, r.room_name]) || []);

      // Process joins
      data.recentActivity?.joins?.forEach((join: any) => {
        const student = join.students;
        const studentName = student ? `${student.first_name} ${student.surname}`.trim() || student.username : 'A student';
        const roomName = roomMap.get(join.room_id) || 'a room';
        
        activities.push({
          id: `join-${join.student_id}-${join.room_id}`,
          type: 'student',
          content: `${studentName} joined ${roomName}`,
          time: formatTimeAgo(new Date(join.joined_at)),
          navigationPath: `/teacher-dashboard/rooms/${join.room_id}/students/${join.student_id}`
        });
      });

      // Process assessments
      data.recentActivity?.assessments?.forEach((assessment: any) => {
        const student = assessment.students;
        const studentName = student ? `${student.first_name} ${student.surname}`.trim() || student.username : 'A student';
        const chatbotName = assessment.chatbots?.name || 'assessment';
        const roomName = roomMap.get(assessment.room_id) || 'a room';
        
        activities.push({
          id: `assessment-${assessment.assessment_id}`,
          type: 'assessment',
          content: `${studentName} completed ${chatbotName} in ${roomName}`,
          time: formatTimeAgo(new Date(assessment.assessed_at)),
          navigationPath: `/teacher-dashboard/assessments/${assessment.assessment_id}`
        });
      });

      // Process concerns
      data.recentActivity?.concerns?.forEach((concern: any) => {
        const roomName = roomMap.get(concern.room_id) || 'a room';
        
        activities.push({
          id: `concern-${concern.flag_id}`,
          type: 'concern',
          content: `Safety alert in ${roomName}`,
          time: formatTimeAgo(new Date(concern.created_at)),
          navigationPath: `/teacher-dashboard/concerns/${concern.flag_id}`
        });
      });

      // Sort activities by time
      activities.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });

      setRecentActivity(activities.slice(0, 10));
      
    } catch (error) {
      console.error('[TeacherDashboard] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr === 'just now') return 0;
    
    const match = timeStr.match(/(\d+)\s+(minute|hour|day)/);
    if (!match) return Infinity;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute': return value;
      case 'hour': return value * 60;
      case 'day': return value * 1440;
      default: return Infinity;
    }
  };

  // Combine room engagement data with all rooms to ensure all rooms are shown
  const roomEngagementMap = new Map(
    stats?.roomEngagement?.map((room: any) => [
      room.room_id,
      {
        activeStudents: room.activeStudents,
        totalStudents: room.totalStudents,
        recentChats: room.recentChats || 0
      }
    ]) || []
  );

  // Create liveRoomData from all rooms, adding engagement data where available
  const liveRoomData = (dashboardData?.rooms || []).map((room: any) => {
    const engagement = roomEngagementMap.get(room.room_id);
    
    return {
      roomId: room.room_id,
      roomName: room.room_name,
      activeStudents: engagement?.activeStudents || 0,
      totalStudents: engagement?.totalStudents || room.student_count || 0,
      recentChats: engagement?.recentChats || 0
    };
  });

  if (loading || !stats) {
    return <FullPageLoader message="Loading your dashboard..." variant="dots" />;
  }

  return (
    <TeacherNerveCenter
      stats={stats}
      recentActivity={recentActivity}
      teacherName={teacherName}
      userId={dashboardData?.profile?.user_id}
      liveRoomData={liveRoomData}
    />
  );
}

export default function TeacherDashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageLoader message="Loading dashboard..." variant="dots" />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}