import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
export function pageMeta(title: string, description: string, path: string, extra?: Partial<Metadata>): Metadata {
  return {
    title, description, alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: siteConfig.name, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    ...extra,
  };
}
