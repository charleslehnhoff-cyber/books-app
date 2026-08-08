import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-primary",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-secondary",
});

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "Just BOOKS",
  description: "The world-class digital e-reader and library. Read, organize, and immerse yourself in your favorite books.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BOOKS"
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png'
  },
  metadataBase: new URL('https://books.sphaerus.net'),
  openGraph: {
    title: 'Just BOOKS',
    description: 'The world-class digital e-reader and library platform.',
    url: 'https://books.sphaerus.net',
    siteName: 'Just BOOKS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Just BOOKS Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Just BOOKS',
    description: 'The world-class digital e-reader and library platform.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${poppins.variable} ${openSans.variable}`}>{children}</body>
    </html>
  );
}
