'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { ModernNavWithoutOnboarding } from '@/components/teacher/ModernNavWrapper';
import Link from 'next/link';
import { 
  FiUsers, 
  FiGrid, 
  FiUserCheck, 
  FiDatabase,
  FiMail,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiSettings
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

const SchoolInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, 
        ${({ theme }) => theme.colors.brand.accent}10, 
    ${({ theme }) => theme.colors.brand.accent}10
  );
  border-radius: 12px;
  margin-bottom: 32px;
`;

const SchoolName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SubscriptionBadge = styled.span<{ $tier: string }>`
  padding: 6px 12px;
  background: ${({ $tier, theme }) => 
    $tier === 'paid' ? `${theme.colors.status.success}20` : 
    $tier === 'premium' ? `${theme.colors.brand.secondary}20` : 
    `${theme.colors.text.muted}20`};
  color: ${({ $tier, theme }) => 
    $tier === 'paid' ? theme.colors.status.success : 
    $tier === 'premium' ? theme.colors.brand.secondary : 
    theme.colors.text.muted};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
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

const LockedAction = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  gap: 12px;
  opacity: 0.6;
  position: relative;
  
  svg {
    width: 32px;
    height: 32px;
  }
  
  span {
    font-weight: 500;
    font-size: 14px;
  }
`;

const PremiumBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${({ theme }) => theme.colors.brand.secondary};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

interface AdminData {
  school: {
    school_id: string;
    name: string;
    subscription_tier: string;
    features: any;
  };
  stats: {
    total_students: number;
    total_teachers: number;
    smart_classes: number;
    manual_classes: number;
  };
  permissions: any;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

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

      // Check if school admin
      const { data: adminRecord } = await supabase
        .from('school_admins')
        .select(`
          school_id,
          permissions,
          schools!inner(
            school_id,
            name,
            subscription_tier,
            features
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (!adminRecord) {
        router.push('/teacher-dashboard');
        return;
      }

      // Fetch stats
      const [students, teachers, smartClasses, manualClasses] = await Promise.all([
        supabase
          .from('master_students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', adminRecord.school_id)
          .eq('is_active', true),
        supabase
          .from('teacher_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', adminRecord.school_id),
        supabase
          .from('smart_classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', adminRecord.school_id)
          .eq('class_type', 'smart')
          .eq('is_active', true),
        supabase
          .from('smart_classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', adminRecord.school_id)
          .eq('class_type', 'manual')
          .eq('is_active', true)
      ]);

      setAdminData({
        school: adminRecord.schools as any,
        stats: {
          total_students: students.count || 0,
          total_teachers: teachers.count || 0,
          smart_classes: smartClasses.count || 0,
          manual_classes: manualClasses.count || 0
        },
        permissions: adminRecord.permissions
      });
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/teacher-dashboard');
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

  if (!adminData) {
    router.push('/teacher-dashboard');
    return null;
  }

  const { school, stats, permissions } = adminData;
  const isPaid = school.subscription_tier !== 'free';
  const isPremium = school.subscription_tier === 'premium';

  return (
    <PageContainer>
      <ModernNavWithoutOnboarding />
      <MainContent>
        <Header>
          <Title>School Admin Dashboard</Title>
          <Subtitle>Manage your school's students, teachers, and classes</Subtitle>
        </Header>

        <SchoolInfo>
          <SchoolName>{school.name}</SchoolName>
          <SubscriptionBadge $tier={school.subscription_tier}>
            {school.subscription_tier} Plan
          </SubscriptionBadge>
        </SchoolInfo>

        <StatsGrid>
          <StatCard>
            <StatIcon $color="#985DD7">
              <FiUsers />
            </StatIcon>
            <StatValue>{stats.total_students}</StatValue>
            <StatLabel>Total Students</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#4ECDC4">
              <FiUserCheck />
            </StatIcon>
            <StatValue>{stats.total_teachers}</StatValue>
            <StatLabel>Total Teachers</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#FFB84D">
              <FiGrid />
            </StatIcon>
            <StatValue>{stats.smart_classes}</StatValue>
            <StatLabel>Smart Classes</StatLabel>
          </StatCard>

          <StatCard>
            <StatIcon $color="#FF6B6B">
              <FiGrid />
            </StatIcon>
            <StatValue>{stats.manual_classes}</StatValue>
            <StatLabel>Manual Classes</StatLabel>
          </StatCard>
        </StatsGrid>

        <QuickActions>
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionGrid>
            <ActionButton href="/admin/students">
              <FiUsers />
              <span>Manage Students</span>
            </ActionButton>

            {isPaid ? (
              <ActionButton href="/admin/classes">
                <FiGrid />
                <span>Smart Classes</span>
              </ActionButton>
            ) : (
              <LockedAction>
                <PremiumBadge>Paid</PremiumBadge>
                <FiGrid />
                <span>Smart Classes</span>
              </LockedAction>
            )}

            <ActionButton href="/admin/teachers">
              <FiUserCheck />
              <span>Manage Teachers</span>
            </ActionButton>

            {isPaid ? (
              <ActionButton href="/admin/bulk-upload">
                <FiDatabase />
                <span>Bulk Upload</span>
              </ActionButton>
            ) : (
              <LockedAction>
                <PremiumBadge>Paid</PremiumBadge>
                <FiDatabase />
                <span>Bulk Upload</span>
              </LockedAction>
            )}

            <ActionButton href="/admin/invitations">
              <FiMail />
              <span>Invitations</span>
            </ActionButton>

            <ActionButton href="/admin/settings">
              <FiSettings />
              <span>School Settings</span>
            </ActionButton>

            <ActionButton href="/admin/subscription">
              <FiDollarSign />
              <span>Subscription</span>
            </ActionButton>

            {isPremium ? (
              <ActionButton href="/admin/analytics">
                <FiTrendingUp />
                <span>Analytics</span>
              </ActionButton>
            ) : (
              <LockedAction>
                <PremiumBadge>Premium</PremiumBadge>
                <FiTrendingUp />
                <span>Analytics</span>
              </LockedAction>
            )}
          </ActionGrid>
        </QuickActions>

        {!isPaid && (
          <QuickActions>
            <SectionTitle>Upgrade to Unlock Features</SectionTitle>
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Upgrade to a paid plan to unlock smart classes, bulk upload, and more features.
            </p>
            <ActionButton href="/admin/subscription" style={{ maxWidth: '200px' }}>
              <FiDollarSign />
              <span>View Plans</span>
            </ActionButton>
          </QuickActions>
        )}
      </MainContent>
    </PageContainer>
  );
}