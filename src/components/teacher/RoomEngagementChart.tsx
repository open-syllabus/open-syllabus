// Room engagement visualization component
import React from 'react';
import styled, { css } from 'styled-components';
import { FiUsers, FiActivity, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
interface RoomEngagement {
  room_id: string;
  room_name: string;
  totalStudents: number;
  activeStudents: number;
  engagementRate: number;
}

interface RoomEngagementChartProps {
  data?: RoomEngagement[];
  loading?: boolean;
}

const Container = styled.div`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 12px;
    gap: 12px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 12px;
    gap: 12px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const RoomList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 8px;
  }
`;

const RoomCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 12px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 12px;
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
`;

const RoomName = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EngagementBadge = styled.div<{ $rate: number }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${({ $rate, theme }) => 
    $rate >= 70 ? hexToRgba(theme.colors.brand.accent, 0.15) : 
    $rate >= 40 ? hexToRgba(theme.colors.brand.magenta, 0.15) : 
    hexToRgba(theme.colors.brand.coral, 0.15)
  };
  color: ${({ $rate, theme }) => 
    $rate >= 70 ? theme.colors.brand.accent : 
    $rate >= 40 ? theme.colors.brand.magenta : 
    theme.colors.brand.coral
  };
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  strong {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 3px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled(motion.div)<{ $rate: number }>`
  height: 100%;
  background: ${({ $rate, theme }) => 
    $rate >= 70 ? `linear-gradient(90deg, ${theme.colors.brand.accent}, ${theme.colors.brand.primary})` : 
    $rate >= 40 ? `linear-gradient(90deg, ${theme.colors.brand.magenta}, ${theme.colors.brand.primary})` : 
    `linear-gradient(90deg, ${theme.colors.brand.coral}, ${theme.colors.brand.magenta})`
  };
  border-radius: 3px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const ViewAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.brand.primary};
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.magenta};
    transform: translateX(2px);
  }
`;

export const RoomEngagementChart: React.FC<RoomEngagementChartProps> = ({ 
  data = [], 
  loading = false 
}) => {
  if (loading) {
    return (
      <Container>
        <EmptyState>
          <FiActivity />
          <p>Loading engagement data...</p>
        </EmptyState>
      </Container>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <Container>
      <div>
        <Header>
          <Title>
            <FiActivity />
            Room Engagement
          </Title>
          {hasData && (
            <ViewAllLink href="/teacher-dashboard/rooms">
              View all rooms →
            </ViewAllLink>
          )}
        </Header>
        <Subtitle>Student activity in the last 7 days</Subtitle>
      </div>
      
      {hasData ? (
        <RoomList>
          {data.map((room, index) => (
            <RoomCard
              key={room.room_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RoomHeader>
                <RoomName>{room.room_name}</RoomName>
                <EngagementBadge $rate={room.engagementRate}>
                  {room.engagementRate >= 70 ? <FiTrendingUp /> : <FiTrendingDown />}
                  {room.engagementRate}%
                </EngagementBadge>
              </RoomHeader>
              
              <StatsRow>
                <StatItem>
                  <FiUsers />
                  <strong>{room.activeStudents}</strong>
                  <span>/ {room.totalStudents} students</span>
                </StatItem>
                <ProgressBar>
                  <ProgressFill
                    $rate={room.engagementRate}
                    initial={{ width: 0 }}
                    animate={{ width: `${room.engagementRate}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  />
                </ProgressBar>
              </StatsRow>
            </RoomCard>
          ))}
        </RoomList>
      ) : (
        <EmptyState>
          <FiUsers />
          <p>No room activity data available</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Students need to be active in rooms to see engagement metrics
          </p>
        </EmptyState>
      )}
    </Container>
  );
};