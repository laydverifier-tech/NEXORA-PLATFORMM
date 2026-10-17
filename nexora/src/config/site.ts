export const siteConfig = {
  name: 'NEXORA',
  tagline: 'BEYOND COMPETITION.',
  hashtag: '#GONEXORA',
  description: 'NEXORA is a premium esports organization: tournaments, roster, media and community.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

export const mainNav = [
  { label: 'HOME', href: '/' },
  { label: 'TOURNAMENTS', href: '/tournaments' },
  { label: 'ROSTER', href: '/roster' },
  { label: 'MEDIA', href: '/media' },
  { label: 'GIVEAWAYS', href: '/giveaways' },
  { label: 'PARTNERS', href: '/partners' },
  { label: 'ABOUT', href: '/about' },
] as const;
