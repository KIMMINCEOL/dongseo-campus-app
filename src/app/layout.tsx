import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '동서대학교 통합 캠퍼스',
  description: '공지사항, 학사일정, 학식메뉴를 한눈에 확인하는 동서대 포털 어플',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '동서대 캠퍼스',
  },
};

export const viewport: Viewport = {
  themeColor: '#9e1b32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="mobile-container relative pb-20">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
