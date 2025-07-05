'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load Header with no SSR to prevent hydration mismatches
const Header = dynamic(() => import('./Header'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '60px', 
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff'
    }} />
  )
});

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on teacher dashboard or any student pages
  // These pages have their own navigation
  const shouldHideHeader = pathname.startsWith('/teacher-dashboard') || pathname.startsWith('/student/');
  
  if (shouldHideHeader) {
    return null;
  }
  
  return <Header />;
}