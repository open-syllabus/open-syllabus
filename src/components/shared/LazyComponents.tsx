import dynamic from 'next/dynamic';
import LightbulbLoader from './LightbulbLoader';

// Lazy load heavy components with the lightbulb loader
export const LazyChat = dynamic(() => import('./Chat'), {
  loading: () => <LightbulbLoader />,
  ssr: false // Chat is client-only
});

export const LazyStudentCsvUpload = dynamic(
  () => import('../teacher/StudentCsvUpload'),
  {
    loading: () => <LightbulbLoader />,
    ssr: false // File upload is client-only
  }
);

export const LazyVideoPlayer = dynamic(
  () => import('./VideoPlayerWithTracking').then(mod => ({ default: mod.VideoPlayerWithTracking })),
  {
    loading: () => <LightbulbLoader />,
    ssr: false
  }
);

export const LazyPDFViewer = dynamic(
  () => import('./SimplePDFViewer'),
  {
    loading: () => <LightbulbLoader />,
    ssr: false
  }
);

export const LazyRoomEngagementChart = dynamic(
  () => import('../teacher/RoomEngagementChart').then(mod => ({ default: mod.RoomEngagementChart })),
  {
    loading: () => <LightbulbLoader />,
    ssr: false
  }
);

export const LazyAnimatedBackground = dynamic(
  () => import('./AnimatedBackground').then(mod => ({ default: mod.AnimatedBackground })),
  {
    loading: () => null, // No loader for background
    ssr: false
  }
);

export const LazyTeacherNerveCenter = dynamic(
  () => import('../teacher/TeacherNerveCenter').then(mod => ({ default: mod.TeacherNerveCenter })),
  {
    loading: () => <LightbulbLoader />,
    ssr: false
  }
);

export const LazyReadingDocumentViewer = dynamic(
  () => import('./ReadingDocumentViewer'),
  {
    loading: () => <LightbulbLoader />,
    ssr: false
  }
);

export const LazyKnowledgeBookSidebar = dynamic(
  () => import('../teacher/KnowledgeBookSidebar'),
  {
    loading: () => null,
    ssr: false
  }
);