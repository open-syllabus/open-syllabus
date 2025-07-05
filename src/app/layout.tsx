// src/app/layout.tsx
import { Metadata, Viewport } from 'next';
import ProvidersWithQuery from './providers-with-query';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/utils/constants';
import { inter, orbitron, oxanium, lexend } from './fonts';

// Initialize server-side features (runs once on server start)
import '@/lib/server-init';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: '/images/lightbulb.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/lightbulb.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/lightbulb.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${oxanium.variable} ${lexend.variable}`}>
      <body className={inter.className}>
        <ProvidersWithQuery>
          <ConditionalHeader />
          {children}
        </ProvidersWithQuery>
      </body>
    </html>
  );
}
