import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { siteConfig } from '@/config/site';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { title: siteConfig.name, description: siteConfig.description, siteName: siteConfig.name, type: 'website' },
  twitter: { card: 'summary_large_image', title: siteConfig.name, description: siteConfig.description },
  alternates: { canonical: '/' },
};
export const viewport: Viewport = { themeColor: '#07070a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<Analytics /></body></html>;
}
