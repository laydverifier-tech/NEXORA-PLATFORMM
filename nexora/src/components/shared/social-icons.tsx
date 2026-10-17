import { isSafeHttpsUrl } from '@/lib/utils/format';
import type { SiteSettings } from '@/types/content';

const PATHS: Record<string, string> = {
  instagram: 'M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.8a1.4 1.4 0 100 2.9 1.4 1.4 0 000-2.9z',
  tiktok: 'M12.5 0h3.4c.2 1.9 1.3 4 3.9 4.4v3.5c-1.5 0-2.9-.5-3.9-1.2v8.3c0 4.200-3.200 6.800-6.700 6.300-2.700-.4-5-2.700-4.800-5.800.2-3.400 3.300-5.500 6.400-4.900v3.600c-1.600-.5-3 .5-3 2 0 1.300 1.100 2.100 2.200 2 1.200-.1 2-1 2-2.200V0z',
  youtube: 'M23.500 6.200a3 3 0 00-2.100-2.100C19.500 3.600 12 3.600 12 3.600s-7.500 0-9.400.5A3 3 0 00.5 6.200C0 8.100 0 12 0 12s0 3.900.5 5.800a3 3 0 002.100 2.100c1.900.5 9.400.5 9.400.5s7.500 0 9.400-.5a3 3 0 002.100-2.100c.5-1.900.5-5.800.5-5.800s0-3.900-.5-5.800zM9.600 15.600V8.400l6.200 3.600-6.200 3.600z',
  twitch: 'M11.600 4.700h1.800v5.400h-1.800V4.700zm5 0h1.800v5.400h-1.800V4.700zM6 0L1.700 4.300v15.400h5.200V24l4.300-4.300h3.500L22.300 12.600V0H6zm14.600 11.700l-3.500 3.500h-3.500l-3 3v-3H6.900V1.700h13.700v10z',
  x: 'M18.200 2.300h3.300l-7.200 8.300 8.500 11.200h-6.700l-5.200-6.800-6 6.800H1.600l7.700-8.800L1.200 2.300H8l4.700 6.200 5.500-6.200zm-1.200 17.500h1.800L7.100 4.100H5.100L17 19.800z',
  discord: 'M20.300 4.400A19.800 19.800 0 0015.400 3a14 14 0 00-.6 1.300 18.400 18.400 0 00-5.500 0A13 13 0 008.700 3a19.700 19.700 0 00-4.900 1.500C.700 9.100-.100 13.600.300 18.100a19.900 19.900 0 006 3 14.800 14.800 0 001.300-2.100 12.900 12.900 0 01-2-1l.5-.4a14.200 14.200 0 0012.200 0l.5.400c-.6.400-1.300.7-2 1a14.700 14.700 0 001.300 2.100 19.900 19.900 0 006-3c.5-5.200-.8-9.700-3.100-13.700zM8 15.400c-1.200 0-2.100-1.100-2.100-2.400S6.800 10.600 8 10.600s2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400zm8 0c-1.200 0-2.100-1.100-2.100-2.400s.9-2.400 2.100-2.400 2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400z',
};
const LABEL: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', twitch: 'Twitch', x: 'X', discord: 'Discord' };
const KEYS = ['instagram', 'tiktok', 'youtube', 'twitch', 'x', 'discord'] as const;

/** Renders only the networks the admin configured (https URLs only). */
export function SocialIcons({ social, size = 20, className = '' }: { social: SiteSettings['social']; size?: number; className?: string }) {
  const items = KEYS.map((k) => ({ k, url: (social as Record<string, string | null | undefined>)[`${k}_url`] })).filter((i) => isSafeHttpsUrl(i.url));
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-3 ${className}`} aria-label="Social networks">
      {items.map(({ k, url }) => (
        <li key={k}>
          <a href={url as string} target="_blank" rel="noopener noreferrer" aria-label={`${LABEL[k]} (opens in a new tab)`} className="flex h-10 w-10 items-center justify-center border border-white/20 text-steel-light transition-colors hover:border-gold hover:text-gold">
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={PATHS[k]} /></svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
