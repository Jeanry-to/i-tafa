import type { Metadata } from 'next';
import './globals.css';
import ChatWidget from '../components/chat/ChatWidget';
import { ThemeInitializer } from '@/components/theme-initializer';
import { LanguageProvider } from '@/lib/i18n/language-context';

export const metadata: Metadata = {
  title: 'Gestion des Clients',
  description: 'Application de gestion clients',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeInitializer />
          {children}
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
