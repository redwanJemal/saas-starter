import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SWRConfig } from 'swr';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Package Forwarding Platform',
  description: 'Global package forwarding and personal shopping service.',
  // ... other metadata
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({
  subsets: ['latin']
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}>
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig value={{
          errorRetryCount: 2,
          errorRetryInterval: 1000,
          revalidateOnFocus: false,
        }}>
          <Toaster position="top-right" richColors />
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}