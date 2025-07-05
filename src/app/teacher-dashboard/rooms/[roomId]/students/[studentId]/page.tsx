// src/app/teacher-dashboard/rooms/[roomId]/students/[studentId]/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function StudentProfileRedirect() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  useEffect(() => {
    // Redirect to the main student profile page
    if (studentId) {
      router.replace(`/teacher-dashboard/students/${studentId}`);
    }
  }, [studentId, router]);

  // Show loading while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px',
      gap: '16px'
    }}>
      <LoadingSpinner size="large" />
      <p style={{ color: '#6B7280' }}>Redirecting to student profile...</p>
    </div>
  );
}