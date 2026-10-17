import Link from 'next/link';
import { mainNav, siteConfig } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { SocialIcons } from '@/components/shared/social-icons';
import { getSettings } from '@/services/content';

export async function Footer() {
  const { social } = await getSettings();
  return (
    <footer className="border-t border-white/10 bg-ink-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
        <div className="space-y-4">
          <Logo size={44} />
          <p className="text-xs tracking-wider2 text-steel">{siteConfig.tagline} · {siteConfig.hashtag}</p>
          <SocialIcons social={social} />
          <p className="text-xs text-steel">{social.tournament_handle ?? '@nexora_tour'} · {social.gaming_handle ?? '@nexora_gaming.ofc'}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-[11px] font-bold tracking-wider2 text-steel-light">
          {mainNav.map((n) => <Link key={n.href} href={n.href} className="hover:text-gold">{n.label}</Link>)}
          <Link href="/news" className="hover:text-gold">NEWS</Link>
          <Link href="/media-kit" className="hover:text-gold">MEDIA KIT</Link>
          <Link href="/contact" className="hover:text-gold">CONTACT</Link>
        </nav>
        <p className="text-xs text-steel md:text-right">© {new Date().getFullYear()} NEXORA. All rights reserved.</p>
      </div>
    </footer>
  );
}
