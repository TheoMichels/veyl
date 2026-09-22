import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Settings, Radar } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Veyl | Synthèse Tech & IA',
  description: 'Ton assistant de veille technologique intelligent',
  manifest: '/manifest.json', // PWA support later
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 min-h-screen flex flex-col transition-colors`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-10 transition-colors">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 font-black text-2xl tracking-tighter">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                  <Radar className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Veyl
                </span>
              </Link>
              <nav className="flex items-center gap-2">
                <ThemeToggle />
                <Link 
                  href="/settings" 
                  className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                  title="Paramètres"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
