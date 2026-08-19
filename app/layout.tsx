import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Regulation 26 — Curriculum & Syllabus Management System',
  description: 'Institutional Academic Management Web Application for Rajalakshmi Engineering College',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
