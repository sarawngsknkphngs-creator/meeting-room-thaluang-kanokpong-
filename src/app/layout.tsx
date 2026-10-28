import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: 'ระบบจองห้องประชุม (Meeting Room Booking System)',
  description: 'ระบบจองห้องประชุมระดับองค์กร พร้อมตรวจสอบห้องว่างและปฏิทินแบบเรียลไทม์',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
