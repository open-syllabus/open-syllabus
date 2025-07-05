
import { render, screen, act } from '@testing-library/react';
import Page from './page';
import TerminalText from '@/components/shared/TerminalText';
import RotatingSubtitle from '@/components/shared/RotatingSubtitle';
import { MockProviders } from '@/lib/test-utils';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  }),
}));

// Mock the animated components directly
vi.mock('@/components/shared/TerminalText', () => ({
  __esModule: true,
  default: () => <span>Engaging Skolr Mode...</span>,
}));

vi.mock('@/components/shared/RotatingSubtitle', () => ({
  __esModule: true,
  default: () => <span>downloading confidence</span>,
}));

// Use fake timers to control animations
vi.useFakeTimers();

describe('Page', () => {
  it('renders the main heading after animations', () => {
    render(
      <MockProviders>
        <Page />
      </MockProviders>
    );

    // Fast-forward only pending timers to avoid infinite loops from setInterval
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Now that animations are complete, the heading should be present
    const heading = screen.getByRole('heading', { level: 1, name: /Engaging Skolr Mode.../i });
    expect(heading).toBeInTheDocument();
  });
});
