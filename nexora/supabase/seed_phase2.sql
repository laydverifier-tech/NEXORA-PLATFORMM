-- ALREADY APPLIED on 2026-10-09 (kept for reference). Requires a CEO profile (exists).
--   update public.profiles set role = 'CEO' where id = (select id from auth.users where email = 'YOUR_EMAIL');
-- ⚠ Review the marked values (game, tournament_start) before running.

insert into public.roster_members (slug, nickname, role_label, sort_order) values
  ('adam-x',  'Nex.ADAM.X',  null,      1),
  ('creed',   'Nex.CREED',   'Rifler',  2),
  ('simox',   'Nex.SIMOX',   'Rusher',  3),
  ('cryy',    'Nex.Cryy',    'Bomber',  4),
  ('bisilaw', 'Nex.Bisilaw', 'Support', 5)
on conflict (slug) do nothing;

with ceo as (select id from public.profiles where role::text = 'CEO' order by created_at limit 1)
insert into public.tournaments
  (name, slug, game, format_type, description, rules, prize_pool, entry_fee, max_teams,
   registration_start, registration_end, tournament_start, bracket_format, rounds, region, status,
   organizer_id, match_mode)
select 'NEXORA MINI TOUR','nexora-mini-tour',
  'Free Fire',                                   -- ⚠ confirm the game
  'SQUAD',
  'Weekly series. 24 squads. Group stage, Last Chance, then a 12-round Grand Final. €50 prize pool every week.',
  E'GROUP STAGE (Monday): 24 squads in 2 groups of 12. 1st-2nd go to the Grand Final, 3rd-8th go to Last Chance, 9th-12th are eliminated.\nLAST CHANCE (Tuesday): 12 squads. Top 8 qualify for the Grand Final, bottom 4 are eliminated.\nGRAND FINAL (Thursday + Friday): 12 squads, 12 rounds (6 per day).\nEntry fee: Normal €2 / VIP €3. Prizes: Top 1 €20, Top 2 €15, Top 3 €10, MVP €5.',
  50, 2, 24,
  now(), '2026-11-01 23:59:00+00',
  '2026-11-01 23:59:00+00',                      -- ⚠ placeholder = registration deadline (site shows "DATE TBA")
  'GROUP_LAST_CHANCE_FINAL', 12, null, 'REGISTRATION_OPEN', ceo.id, 'BATTLE_ROYALE'
from ceo
on conflict (slug) do nothing;

insert into public.prizes (tournament_id, placement, amount, description)
select t.id, v.p, v.a, v.d from public.tournaments t,
  (values (1,20,'Top 1'),(2,15,'Top 2'),(3,10,'Top 3'),(0,5,'MVP')) as v(p,a,d)
where t.slug = 'nexora-mini-tour'
  and not exists (select 1 from public.prizes x where x.tournament_id = t.id);

with ceo as (select id from public.profiles where role::text = 'CEO' order by created_at limit 1)
insert into public.news (title, slug, content, author_id, is_published, published_at, category, excerpt)
select 'NEXORA Mini Tour: registration is open','nexora-mini-tour-registration-open',
  E'The NEXORA Mini Tour is here: 24 squads, 4 competition days and 12 Grand Final rounds.\n\nRegistration fee: Normal €2, VIP €3. Registration closes on 01/11.\n\nPrize pool: €50 every week, split between Top 1 (€20), Top 2 (€15), Top 3 (€10) and the MVP (€5).\n\n#GONEXORA',
  ceo.id, true, now(), 'TOURNAMENT', 'Registration for the weekly NEXORA Mini Tour is open until 01/11.'
from ceo
on conflict (slug) do nothing;
