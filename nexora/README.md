# NEXORA Platform — Phase 1 + 2
Next.js 14 · TypeScript · Tailwind · Supabase (existing project "NEXORA GAMING") · Zod · Vitest

## Run locally
1. `.env.local` is pre-filled with the public Supabase URL + anon key (service-role key is NEVER needed in Phase 2). Change `IP_HASH_SALT`.
2. **Database: already applied** to project NEXORA GAMING (migration `nx_phase2_content` + seed: roster, Mini Tour, prizes, first article). The SQL is kept in `supabase/` for reference.
3. In Supabase → Authentication → URL Configuration: Site URL `http://localhost:3000` and redirect `http://localhost:3000/auth/callback`.
4. `npm install && npm run dev` — `npm run typecheck` · `npm test` · `npm run build`

## Existing schema compatibility
Your project already had profiles / tournaments / matches / news / sponsors / site_settings… (all empty). Phase 2 **reuses** them and only adds:
roster_members, media_items, hall_of_fame, giveaways, contact_messages, analytics_events, a few columns on news/sponsors, `nx_*` helper functions, RLS public-read policies and storage buckets.
`supabase/_superseded/` holds Phase 1 draft migrations that conflict with the existing `profiles` table — do NOT run them. Existing helpers reused: is_admin_or_ceo(), has_permission(key).
Roles come from `profiles.role` (CEO→SUPER_ADMIN…, ADMIN, ORGANIZER) + `teams.captain_id` (captain).

## Verification
RLS verified live with SQL role simulation (anon / user / CEO). Pages tested against a PostgREST mock (`tools/mock-postgrest.mjs`, `tools/crawl.py`) because the build sandbox cannot reach supabase.co: run the site locally to confirm real responses.


## Admin console (/admin) — 2-step login
- Login: `/admin/login` (email + password) → **authenticator app code (TOTP)** → panel. First time: scan the QR (`/admin/mfa/enroll`). Add a 2nd authenticator in **Security** (strongly recommended).
- Enforced in 3 layers: Next.js guard (role + aal2), server actions re-check everything, and the **database** (RESTRICTIVE RLS policies `nx aal2 *`: privileged users can't write/read sensitive data without an aal2 session).
- Pages: Dashboard (analytics), Tournaments, Registrations (+CSV), Roster (+photo upload), News, Messages, Settings (site, hero, social links, stats), Security (authenticators, staff sessions + real IPs, audit log).
- Recovery if you lose every authenticator: Supabase Dashboard → Authentication → Users → your user → remove MFA factor.
- Required Supabase settings: Authentication → MFA → TOTP enabled; Authentication → Attack protection → leaked password protection ON.
- Admin also has: Rooms (+WhatsApp send links), Results (placement/kills per round, auto leaderboard, story/post PNG), Giveaways (secure server-side draw), Media, Hall of Fame, Partners, Users & roles (CEO only), private settings (payment WhatsApp number, Discord webhook).
- Public: squad registration `/tournaments/<slug>/register` (captcha + rate limit + WhatsApp payment message), live leaderboard + image, giveaway entry.
- Tests: `npm test` (unit), `tools/admin-e2e.py` (63 end-to-end/security checks against `tools/mock-supabase.mjs`; run the server with SUPABASE_SERVICE_ROLE_KEY and CAPTCHA_SECRET set).
- Vercel env vars: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only), IP_HASH_SALT, CAPTCHA_SECRET.
