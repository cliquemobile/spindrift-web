import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spindrift',
  description: 'Share and discover Rocket League clips',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#111', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
