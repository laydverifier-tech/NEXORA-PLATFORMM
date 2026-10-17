'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type TrackType = 'page_view' | 'tournament_view' | 'giveaway_view' | 'media_view' | 'sponsor_click' | 'registration_start';
export function track(type: TrackType, path: string, refId?: string) {
  if (typeof navigator === 'undefined' || navigator.doNotTrack === '1') return; // privacy-conscious
  const body = JSON.stringify({ type, path, ref: refId });
  if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) void fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
}
export function PageViewTracker() {
  const path = usePathname();
  useEffect(() => { track('page_view', path); }, [path]);
  return null;
}
export function TrackOnMount({ type, refId }: { type: TrackType; refId: string }) {
  const path = usePathname();
  useEffect(() => { track(type, path, refId); }, [type, refId, path]);
  return null;
}
