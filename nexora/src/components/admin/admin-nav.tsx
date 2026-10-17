'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const NAV = [['DASHBOARD', '/admin/dashboard'], ['TOURNAMENTS', '/admin/tournaments'], ['REGISTRATIONS', '/admin/registrations'], ['ROOMS', '/admin/rooms'], ['RESULTS', '/admin/results'], ['ROSTER', '/admin/roster'], ['NEWS', '/admin/news'], ['GIVEAWAYS', '/admin/giveaways'], ['MEDIA', '/admin/media'], ['PARTNERS', '/admin/partners'], ['HALL OF FAME', '/admin/hall-of-fame'], ['MESSAGES', '/admin/messages'], ['USERS', '/admin/users'], ['SETTINGS', '/admin/settings'], ['SECURITY', '/admin/security']] as const;
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {NAV.map(([label, href]) => {
        const on = path === href || path.startsWith(href + '/');
        return <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={cn('whitespace-nowrap border-l-2 px-3 py-2 text-[11px] font-bold tracking-wider2 transition-colors', on ? 'border-gold bg-white/5 text-gold' : 'border-transparent text-steel-light hover:text-white')}>{label}</Link>;
      })}
    </nav>
  );
}
