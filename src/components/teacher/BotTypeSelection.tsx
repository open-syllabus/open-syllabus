'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiBook, FiClipboard, FiEye, FiStar, FiBookOpen } from 'react-icons/fi';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const TypeCard = styled(motion.div)<{ $color: string }>`
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $color }) => $color};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: ${({ $color }) => $color};
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 28px;

  svg {
    width: 32px;
    height: 32px;
  }
`;

const TypeName = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const TypeDescription = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.6;
  margin: 0 0 16px 0;
`;

const Features = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.75rem;
  color: #6B7280;

  li {
    padding: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '✓';
      color: #10B981;
      font-weight: 700;
    }
  }
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
  text-align: center;
`;

interface SkolrTypeSelectionProps {
  roomId: string;
}

const skolrTypes = [
  {
    id: 'learning',
    name: 'Learning Skolr',
    icon: <FiStar />,
    color: '#7C3AED',
    description: 'AI tutor that helps students learn and understand concepts',
    features: [
      'Personalized teaching style',
      'Knowledge base support',
      'Interactive Q&A'
    ]
  },
  {
    id: 'assessment',
    name: 'Assessment Skolr',
    icon: <FiClipboard />,
    color: '#EC4899',
    description: 'Creates quizzes and evaluates student understanding',
    features: [
      'Auto-generated quizzes',
      'Progress tracking',
      'Detailed feedback'
    ]
  },
  {
    id: 'reading_room',
    name: 'Reading Room',
    icon: <FiBook />,
    color: '#3B82F6',
    description: 'Interactive document study assistant',
    features: [
      'Document analysis',
      'Reading comprehension',
      'Note-taking support'
    ]
  },
  {
    id: 'viewing_room',
    name: 'Viewing Room',
    icon: <FiEye />,
    color: '#10B981',
    description: 'Video-based learning companion',
    features: [
      'Video discussions',
      'Visual learning',
      'Interactive Q&A'
    ]
  },
  {
    id: 'knowledge_book',
    name: 'Knowledge Book',
    icon: <FiBookOpen />,
    color: '#F59E0B',
    description: 'Smart reference assistant for instant answers',
    features: [
      'Instant answers',
      'Source citations',
      'Research support'
    ]
  }
];

export default function SkolrTypeSelection({ roomId }: SkolrTypeSelectionProps) {
  const router = useRouter();

  const handleTypeSelect = (typeId: string) => {
    // Navigate to create bot wizard with room pre-selected and skip room/student steps
    router.push(`/teacher-dashboard/create-bot?roomId=${roomId}&type=${typeId}`);
  };

  return (
    <>
      <EmptyStateTitle>Choose a Skolr type to add to this room</EmptyStateTitle>
      <Container>
        {skolrTypes.map((type, index) => (
          <TypeCard
            key={type.id}
            $color={type.color}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTypeSelect(type.id)}
          >
            <IconWrapper $color={type.color}>
              {type.icon}
            </IconWrapper>
            <TypeName>{type.name}</TypeName>
            <TypeDescription>{type.description}</TypeDescription>
            <Features>
              {type.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </Features>
          </TypeCard>
        ))}
      </Container>
    </>
  );
}