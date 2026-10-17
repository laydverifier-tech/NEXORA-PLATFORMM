import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { name: 'NEXORA', short_name: 'NEXORA', description: 'NEXORA esports: tournaments, roster, media and community.', start_url: '/', display: 'standalone', background_color: '#07070a', theme_color: '#07070a',
    icons: [{ src: '/icon.png', sizes: 'any', type: 'image/png' }, { src: '/apple-icon.png', sizes: 'any', type: 'image/png', purpose: 'maskable' }] };
}
