// app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SWRConfig } from 'swr';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'UkToEast',
  description: 'Global package forwarding and personal shopping service.',
  // Add other metadata properties as needed
};

export const viewport: Viewport = {
  maximumScale: 1,
};

// Use system fonts instead of Google Fonts for build reliability
const fontClass = 'font-sans'; // This will use the Tailwind default font stack

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`bg-white dark:bg-gray-950 text-black dark:text-white ${fontClass}`}>
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            errorRetryCount: 2,
            errorRetryInterval: 1000,
            revalidateOnFocus: false,
          }}
        >
          <Toaster position="top-right" richColors />
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}