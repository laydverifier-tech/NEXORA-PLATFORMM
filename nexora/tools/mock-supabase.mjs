// LOCAL TEST DOUBLE for Supabase (Auth + MFA + PostgREST + Storage). The sandbox cannot reach supabase.co.
import http from 'node:http';
const port = Number(process.argv[2] ?? 54321), MFA = process.env.MOCK_MFA ?? 'has';
const CEO = '57d4765f-8392-4762-bab5-4bd67f38652d', USR = '4a42d482-cc7e-42f9-86c6-ace1140136a3';
const U = (s) => `${s.slice(0, 8)}-0000-4000-8000-${s.slice(0, 12).padEnd(12, '0')}`;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub, aal) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, aal, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1e3) + 3600, session_id: 'sess-1', amr: [] })}.sig`;
const user = (sub) => ({ id: sub, aud: 'authenticated', role: 'authenticated', email: sub === CEO ? 'ceo@test.dev' : 'user@test.dev', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z', factors: sub === CEO && MFA === 'has' ? [{ id: 'a1000000-0000-4000-8000-000000000001', factor_type: 'totp', status: 'verified', friendly_name: 'Phone', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }] : [] });
const session = (sub, aal) => ({ access_token: jwt(sub, aal), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1e3) + 3600, refresh_token: `rt-${sub}-${aal}`, user: user(sub) });
const now = Date.now(), iso = (ms) => new Date(now + ms).toISOString(), D = 864e5;
const ID = { t1: '11111111-1111-4111-8111-111111111111', t2: '11111111-1111-4111-8111-222222222222', r1: '22222222-2222-4222-8222-222222222221', n1: '33333333-3333-4333-8333-333333333333', m1: '44444444-4444-4444-8444-444444444441', m2: '44444444-4444-4444-8444-444444444442', g1: '55555555-5555-4555-8555-555555555555' };
const T = {
  profiles: [{ id: CEO, role: 'CEO', team_id: null, username: 'nexora_ceo' }, { id: USR, role: 'USER', team_id: null, username: 'plain_user' }], teams: [],
  tournaments: [{ id: ID.t1, name: 'NEXORA MINI TOUR', slug: 'nexora-mini-tour', game: 'Free Fire', format_type: 'SQUAD', description: 'Weekly series.', rules: 'Rule one\nRule two', banner_url: null, prize_pool: 50, entry_fee: 2, vip_fee: 3, max_teams: 24, region: null, rounds: 12, registration_start: iso(-D), registration_end: iso(5 * D), tournament_start: iso(5 * D), tournament_end: null, status: 'REGISTRATION_OPEN', bracket_format: 'X' }],
  prizes: [{ id: 'p1', tournament_id: ID.t1, placement: 1, amount: 20, description: 'Top 1' }, { id: 'p4', tournament_id: ID.t1, placement: 0, amount: 5, description: 'MVP' }], matches: [],
  roster_members: [{ id: ID.r1, slug: 'creed', nickname: 'Nex.CREED', role_label: 'Rifler', bio: null, image_url: null, socials: { instagram: 'https://instagram.com/x' }, stats: { kills: '120' }, sort_order: 1, is_active: true }],
  news: [{ id: ID.n1, title: 'Registration open', slug: 'registration-open', content: 'Hello <b>world</b>\n\nSecond', cover_image_url: null, published_at: iso(-D), created_at: iso(-D), category: 'TOURNAMENT', excerpt: 'x', seo_title: null, seo_description: null, is_published: true }],
  contact_messages: [{ id: ID.m1, name: 'Eve', email: 'eve@x.com', subject: 'Partnership', message: 'Hello <script>alert(1)</script> team', is_read: false, created_at: iso(-3600e3) }, { id: ID.m2, name: 'Bob', email: 'bob@x.com', subject: 'Hi', message: 'Second message text', is_read: true, created_at: iso(-2 * D) }],
  squad_registrations: [{ id: ID.g1, tournament_id: ID.t1, squad_name: '=cmd|calc', tag: 'ABC', captain_name: 'Cap', whatsapp: '+33600000000', discord: 'cap#1', tier: 'VIP', status: 'PENDING', payment_status: 'PENDING', order_id: 'NX-001', players: [{ nickname: 'P1', uid: '111' }], created_at: iso(-3600e3) }],
  activity_logs: [{ id: 'l1', actor_id: CEO, action: 'roster.update', entity_type: 'roster_member', created_at: iso(-3600e3) }],
  sponsors: [], media_items: [], hall_of_fame: [], giveaways: [{ id: '55555555-5555-4555-8555-555555555555', slug: 'community-giveaway', title: 'Community Giveaway', description: 'Win!', prize: '€50', prize_image_url: null, status: 'LIVE', starts_at: iso(-D), ends_at: iso(D), max_entries: null, winners_count: 1, entries_count: 3, rules: null }],
  nx_rooms: [{ id: '66666666-6666-4666-8666-666666666666', tournament_id: ID.t1, stage: 'GRAND_FINAL', name: 'Room 1', room_id: '12345', room_password: 'pw1', scheduled_at: iso(D), status: 'SCHEDULED' }], nx_results: [{ tournament_id: ID.t1, stage: 'GRAND_FINAL', round: 1, registration_id: 'r1', placement: 1, kills: 5 }], giveaway_entries: [], giveaway_winners: [], private_settings: [],
  site_settings: [{ key: 'site', value: { name: 'NEXORA', tagline: 'BEYOND COMPETITION.' } }, { key: 'social', value: { instagram_url: 'https://instagram.com/nexora' } }, { key: 'hero', value: { title: 'NEXORA' } }, { key: 'stats', value: {} }],
};
const RPC = {
  nx_leaderboard: () => [{ rank: 1, registration_id: 'r1', squad_name: 'Bravo', tag: 'BBB', rounds_played: 2, booyahs: 1, kills: 13, points: 40 }, { rank: 2, registration_id: 'r2', squad_name: 'Alpha', tag: 'AAA', rounds_played: 2, booyahs: 1, kills: 7, points: 32 }],
  nx_giveaway_winners: () => [], nx_draw_giveaway: () => 1, nx_enter_giveaway: () => 'ok', nx_register_squad: () => ({ id: 'x', order_id: 'NX-TEST-1', tournament: 'NEXORA MINI TOUR', tier: 'NORMAL', fee: 2 }),
  nx_admin_analytics: () => ({ days: 30, totals: { views: 1234, visitors: 321, tournament_views: 77, giveaway_views: 0, sponsor_clicks: 5, media_views: 0 }, daily: Array.from({ length: 14 }, (_, i) => ({ day: new Date(now - (13 - i) * D).toISOString().slice(0, 10), views: 20 + i * 7, visitors: 10 + i })), top_pages: [{ path: '/', views: 800 }, { path: '/tournaments', views: 200 }], devices: [{ name: 'mobile', n: 700 }, { name: 'desktop', n: 500 }], countries: [{ name: 'FR', n: 600 }, { name: 'MA', n: 400 }], referrers: [{ name: 'instagram.com', n: 300 }] }),
  nx_admin_overview: () => ({ unread_messages: 1, messages: 2, roster: 1, tournaments: 1, news: 1, users: 2, registrations: 1, giveaways: 0 }),
  admin_get_sessions: () => [{ profile_id: CEO, username: 'nexora_ceo', display_name: 'CEO', role: 'CEO', ip: '203.0.113.7', user_agent: 'Mozilla/5.0 Test', created_at: iso(-D), updated_at: iso(-60e3), not_after: null }],
};
const log = []; const hits = new Map();
const match = (row, k, expr) => { const [op, ...r] = expr.split('.'); const v = r.join('.'), c = row[k]; if (op === 'eq') return String(c) === v; if (op === 'neq') return String(c) !== v; if (op === 'in') return v.slice(1, -1).split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(c)); if (op === 'is') return v === 'null' ? c == null : c != null; return true; };
const sub = (req) => { try { return JSON.parse(Buffer.from((req.headers.authorization ?? '').split('.')[1] ?? '', 'base64url').toString()).sub; } catch { return null; } };
http.createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*'); res.setHeader('access-control-allow-headers', '*'); res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const u = new URL(req.url, 'http://x'); let body = ''; req.on('data', (d) => (body += d));
  req.on('end', () => {
    const send = (code, o) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(o === undefined ? '' : JSON.stringify(o)); };
    const j = () => { try { return JSON.parse(body || '{}'); } catch { return {}; } };
    const p = u.pathname;
    if (p === '/__log') return send(200, log); if (p === '/__reset') { log.length = 0; return send(200, {}); }
    if (p === '/auth/v1/user') { const s = sub(req); return s ? send(200, user(s)) : send(401, { msg: 'no token' }); }
    if (p === '/auth/v1/token') {
      const g = u.searchParams.get('grant_type'), b = j();
      if (g === 'password') { const s = b.email === 'ceo@test.dev' ? CEO : b.email === 'user@test.dev' ? USR : null; return s && b.password === 'Correct-Horse-9' ? send(200, session(s, 'aal1')) : send(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }); }
      const m = /^rt-(.+)-(aal\d)$/.exec(b.refresh_token ?? ''); return m ? send(200, session(m[1], m[2])) : send(400, { error: 'invalid_grant' });
    }
    if (p === '/auth/v1/logout') return send(204);
    if (p === '/auth/v1/factors' && req.method === 'POST') { log.push({ m: 'enroll' }); return send(200, { id: 'b2000000-0000-4000-8000-000000000002', type: 'totp', friendly_name: j().friendly_name, totp: { qr_code: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', secret: 'JBSWY3DPEHPK3PXP', uri: 'otpauth://totp/x' } }); }
    let m = /^\/auth\/v1\/factors\/([^/]+)\/(challenge|verify)$/.exec(p);
    if (m && m[2] === 'challenge') return send(200, { id: 'c3000000-0000-4000-8000-000000000003', type: 'totp', expires_at: Math.floor(Date.now() / 1e3) + 300 });
    if (m && m[2] === 'verify') { log.push({ m: 'mfa.verify', code: j().code }); return j().code === '123456' ? send(200, session(sub(req) ?? CEO, 'aal2')) : send(400, { code: 400, error_code: 'mfa_verification_failed', msg: 'Invalid TOTP code entered' }); }
    if (/^\/auth\/v1\/factors\/[^/]+$/.test(p) && req.method === 'DELETE') { log.push({ m: 'mfa.unenroll' }); return send(200, {}); }
    if (p.startsWith('/storage/v1/object/')) { log.push({ m: 'storage.upload', path: p.replace('/storage/v1/object/', ''), bytes: body.length, ct: req.headers['content-type'] }); return send(200, { Key: p.replace('/storage/v1/object/', '') }); }
    m = /^\/rest\/v1\/rpc\/(.+)$/.exec(p); if (m) { log.push({ m: 'rpc', fn: m[1] }); return RPC[m[1]] ? send(200, RPC[m[1]]()) : m[1] === 'nx_hit' ? (() => { const b = j(); const now2 = Date.now(); const e = hits.get(b.p_key); const n = e && now2 - e.t < b.p_window_seconds * 1000 ? e.n + 1 : 1; hits.set(b.p_key, { t: e && now2 - e.t < b.p_window_seconds * 1000 ? e.t : now2, n }); return send(200, n <= b.p_limit); })() : send(404, { message: 'no rpc' }); }
    m = /^\/rest\/v1\/(.+)$/.exec(p); if (!m) return send(404, {}); const t = m[1];
    if (req.method !== 'GET' && req.method !== 'HEAD') { log.push({ m: req.method, table: t, q: u.search.slice(0, 120), row: j() }); const rep = /return=representation/.test(req.headers.prefer ?? ''); return req.method === 'POST' ? send(201, rep ? [{ id: ID.t2, ...(Array.isArray(j()) ? {} : j()) }] : undefined) : send(rep ? 200 : 204, rep ? [] : undefined); }
    let rows = [...(T[t] ?? [])];
    for (const [k, v] of u.searchParams) { if (['select', 'order', 'limit', 'offset'].includes(k)) continue; rows = rows.filter((r) => match(r, k, v)); }
    const o = u.searchParams.get('order'); if (o) { const [k, d] = o.split('.'); rows.sort((a, b) => (a[k] > b[k] ? 1 : -1) * (d === 'desc' ? -1 : 1)); }
    const l = u.searchParams.get('limit'); if (l) rows = rows.slice(0, Number(l));
    send(200, rows);
  });
}).listen(port, () => console.log('mock-supabase', port, 'mfa=' + MFA));
