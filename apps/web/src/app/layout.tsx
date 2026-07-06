import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نظام المحاسبة المتكامل',
  description: 'ERP System - برنامج حسابات متكامل',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
