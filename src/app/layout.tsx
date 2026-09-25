import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/app-layout';

export const metadata: Metadata = {
  title: 'ExamPortal - Randomized Online Assessment Platform',
  description:
    'Enterprise-grade randomized online assessment platform with secure question import, dynamic distribution, server-side evaluation, and comprehensive administrative analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
