'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { ModernNavWithoutOnboarding } from '@/components/teacher/ModernNavWrapper';
import Link from 'next/link';
import { 
  FiGlobe, 
  FiUsers, 
  FiDollarSign, 
  FiCheckCircle,
  FiAlertCircle,
  FiUserPlus,
  FiShield,
  FiTrendingUp
} from 'react-icons/fi';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  padding: 40px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: 80px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    padding: 80px 20px 20px;
  }
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  }
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const StatValue = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 4px;
`;

const StatLabel = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const QuickActions = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 24px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const ActionButton = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 12px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease;
  text-align: center;
  gap: 12px;
  
  &:hover {
    background: ${({ theme }) => theme.colors.brand.primary}10;
    transform: translateY(-2px);
  }
  
  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  span {
    font-weight: 500;
    font-size: 14px;
  }
`;

const RecentActivity = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 12px;
`;

const ActivityIcon = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $type, theme }) => 
    $type === 'school' ? theme.colors.brand.accent : 
    $type === 'admin' ? theme.colors.brand.primary : 
    theme.colors.brand.green}20;
  color: ${({ $type, theme }) => 
    $type === 'school' ? theme.colors.brand.accent : 
    $type === 'admin' ? theme.colors.brand.primary : 
    theme.colors.brand.green};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 4px;
  }
  
  p {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ActivityTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SuperAdminBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.accent}
  );
  color: white;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 24px;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export default function SuperAdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_schools: 0,
    paid_schools: 0,
    total_teachers: 0,
    total_students: 0,
    pending_verifications: 0,
    total_admins: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // Check if super admin
      const { data: isSuperAdmin } = await supabase
        .rpc('is_super_admin', { p_user_id: user.id });

      if (!isSuperAdmin) {
        router.push('/teacher-dashboard');
        return;
      }

      // Fetch dashboard data
      const response = await fetch('/api/super-admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        
        // Format recent activity
        const activities: Array<{
          type: string;
          title: string;
          description: string;
          time: string;
        }> = [];
        
        // Add recent schools
        data.recent_schools?.slice(0, 3).forEach((school: any) => {
          activities.push({
            type: 'school',
            title: `New school: ${school.name}`,
            description: `${school._count?.[0]?.count || 0} teachers`,
            time: new Date(school.created_at).toLocaleDateString()
          });
        });
        
        // Add recent admins
        data.recent_admins?.slice(0, 2).forEach((admin: any) => {
          activities.push({
            type: 'admin',
            title: `New admin: ${admin.user?.email}`,
            description: `School: ${admin.school?.name}`,
            time: new Date(admin.created_at).toLocaleDateString()
          });
        });
        
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ModernNavWithoutOnboarding />
        <MainContent>
          <LoadingState>Loading...</LoadingState>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ModernNavWithoutOnboarding />
      <MainContent>
        <Header>
          <SuperAdminBadge>
            <FiShield />
            Super Admin Access
          </SuperAdminBadge>
          <Title>Platform Dashboard</Title>
          <Subtitle>Monitor and manage the entire Skolr platform</Subtitle>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon $color="#985DD7">
              <FiGlobe />
            </StatIcon>
            <StatValue>{stats.total_schools}</StatValue>
            <StatLabel>Total Schools</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#4ECDC4">
              <FiDollarSign />
            </StatIcon>
            <StatValue>{stats.paid_schools}</StatValue>
            <StatLabel>Paid Schools</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#FFB84D">
              <FiUsers />
            </StatIcon>
            <StatValue>{stats.total_teachers}</StatValue>
            <StatLabel>Total Teachers</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#FF6B6B">
              <FiCheckCircle />
            </StatIcon>
            <StatValue>{stats.pending_verifications}</StatValue>
            <StatLabel>Pending Verifications</StatLabel>
          </StatCard>
        </StatsGrid>

        <QuickActions>
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionGrid>
            <ActionButton href="/super-admin/create-admin">
              <FiUserPlus />
              <span>Create Admin</span>
            </ActionButton>
            <ActionButton href="/super-admin/verifications">
              <FiCheckCircle />
              <span>Review Verifications</span>
            </ActionButton>
            <ActionButton href="/super-admin/domains">
              <FiShield />
              <span>Manage Domains</span>
            </ActionButton>
            <ActionButton href="/super-admin/schools">
              <FiGlobe />
              <span>View All Schools</span>
            </ActionButton>
          </ActionGrid>
        </QuickActions>

        <RecentActivity>
          <SectionTitle>Recent Activity</SectionTitle>
          <ActivityList>
            {recentActivity.map((activity, index) => (
              <ActivityItem key={index}>
                <ActivityIcon $type={activity.type}>
                  {activity.type === 'school' ? <FiGlobe /> : 
                   activity.type === 'admin' ? <FiUserPlus /> : 
                   <FiTrendingUp />}
                </ActivityIcon>
                <ActivityContent>
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                </ActivityContent>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityItem>
            ))}
          </ActivityList>
        </RecentActivity>

        {/* Whitelist feature removed for open source version */}
      </MainContent>
    </PageContainer>
  );
}