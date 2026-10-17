import { describe, it, expect } from 'vitest';
import { euro, formatUtc, hasRealStart, initials, isSafeHttpsUrl, paragraphs, toUiStatus } from '../src/lib/utils/format';

describe('format utils', () => {
  it('maps tournament statuses', () => { expect(toUiStatus('LIVE')).toBe('LIVE'); expect(toUiStatus('FINISHED')).toBe('COMPLETED'); expect(toUiStatus('REGISTRATION_OPEN')).toBe('UPCOMING'); });
  it('formats euros without inventing decimals', () => { expect(euro(50)).toBe('€50'); expect(euro(2.5)).toBe('€2.50'); expect(euro(null)).toBe('—'); });
  it('formats UTC deterministically', () => { expect(formatUtc('2026-11-01T23:59:00Z')).toBe('01 Nov 2026, 23:59 UTC'); expect(formatUtc(null)).toBe('—'); expect(formatUtc('nope')).toBe('—'); });
  it('only accepts https urls', () => { expect(isSafeHttpsUrl('https://a.com')).toBe(true); for (const u of ['http://a.com', 'javascript:alert(1)', 'data:text/html,x', '', null, 5]) expect(isSafeHttpsUrl(u)).toBe(false); });
  it('detects placeholder start dates', () => { expect(hasRealStart({ tournament_start: '2026-11-01T23:59:00Z', registration_end: '2026-11-01T23:59:00Z' })).toBe(false); expect(hasRealStart({ tournament_start: '2026-11-05T18:00:00Z', registration_end: '2026-11-01T23:59:00Z' })).toBe(true); });
  it('builds initials and paragraphs', () => { expect(initials('Nex.CREED')).toBe('CR'); expect(paragraphs('a\n\n\nb\n\n')).toEqual(['a', 'b']); });
});

describe('registration state', () => {
  it('treats a stale OPEN tournament (deadline passed) as closed', async () => {
    const { isRegistrationOpen } = await import('../src/lib/utils/format');
    expect(isRegistrationOpen({ status: 'REGISTRATION_OPEN', registration_end: '2020-01-01T00:00:00Z' })).toBe(false);
    expect(isRegistrationOpen({ status: 'REGISTRATION_OPEN', registration_end: '2999-01-01T00:00:00Z' })).toBe(true);
    expect(isRegistrationOpen({ status: 'REGISTRATION_CLOSED', registration_end: '2999-01-01T00:00:00Z' })).toBe(false);
  });
});

import { sniffImage, safeFilename, MAX_IMAGE_BYTES } from '../src/lib/admin/upload';
import { parseStats, tournamentSchema, rosterSchema, settingsSchema, statValue } from '../src/lib/validation/admin';
describe('upload hardening', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const webp = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([1, 2, 3, 4], [...'WEBP'].map((c) => c.charCodeAt(0)), [0]));
  it('detects real images by magic bytes', () => { expect(sniffImage(png)?.ext).toBe('png'); expect(sniffImage(jpg)?.mime).toBe('image/jpeg'); expect(sniffImage(webp)?.ext).toBe('webp'); });
  it('rejects scripts/html/svg/exe disguised as images', () => {
    const enc = (s: string) => new TextEncoder().encode(s.padEnd(20, ' '));
    for (const s of ['<script>alert(1)</script>', '<svg onload=alert(1)>', '<?php system($_GET)', 'MZ\x90\x00\x03', '#!/bin/sh']) expect(sniffImage(enc(s))).toBeNull();
    expect(sniffImage(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
  it('builds safe filenames (no traversal, no weird chars)', () => { expect(safeFilename('../../etc/PASSWD x', 'png', 'ab12')).toBe('etc-passwd-x-ab12.png'); expect(safeFilename('', 'jpg', 'zz')).toBe('file-zz.jpg'); expect(MAX_IMAGE_BYTES).toBe(4194304); });
});
describe('admin validation', () => {
  const base = { name: 'Mini Tour', slug: 'mini-tour', game: 'Free Fire', prize_pool: '50', entry_fee: '2', vip_fee: '3', max_teams: '24', rounds: '12', status: 'REGISTRATION_OPEN', banner_url: '', registration_start: '2026-10-01T10:00', registration_end: '2026-11-01T23:59', tournament_start: '2026-11-02T18:00', tournament_end: '' };
  it('accepts a valid tournament and converts dates to UTC', () => { const r = tournamentSchema.parse(base); expect(r.registration_end).toBe('2026-11-01T23:59:00Z'); expect(r.vip_fee).toBe(3); expect(r.tournament_end).toBeNull(); });
  it('rejects bad tournaments', () => {
    expect(tournamentSchema.safeParse({ ...base, slug: 'Bad Slug!' }).success).toBe(false);
    expect(tournamentSchema.safeParse({ ...base, status: 'HACKED' }).success).toBe(false);
    expect(tournamentSchema.safeParse({ ...base, prize_pool: '-5' }).success).toBe(false);
    expect(tournamentSchema.safeParse({ ...base, registration_end: '2026-09-01T00:00' }).success).toBe(false);
    expect(tournamentSchema.safeParse({ ...base, banner_url: 'javascript:alert(1)' }).success).toBe(false);
  });
  it('roster: only https socials, parses stats', () => {
    expect(rosterSchema.safeParse({ nickname: 'Nex.X', slug: 'x1', instagram: 'http://x.com' }).success).toBe(false);
    expect(rosterSchema.parse({ nickname: 'Nex.X', slug: 'x1', instagram: 'https://instagram.com/x', is_active: 'on' }).is_active).toBe(true);
    expect(parseStats('Kills: 120\nbad key!: 1\nK/D: 3.2')).toEqual({ kills: '120' });
  });
  it('settings: urls must be https, hrefs relative or https', () => {
    const ok = { site_name: 'NEXORA', hero_title: 'NEXORA', cta1_href: '/about', cta2_href: 'https://x.com' };
    expect(settingsSchema.safeParse(ok).success).toBe(true);
    expect(settingsSchema.safeParse({ ...ok, cta1_href: 'javascript:alert(1)' }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...ok, instagram_url: 'ftp://x' }).success).toBe(false);
    expect(statValue('1200')).toBe(1200); expect(statValue('12K')).toBe('12K'); expect(statValue(null)).toBeNull();
  });
});
