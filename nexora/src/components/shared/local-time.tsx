'use client';
import { useEffect, useState } from 'react';
import { formatUtc } from '@/lib/utils/format';

/** SSR renders UTC (deterministic); after hydration it switches to the viewer's local timezone. */
export function LocalTime({ iso, withTime = true }: { iso: string | null | undefined; withTime?: boolean }) {
  const [txt, setTxt] = useState(() => formatUtc(iso, withTime));
  useEffect(() => {
    if (!iso) return;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    setTxt(new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' } : {}) }).format(d));
  }, [iso, withTime]);
  return <time dateTime={iso ?? undefined}>{txt}</time>;
}
