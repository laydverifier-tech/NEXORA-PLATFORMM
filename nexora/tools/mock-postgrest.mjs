// Tiny PostgREST stand-in for LOCAL TESTING ONLY (sandbox cannot reach supabase.co). Mode: full | empty
import http from 'node:http';
import fs from 'node:fs';
const mode = process.argv[2] ?? 'full', port = Number(process.argv[3] ?? 54321);
const now = Date.now(), iso = (ms) => new Date(now + ms).toISOString();
const T = {
  tournaments: [{ id: 't1', name: 'NEXORA MINI TOUR', slug: 'nexora-mini-tour', game: 'Free Fire', format_type: 'SQUAD', description: 'Weekly series. 24 squads.', rules: 'GROUP STAGE (Monday): 24 squads.\nLAST CHANCE (Tuesday): 12 squads.\nEntry fee: Normal €2 / VIP €3.', banner_url: null, prize_pool: 50, entry_fee: 2, max_teams: 24, region: null, rounds: 12, registration_start: iso(-864e5), registration_end: iso(5 * 864e5), tournament_start: iso(5 * 864e5), tournament_end: null, status: 'REGISTRATION_OPEN', bracket_format: 'X' },
    { id: 't3', name: 'NEXORA TEST ', slug: 'nexora-test-stale', game: 'FREE FIRE', format_type: 'SQUAD', description: null, rules: null, banner_url: null, prize_pool: 1000, entry_fee: 10, max_teams: 144, region: null, rounds: 1, registration_start: iso(-40 * 864e5), registration_end: iso(-20 * 864e5), tournament_start: iso(-15 * 864e5), tournament_end: null, status: 'REGISTRATION_OPEN', bracket_format: 'X' },
    { id: 't2', name: 'Past Cup', slug: 'past-cup', game: 'Free Fire', format_type: 'SQUAD', description: null, rules: null, banner_url: null, prize_pool: 100, entry_fee: 4, max_teams: 16, region: 'EU', rounds: 6, registration_start: iso(-30 * 864e5), registration_end: iso(-20 * 864e5), tournament_start: iso(-10 * 864e5), tournament_end: null, status: 'FINISHED', bracket_format: 'X' }],
  prizes: [{ id: 'p1', tournament_id: 't1', placement: 1, amount: 20, description: 'Top 1' }, { id: 'p2', tournament_id: 't1', placement: 2, amount: 15, description: 'Top 2' }, { id: 'p3', tournament_id: 't1', placement: 3, amount: 10, description: 'Top 3' }, { id: 'p4', tournament_id: 't1', placement: 0, amount: 5, description: 'MVP' }],
  matches: [{ id: 'm1', tournament_id: 't1', round: 1, match_number: 1, scheduled_at: iso(2 * 864e5), status: 'SCHEDULED', stream_url: 'https://twitch.tv/nexora', map_name: 'Bermuda', notes: null }],
  roster_members: [['adam-x', 'Nex.ADAM.X', null], ['creed', 'Nex.CREED', 'Rifler'], ['simox', 'Nex.SIMOX', 'Rusher'], ['cryy', 'Nex.Cryy', 'Bomber'], ['bisilaw', 'Nex.Bisilaw', 'Support']].map(([s, n, r], i) => ({ id: 'r' + i, slug: s, is_active: true, nickname: n, role_label: r, bio: null, image_url: null, socials: i === 1 ? { instagram: 'https://instagram.com/x', evil: 'javascript:alert(1)' } : {}, stats: {}, sort_order: i })),
  news: [{ id: 'n1', title: 'NEXORA Mini Tour: registration is open', slug: 'nexora-mini-tour-registration-open', content: 'Para one <script>alert(1)</script>\n\nPara two.', cover_image_url: null, published_at: iso(-864e5), is_published: true, category: 'TOURNAMENT', excerpt: 'Registration is open until 01/11.', seo_title: null, seo_description: null }],
  media_items: [{ id: 'v1', title: 'Insane clutch', is_published: true, category: 'CLUTCH', thumbnail_url: null, video_url: 'https://youtube.com/watch?v=x', view_count: 1200, published_at: iso(-864e5) }],
  hall_of_fame: [{ id: 'h1', is_published: true, tournament_name: 'Past Cup', season: 'S1', winner: 'Team Alpha', prize: '€100', mvp: 'Bob', sponsor: null, event_date: '2026-09-01' }],
  sponsors: [{ id: '3b1f0d3e-6c1a-4c7b-9a55-0b9d2f5e7a11', is_active: true, name: 'TestSponsor', logo_url: null, website_url: 'https://example.com', tier: 'standard', description: null, partner_type: 'TOURNAMENT' }],
  giveaways: [{ id: 'g1', slug: 'community-giveaway', title: 'NEXORA COMMUNITY GIVEAWAY', description: 'Win big.', prize: '€50', prize_image_url: null, status: 'LIVE', starts_at: iso(-864e5), ends_at: iso(864e5 + 8 * 36e5), max_entries: null, winners_count: 1, entries_count: 1284, rules: 'Follow us.' }],
  site_settings: [{ key: 'site', value: { name: 'NEXORA', tagline: 'BEYOND COMPETITION.', discord_url: null } }, { key: 'social', value: {} }, { key: 'stats', value: { tournaments: null, players: null, teams: null, countries: null, total_views: null, community: null } }],
};
const inserted = [];
const match = (row, k, expr) => {
  const [op, ...r] = expr.split('.'); const v = r.join('.'), c = row[k];
  if (op === 'eq') return String(c) === v; if (op === 'neq') return String(c) !== v;
  if (op === 'in') return v.slice(1, -1).split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(c));
  if (op === 'is') return v === 'null' ? c == null : c != null; return true;
};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const t = u.pathname.replace('/rest/v1/', '');
  res.setHeader('content-type', 'application/json');
  if (u.pathname === '/__inserted') return res.end(JSON.stringify(inserted));
  if (req.method === 'POST') { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => { inserted.push({ table: t, row: JSON.parse(b || '{}') }); res.statusCode = 201; res.end(); }); return; }
  let rows = mode === 'empty' ? [] : [...(T[t] ?? [])];
  for (const [k, v] of u.searchParams) { if (['select', 'order', 'limit', 'offset'].includes(k)) continue; rows = rows.filter((r) => match(r, k, v)); }
  const o = u.searchParams.get('order'); if (o) { const [k, d] = o.split('.'); rows.sort((a, b) => (a[k] > b[k] ? 1 : -1) * (d === 'desc' ? -1 : 1)); }
  const l = u.searchParams.get('limit'); if (l) rows = rows.slice(0, Number(l));
  res.end(JSON.stringify(rows));
}).listen(port, () => console.log('mock', mode, port));
