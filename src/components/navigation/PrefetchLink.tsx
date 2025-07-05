import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/lib/react-query/client';

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  prefetchData?: () => Promise<void>;
  prefetchDelay?: number; // Delay before prefetching (default: 100ms)
}

export function PrefetchLink({ 
  children, 
  prefetchData,
  prefetchDelay = 100,
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    // Prefetch the route
    if (typeof props.href === 'string') {
      router.prefetch(props.href);
    }

    // Prefetch data after a short delay
    if (prefetchData && !prefetchedRef.current) {
      timeoutRef.current = setTimeout(() => {
        prefetchData();
        prefetchedRef.current = true;
      }, prefetchDelay);
    }
  };

  const handleMouseLeave = () => {
    // Cancel prefetch if user moves away quickly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Link 
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}