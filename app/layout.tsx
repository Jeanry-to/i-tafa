import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}