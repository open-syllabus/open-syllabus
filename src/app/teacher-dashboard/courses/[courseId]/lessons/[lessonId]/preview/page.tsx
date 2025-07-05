'use client';

import React from 'react';
import LessonPreview from '@/components/teacher/LessonPreview';
import { PageWrapper } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';

export default function TeacherLessonPreviewPage() {
  return (
    <PageWrapper gradient>
      <PageTransition>
        <LessonPreview />
      </PageTransition>
    </PageWrapper>
  );
}