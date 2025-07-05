// Modern animated navigation component
import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingStep } from '@/contexts/OnboardingContext';
import { PrefetchLink } from '@/components/navigation/PrefetchLink';
import { 
  FiHome, 
  FiUsers, 
  FiMessageSquare, 
  FiBookOpen, 
  FiAlertTriangle,
  FiUser,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiHelpCircle,
  FiShield,
  FiUserCheck,
  FiPlayCircle,
  FiGrid
} from 'react-icons/fi';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/teacher-dashboard', icon: <FiHome /> },
  { label: 'Students', href: '/teacher-dashboard/students', icon: <FiUserCheck /> },
  { label: 'Rooms', href: '/teacher-dashboard/rooms', icon: <FiUsers /> },
  { label: 'Skolrs', href: '/teacher-dashboard/chatbots', icon: <FiMessageSquare /> },
  { label: 'Assessments', href: '/teacher-dashboard/assessments', icon: <FiBookOpen /> },
  { label: 'Courses', href: '/teacher-dashboard/courses', icon: <FiPlayCircle /> },
  { label: 'Concerns', href: '/teacher-dashboard/concerns', icon: <FiAlertTriangle /> },
  { label: 'Content Filters', href: '/teacher-dashboard/content-filters', icon: <FiShield /> },
  { label: 'Guide', href: '/teacher-dashboard/guide', icon: <FiHelpCircle /> },
  { label: 'Profile', href: '/teacher-dashboard/profile', icon: <FiUser /> },
];

const NavContainer = styled(motion.nav)<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  max-height: 100vh;
  width: ${({ $isOpen }) => $isOpen ? '280px' : '80px'};
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border-right: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  box-shadow: 0 0 40px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: ${({ $isOpen }) => $isOpen ? '100%' : '0'};
    box-shadow: ${({ $isOpen }) => $isOpen ? '0 0 40px rgba(0, 0, 0, 0.1)' : 'none'};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const MobileNavWrapper = styled.div`
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
    z-index: 1000;
    background: ${({ theme }) => theme.colors.ui.background};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const MobileNavHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileLogo = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
  display: block;
`;

const BurgerButton = styled.button`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const MobileDropdownMenu = styled(motion.div)<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  min-width: 280px;
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 16px;
  box-shadow: 0 10px 40px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
  overflow: hidden;
`;

const LogoSection = styled.div<{ $isOpen: boolean }>`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: ${({ $isOpen }) => $isOpen ? 'space-between' : 'center'};
  border-bottom: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  min-height: 70px;
  flex-shrink: 0;
`;

const Logo = styled(motion.img)`
  height: 40px;
  width: auto;
  object-fit: contain;
  display: block;
`;

const MenuToggle = styled(motion.button)`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.brand.primary};
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  padding: 16px 0;
`;

const NavItemWrapper = styled.li`
  position: relative;
  margin: 4px 12px;
`;

const StyledNavLink = styled(PrefetchLink)<{ $isActive: boolean; $isOpen: boolean; $isDisabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: ${({ $isActive, theme, $isDisabled }) => 
    $isDisabled ? theme.colors.text.secondary : 
    $isActive ? theme.colors.brand.primary : theme.colors.text.primary};
  background: ${({ $isActive, theme }) => $isActive ? hexToRgba(theme.colors.brand.primary, 0.1) : 'transparent'};
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;
  opacity: ${({ $isDisabled }) => $isDisabled ? 0.5 : 1};
  cursor: ${({ $isDisabled }) => $isDisabled ? 'not-allowed' : 'pointer'};
  pointer-events: ${({ $isDisabled }) => $isDisabled ? 'none' : 'auto'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, 
      ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)}, 
      ${({ theme }) => hexToRgba(theme.colors.brand.accent, 0.2)}
    );
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  span {
    font-weight: 500;
    white-space: nowrap;
    opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
    transition: opacity 0.2s;
    ${({ $isOpen }) => !$isOpen && 'position: absolute; left: -9999px;'}
  }
`;


const Badge = styled(motion.span)`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${({ theme }) => theme.colors.status.danger};
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
  background: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.text.primaryInverse};
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10000;
  
  &::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const SignOutButton = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  span {
    opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
    transition: opacity 0.2s;
  }
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  }
`;

const BottomSection = styled.div`
  padding: 16px;
  border-top: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.ui.background};
`;

const UserInfo = styled(PrefetchLink)<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $isOpen }) => $isOpen ? 'flex-start' : 'center'};
  gap: 12px;
  padding: ${({ $isOpen }) => $isOpen ? '12px' : '8px'};
  border-radius: 12px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
  margin-bottom: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
    transform: ${({ $isOpen }) => $isOpen ? 'translateX(2px)' : 'none'};
  }
`;

const Avatar = styled.div<{ $isOpen: boolean }>`
  width: ${({ $isOpen }) => $isOpen ? '40px' : '32px'};
  height: ${({ $isOpen }) => $isOpen ? '40px' : '32px'};
  border-radius: 50%;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.accent}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: ${({ $isOpen }) => $isOpen ? '16px' : '14px'};
  flex-shrink: 0;
  margin: ${({ $isOpen }) => $isOpen ? '0' : '0 auto'};
  transition: all 0.3s ease;
`;

const UserDetails = styled.div<{ $isOpen: boolean }>`
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  transition: opacity 0.2s;
  ${({ $isOpen }) => !$isOpen && 'position: absolute; left: -9999px;'}
  
  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const MobileNavLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  padding: 16px 24px;
  text-decoration: none;
  color: ${({ $isActive, theme }) => $isActive ? theme.colors.brand.primary : theme.colors.text.primary};
  background: ${({ $isActive, theme }) => $isActive ? hexToRgba(theme.colors.brand.primary, 0.05) : 'transparent'};
  font-weight: 500;
  font-size: 16px;
  transition: all 0.2s ease;
  border-bottom: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  
  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const MobileUserSection = styled.div`
  padding: 20px 24px;
  border-top: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.02)};
`;

interface ModernNavProps {
  onboardingContext?: {
    currentStep: OnboardingStep;
    isOnboarding: boolean;
    completeStep: (step: OnboardingStep) => void;
  } | null;
}

export const ModernNav: React.FC<ModernNavProps> = ({ onboardingContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Array<{ room_id: string; room_name: string }>>([]);
  const [teacherProfile, setTeacherProfile] = useState<{
    full_name: string | null;
    email: string | null;
  }>({ full_name: null, email: null });
  const [userRoles, setUserRoles] = useState<{
    isSuperAdmin: boolean;
    isSchoolAdmin: boolean;
  }>({ isSuperAdmin: false, isSchoolAdmin: false });
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const currentStep = onboardingContext?.currentStep || 'completed';
  const isOnboarding = onboardingContext?.isOnboarding || false;
  const completeStep = onboardingContext?.completeStep || (() => {});
  
  // Prefetch functions for common navigations
  const prefetchDashboard = async () => {
    // Prefetch optimized dashboard API
    fetch('/api/teacher/dashboard-all').catch(() => {});
  };
  
  const prefetchStudents = async () => {
    // Prefetch students data
    fetch('/api/teacher/students').catch(() => {});
  };
  
  const prefetchRooms = async () => {
    // Prefetch rooms data
    fetch('/api/teacher/rooms').catch(() => {});
  };
  
  const prefetchChatbots = async () => {
    // Prefetch chatbots data
    fetch('/api/teacher/chatbots').catch(() => {});
  };
  
  const prefetchConcerns = async () => {
    // Prefetch concerns data
    fetch('/api/teacher/concerns').catch(() => {});
  };
  
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isMobile && isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isOpen]);
  
  // Always collapse sidebar when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  useEffect(() => {
    // Fetch teacher profile and concerns count
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch teacher profile
        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('full_name, email')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          setTeacherProfile(profile);
        }
        
        // Check user roles
        const [superAdminCheck, schoolAdminCheck] = await Promise.all([
          supabase.rpc('is_super_admin', { p_user_id: user.id }),
          supabase
            .from('school_admins')
            .select('admin_id')
            .eq('user_id', user.id)
            .maybeSingle() // Use maybeSingle to avoid error when no row exists
        ]);
        
        // Only log if there's an actual error (not just no data)
        if (schoolAdminCheck.error && schoolAdminCheck.error.code !== 'PGRST116') {
          console.error('ModernNav - School admin check error:', schoolAdminCheck.error);
        }
        
        setUserRoles({
          isSuperAdmin: !!superAdminCheck.data,
          isSchoolAdmin: !!schoolAdminCheck.data
        });
        
        // Fetch pending concerns count
        const { count: concernsCount } = await supabase
          .from('flagged_messages')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id)
          .eq('status', 'pending');
          
        setConcernsCount(concernsCount || 0);
        
        // Fetch pending content filters count
        // Get teacher's rooms first
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('room_id, room_name')
          .eq('teacher_id', user.id)
          .order('room_name');
          
        if (roomsData) {
          setRooms(roomsData);
        }
          
        if (roomsData && roomsData.length > 0) {
          const roomIds = roomsData.map(r => r.room_id);
          
          // Only count pending messages that need teacher attention
          const { count: filtersCount } = await supabase
            .from('filtered_messages')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
            .eq('status', 'pending');
            
          setContentFiltersCount(filtersCount || 0);
        }
      }
    };
    
    fetchData();
  }, []);
  
  const getInitials = (name: string | null) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  // Dynamic concerns count
  const [concernsCount, setConcernsCount] = useState(0);
  const [contentFiltersCount, setContentFiltersCount] = useState(0);

  // Determine which nav items should be disabled during onboarding
  const isNavItemDisabled = (href: string) => {
    if (!isOnboarding) return false;
    
    // During the initial step, only allow Dashboard access
    if (currentStep === OnboardingStep.NAVIGATE_TO_STUDENTS) {
      return href !== '/teacher-dashboard';
    }
    
    // During add students step, allow Dashboard and Students
    if (currentStep === OnboardingStep.ADD_STUDENTS) {
      return href !== '/teacher-dashboard' && href !== '/teacher-dashboard/students';
    }
    
    // During create room step, allow Dashboard, Students and Rooms
    if (currentStep === OnboardingStep.CREATE_ROOM) {
      return href !== '/teacher-dashboard' && 
             href !== '/teacher-dashboard/students' && 
             href !== '/teacher-dashboard/rooms';
    }
    
    return false;
  };

  return (
    <>
      <NavContainer
        $isOpen={isOpen}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
      <LogoSection $isOpen={isOpen}>
        <AnimatePresence>
          {isOpen && (
            <Logo
              src="/images/skolr_bulb.png"
              alt="Skolr"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        <MenuToggle
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </MenuToggle>
      </LogoSection>
      
      <NavList>
        {/* Admin Section */}
        {(userRoles.isSuperAdmin || userRoles.isSchoolAdmin) && (
          <>
            <NavItemWrapper style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ 
                padding: '8px 16px', 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#985DD7', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.2s'
              }}>
                {userRoles.isSuperAdmin ? 'Super Admin' : 'School Admin'}
              </div>
            </NavItemWrapper>
            
            {userRoles.isSuperAdmin && (
              <NavItemWrapper>
                <StyledNavLink 
                  href="/super-admin" 
                  $isActive={pathname.startsWith('/super-admin')}
                  $isOpen={isOpen}
                  title={!isOpen ? 'Platform Admin' : ''}
                >
                  <FiShield />
                  <span>Platform Admin</span>
                </StyledNavLink>
              </NavItemWrapper>
            )}
            
            {userRoles.isSchoolAdmin && (
              <NavItemWrapper>
                <StyledNavLink 
                  href="/admin" 
                  $isActive={pathname.startsWith('/admin')}
                  $isOpen={isOpen}
                  title={!isOpen ? 'School Admin' : ''}
                >
                  <FiSettings />
                  <span>School Admin</span>
                </StyledNavLink>
              </NavItemWrapper>
            )}
            
            <div style={{ 
              margin: '16px 12px', 
              height: '1px', 
              background: 'rgba(152, 93, 215, 0.1)' 
            }} />
          </>
        )}
        
        {/* Teacher Section */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/teacher-dashboard' && pathname.startsWith(item.href));
          const showBadge = (item.label === 'Concerns' && concernsCount > 0) || 
                           (item.label === 'Content Filters' && contentFiltersCount > 0);
          const badgeCount = item.label === 'Concerns' ? concernsCount : 
                            item.label === 'Content Filters' ? contentFiltersCount : 0;
          const isDisabled = isNavItemDisabled(item.href);
          const shouldHighlight = false; // No nav highlighting during onboarding
          
          // Map prefetch functions to nav items
          let prefetchData: (() => Promise<void>) | undefined;
          switch (item.label) {
            case 'Dashboard':
              prefetchData = prefetchDashboard;
              break;
            case 'Students':
              prefetchData = prefetchStudents;
              break;
            case 'Rooms':
              prefetchData = prefetchRooms;
              break;
            case 'Skolrs':
              prefetchData = prefetchChatbots;
              break;
            case 'Concerns':
              prefetchData = prefetchConcerns;
              break;
          }
          
          return (
            <NavItemWrapper 
              key={item.href}
              onMouseEnter={() => !isOpen && setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <StyledNavLink 
                href={item.href} 
                $isActive={isActive}
                $isOpen={isOpen}
                $isDisabled={isDisabled}
                prefetchData={prefetchData}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {showBadge && isOpen && (
                  <Badge
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    {badgeCount}
                  </Badge>
                )}
              </StyledNavLink>
              
              {!isOpen && hoveredItem === item.label && (
                <AnimatePresence>
                  <Tooltip
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </Tooltip>
                </AnimatePresence>
              )}
            </NavItemWrapper>
          );
        })}
      </NavList>
      
      <BottomSection>
        <UserInfo 
          href="/teacher-dashboard/profile" 
          $isOpen={isOpen}
          title={!isOpen ? 'Profile' : ''}
        >
          <Avatar $isOpen={isOpen}>{getInitials(teacherProfile.full_name)}</Avatar>
          <UserDetails $isOpen={isOpen}>
            <h4>{teacherProfile.full_name || 'Teacher'}</h4>
            <p>{teacherProfile.email || 'Loading...'}</p>
          </UserDetails>
        </UserInfo>
        
        <SignOutButton 
          onClick={handleSignOut}
          $isOpen={isOpen}
          title={!isOpen ? 'Sign Out' : ''}
        >
          <FiLogOut />
          <span>Sign Out</span>
        </SignOutButton>
      </BottomSection>
    </NavContainer>

    {/* Mobile Navigation */}
    <MobileNavWrapper ref={mobileMenuRef}>
      <MobileNavHeader>
        <MobileLogo src="/images/skolr_bulb.png" alt="Skolr" />
        <BurgerButton onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX /> : <FiMenu />}
        </BurgerButton>
      </MobileNavHeader>
      
      <MobileDropdownMenu $isOpen={isOpen}>
        {/* Admin Links for Mobile */}
        {userRoles.isSuperAdmin && (
          <MobileNavLink
            href="/super-admin"
            $isActive={pathname.startsWith('/super-admin')}
            onClick={() => setIsOpen(false)}
            style={{ 
              background: 'linear-gradient(135deg, rgba(152, 93, 215, 0.1), rgba(78, 205, 196, 0.1))',
              fontWeight: '600' 
            }}
          >
            🛡️ Platform Admin
          </MobileNavLink>
        )}
        
        {userRoles.isSchoolAdmin && (
          <MobileNavLink
            href="/admin"
            $isActive={pathname.startsWith('/admin')}
            onClick={() => setIsOpen(false)}
            style={{ 
              background: 'linear-gradient(135deg, rgba(152, 93, 215, 0.1), rgba(78, 205, 196, 0.1))',
              fontWeight: '600' 
            }}
          >
            ⚙️ School Admin
          </MobileNavLink>
        )}
        
        {(userRoles.isSuperAdmin || userRoles.isSchoolAdmin) && (
          <div style={{ 
            height: '1px', 
            background: 'rgba(152, 93, 215, 0.2)',
            margin: '8px 0'
          }} />
        )}
        
        {/* Teacher Links */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/teacher-dashboard' && pathname.startsWith(item.href));
          
          return (
            <MobileNavLink
              key={item.href}
              href={item.href}
              $isActive={isActive}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </MobileNavLink>
          );
        })}
        
        <MobileUserSection>
          <UserInfo href="/teacher-dashboard/profile" $isOpen={true} style={{ marginBottom: '12px' }}>
            <Avatar $isOpen={true}>{getInitials(teacherProfile.full_name)}</Avatar>
            <UserDetails $isOpen={true}>
              <h4>{teacherProfile.full_name || 'Teacher'}</h4>
              <p>{teacherProfile.email || 'Loading...'}</p>
            </UserDetails>
          </UserInfo>
          
          <SignOutButton 
            onClick={handleSignOut}
            $isOpen={true}
            style={{ justifyContent: 'center' }}
          >
            <FiLogOut />
            <span>Sign Out</span>
          </SignOutButton>
        </MobileUserSection>
      </MobileDropdownMenu>
    </MobileNavWrapper>

    </>
  );
};