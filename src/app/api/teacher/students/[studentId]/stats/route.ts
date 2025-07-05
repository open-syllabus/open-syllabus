// src/app/api/teacher/students/[studentId]/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateTeacher } from '@/lib/supabase/teacher-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  try {
    // Authenticate teacher
    const authResult = await authenticateTeacher();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    const adminSupabase = createAdminClient();
    
    // Get student details
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('student_id, first_name, surname, username, year_group, auth_user_id')
      .eq('student_id', studentId)
      .eq('school_id', teacherProfile.school_id)
      .single();
      
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Get teacher's rooms to verify access
    const { data: teacherRooms } = await adminSupabase
      .from('rooms')
      .select('room_id')
      .eq('teacher_id', user.id);
      
    const roomIds = teacherRooms?.map(r => r.room_id) || [];
    
    // Check if student is in any of teacher's rooms
    const { data: studentRooms } = await adminSupabase
      .from('room_members')
      .select('room_id')
      .eq('student_id', studentId)
      .in('room_id', roomIds);
      
    if (!studentRooms || studentRooms.length === 0) {
      return NextResponse.json({ error: 'You do not have access to this student' }, { status: 403 });
    }
    
    // Calculate engagement metrics
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Get all messages from the student
    let totalMessages = 0;
    let lastMessageDate: Date | null = null;
    let messagesByHour: Record<number, number> = {};
    let dailyMessages: Record<string, number> = {};
    
    if (student.auth_user_id) {
      const { data: messages } = await adminSupabase
        .from('chat_messages')
        .select('created_at')
        .eq('user_id', student.auth_user_id)
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });
        
      if (messages && messages.length > 0) {
        totalMessages = messages.length;
        lastMessageDate = new Date(messages[0].created_at);
        
        // Analyze message patterns
        messages.forEach(msg => {
          const date = new Date(msg.created_at);
          const hour = date.getHours();
          const dayKey = date.toISOString().split('T')[0];
          
          messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
          dailyMessages[dayKey] = (dailyMessages[dayKey] || 0) + 1;
        });
      }
    }
    
    // Calculate most active time
    let mostActiveHour = 0;
    let maxMessages = 0;
    Object.entries(messagesByHour).forEach(([hour, count]) => {
      if (count > maxMessages) {
        maxMessages = count;
        mostActiveHour = parseInt(hour);
      }
    });
    
    const mostActiveTime = mostActiveHour < 12 
      ? `${mostActiveHour === 0 ? 12 : mostActiveHour}am-${(mostActiveHour + 1) === 12 ? 12 : (mostActiveHour + 1) % 12}${mostActiveHour + 1 < 12 ? 'am' : 'pm'}`
      : `${mostActiveHour === 12 ? 12 : mostActiveHour - 12}pm-${(mostActiveHour + 1) === 24 ? 12 : (mostActiveHour + 1) === 12 ? 12 : (mostActiveHour + 1) - 12}${mostActiveHour + 1 < 24 ? 'pm' : 'am'}`;
    
    // Calculate active days
    const activeDaysLastWeek = Object.keys(dailyMessages).filter(day => {
      const date = new Date(day);
      return date >= oneWeekAgo;
    }).length;
    
    const activeDaysLastMonth = Object.keys(dailyMessages).filter(day => {
      const date = new Date(day);
      return date >= oneMonthAgo;
    }).length;
    
    const averageMessagesPerDay = activeDaysLastMonth > 0 
      ? Math.round(totalMessages / activeDaysLastMonth) 
      : 0;
    
    // Get room activity details
    const { data: roomDetails } = await adminSupabase
      .from('rooms')
      .select('room_id, room_name')
      .in('room_id', studentRooms.map(r => r.room_id));
      
    const roomActivity = [];
    for (const room of roomDetails || []) {
      let roomMessageCount = 0;
      let lastRoomMessage: Date | null = null;
      
      if (student.auth_user_id) {
        const { data: roomMessages, count } = await adminSupabase
          .from('chat_messages')
          .select('created_at', { count: 'exact', head: false })
          .eq('user_id', student.auth_user_id)
          .eq('room_id', room.room_id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        roomMessageCount = count || 0;
        if (roomMessages && roomMessages.length > 0) {
          lastRoomMessage = new Date(roomMessages[0].created_at);
        }
      }
      
      // Calculate engagement rate (messages in last week)
      const { count: recentMessages } = await adminSupabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', student.auth_user_id)
        .eq('room_id', room.room_id)
        .gte('created_at', oneWeekAgo.toISOString());
        
      const engagementRate = recentMessages && recentMessages > 0 ? Math.min(100, (recentMessages / 7) * 20) : 0;
      
      roomActivity.push({
        room_id: room.room_id,
        room_name: room.room_name,
        message_count: roomMessageCount,
        last_active: lastRoomMessage?.toISOString() || null,
        engagement_rate: Math.round(engagementRate)
      });
    }
    
    // Get assessments
    const { data: assessments } = await adminSupabase
      .from('student_assessments')
      .select(`
        assessment_id,
        score,
        assessed_at,
        chatbot_id
      `)
      .eq('student_id', studentId)
      .in('room_id', roomIds)
      .eq('status', 'completed')
      .order('assessed_at', { ascending: false })
      .limit(10);
      
    // Get chatbot names
    const chatbotIds = assessments?.map(a => a.chatbot_id).filter(Boolean) || [];
    const { data: chatbots } = await adminSupabase
      .from('chatbots')
      .select('chatbot_id, name')
      .in('chatbot_id', chatbotIds);
    
    const chatbotMap = new Map(chatbots?.map(c => [c.chatbot_id, c.name]) || []);
      
    const totalCompleted = assessments?.length || 0;
    const averageScore = totalCompleted > 0 && assessments
      ? Math.round(assessments.reduce((sum, a) => sum + (a.score || 0), 0) / totalCompleted)
      : 0;
      
    const recentAssessments = assessments?.slice(0, 5).map(a => ({
      assessment_id: a.assessment_id,
      chatbot_name: chatbotMap.get(a.chatbot_id) || 'Unknown',
      score: a.score || 0,
      completed_at: a.assessed_at
    })) || [];
    
    // Get safety concerns - total and pending
    const { data: flaggedMessages, count: flaggedCount } = await adminSupabase
      .from('flagged_messages')
      .select('flag_id, created_at, severity, status', { count: 'exact' })
      .eq('student_id', student.auth_user_id)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    // Get count of pending concerns specifically
    const { count: pendingCount } = await adminSupabase
      .from('flagged_messages')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.auth_user_id)
      .eq('teacher_id', user.id)
      .eq('status', 'pending');
      
    // Calculate weekly activity for chart
    const weeklyActivity = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayIndex = date.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
      
      weeklyActivity.push({
        day: dayName,
        messages: dailyMessages[dayKey] || 0
      });
    }
    
    // Determine engagement trend
    const thisWeekMessages = weeklyActivity.slice(4).reduce((sum, day) => sum + day.messages, 0);
    const lastWeekMessages = weeklyActivity.slice(0, 3).reduce((sum, day) => sum + day.messages, 0);
    const engagementTrend = thisWeekMessages > lastWeekMessages * 1.2 ? 'increasing' 
      : thisWeekMessages < lastWeekMessages * 0.8 ? 'decreasing' 
      : 'stable';
    
    const stats = {
      student: {
        student_id: student.student_id,
        first_name: student.first_name,
        surname: student.surname,
        username: student.username,
        year_group: student.year_group
      },
      engagement: {
        last_active: lastMessageDate?.toISOString() || null,
        total_messages: totalMessages,
        active_days_last_week: activeDaysLastWeek,
        active_days_last_month: activeDaysLastMonth,
        average_messages_per_day: averageMessagesPerDay,
        most_active_time: mostActiveTime
      },
      rooms: {
        total_rooms: studentRooms.length,
        active_rooms: roomActivity.filter(r => r.engagement_rate > 0).length,
        room_activity: roomActivity.sort((a, b) => b.engagement_rate - a.engagement_rate)
      },
      assessments: {
        total_completed: totalCompleted,
        average_score: averageScore,
        recent_assessments: recentAssessments
      },
      safety: {
        flagged_messages: flaggedCount || 0,
        pending_concerns: pendingCount || 0,
        recent_concerns: flaggedMessages?.map(f => ({
          flag_id: f.flag_id,
          created_at: f.created_at,
          severity: f.severity,
          status: f.status
        })) || []
      },
      trends: {
        engagement_trend: engagementTrend,
        weekly_activity: weeklyActivity
      }
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student statistics' },
      { status: 500 }
    );
  }
}