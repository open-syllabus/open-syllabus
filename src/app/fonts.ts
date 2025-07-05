import { Inter, Orbitron, Oxanium, Lexend } from 'next/font/google';

// Optimize font loading - only load essential weights initially
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '600'], // Reduced from 4 weights to 2
  preload: true,
});

export const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: ['600', '700'], // Reduced from 6 weights to 2
  preload: false, // Don't preload secondary fonts
});

export const oxanium = Oxanium({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oxanium',
  weight: ['600'], // Reduced from 5 weights to 1
  preload: false,
});

export const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
  weight: ['400', '500'], // Reduced from 6 weights to 2
  preload: false,
});