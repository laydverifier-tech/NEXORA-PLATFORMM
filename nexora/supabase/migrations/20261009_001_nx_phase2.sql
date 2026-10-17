-- NEXORA Phase 2 — ADDITIVE migration (verified against the live schema on 2026-10-09).
-- Reuses the existing helpers is_admin_or_ceo() / has_permission(key) and the existing public-read policies.
-- Adds: 6 new tables, a few nullable columns, RLS, 3 storage buckets. Nothing is dropped or rewritten.

-- additive columns on existing tables
alter table public.news add column if not exists category text
  check (category is null or category in ('TOURNAMENT','ROSTER','COMMUNITY','ANNOUNCEMENT','PARTNERS','MEDIA'));
alter table public.news add column if not exists excerpt text;
alter table public.news add column if not exists seo_title text;
alter table public.news add column if not exists seo_description text;
alter table public.sponsors add column if not exists description text;
alter table public.sponsors add column if not exists partner_type text
  check (partner_type is null or partner_type in ('TITLE','TOURNAMENT','MVP','GIVEAWAY','CONTENT','BROADCAST'));

create table if not exists public.roster_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  nickname text not null check (char_length(nickname) between 2 and 40),
  role_label text check (role_label is null or char_length(role_label) <= 30),
  bio text check (bio is null or char_length(bio) <= 1500),
  image_url text check (image_url is null or image_url ~ '^https://'),
  socials jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 140),
  category text not null check (category in ('BEST_PLAY','MVP','CLUTCH','FINAL','MATCHDAY','BEHIND_THE_SCENES')),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://'),
  video_url text not null check (video_url ~ '^https://'),
  view_count int not null default 0 check (view_count >= 0),
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  tournament_name text not null check (char_length(tournament_name) between 2 and 120),
  season text, winner text not null, prize text, mvp text, sponsor text,
  event_date date, sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.giveaways (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 3 and 140),
  description text, prize text not null,
  prize_image_url text check (prize_image_url is null or prize_image_url ~ '^https://'),
  sponsor_id uuid references public.sponsors(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','UPCOMING','LIVE','ENDED','DRAWING','WINNER_SELECTED','CANCELLED')),
  starts_at timestamptz not null, ends_at timestamptz not null,
  max_entries int check (max_entries is null or max_entries > 0),
  winners_count int not null default 1 check (winners_count between 1 and 50),
  entries_count int not null default 0 check (entries_count >= 0),
  rules text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 4000),
  ip_hash text, is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view','tournament_view','giveaway_view','media_view','sponsor_click','registration_start')),
  path text check (path is null or char_length(path) <= 200),
  ref_id text check (ref_id is null or char_length(ref_id) <= 80),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);
create index if not exists roster_sort_idx on public.roster_members (sort_order);

alter table public.roster_members   enable row level security;
alter table public.media_items      enable row level security;
alter table public.hall_of_fame     enable row level security;
alter table public.giveaways        enable row level security;
alter table public.contact_messages enable row level security;
alter table public.analytics_events enable row level security;

-- RLS: public read for published content; writes only for CEO/ADMIN or holders of the matching permission key.
create policy "nx roster public read" on public.roster_members for select to anon, authenticated using (is_active);
create policy "nx roster staff write" on public.roster_members for all to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_news')) with check (public.is_admin_or_ceo() or public.has_permission('manage_news'));
create policy "nx media public read" on public.media_items for select to anon, authenticated using (is_published);
create policy "nx media staff write" on public.media_items for all to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_news')) with check (public.is_admin_or_ceo() or public.has_permission('manage_news'));
create policy "nx hof public read" on public.hall_of_fame for select to anon, authenticated using (is_published);
create policy "nx hof staff write" on public.hall_of_fame for all to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_news')) with check (public.is_admin_or_ceo() or public.has_permission('manage_news'));
create policy "nx giveaways public read" on public.giveaways for select to anon, authenticated using (status <> 'DRAFT');
create policy "nx giveaways staff write" on public.giveaways for all to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_tournaments')) with check (public.is_admin_or_ceo() or public.has_permission('manage_tournaments'));
create policy "nx contact insert" on public.contact_messages for insert to anon, authenticated with check (is_read = false);
create policy "nx contact staff read" on public.contact_messages for select to authenticated using (public.is_admin_or_ceo() or public.has_permission('manage_support'));
create policy "nx contact staff update" on public.contact_messages for update to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_support')) with check (public.is_admin_or_ceo() or public.has_permission('manage_support'));
create policy "nx analytics insert" on public.analytics_events for insert to anon, authenticated with check (event_type is not null);
create policy "nx analytics staff read" on public.analytics_events for select to authenticated using (public.is_admin_or_ceo() or public.has_permission('view_logs'));

-- default settings (no invented stats)
insert into public.site_settings (key, value) values
  ('site',   '{"name":"NEXORA","tagline":"BEYOND COMPETITION.","hashtag":"#GONEXORA","contact_email":null,"discord_url":null}'),
  ('social', '{"tournament_handle":"@nexora_tour","gaming_handle":"@nexora_gaming.ofc"}'),
  ('stats',  '{"tournaments":null,"players":null,"teams":null,"countries":null,"total_views":null,"community":null}')
on conflict (key) do nothing;

-- storage: 3 new public-read buckets with size/mime limits; writes restricted to staff
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('roster','roster',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('media','media',true,10485760,array['image/jpeg','image/png','image/webp']),
  ('giveaway-assets','giveaway-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "nx storage staff write" on storage.objects for all to authenticated
  using (bucket_id in ('roster','media','giveaway-assets') and (public.is_admin_or_ceo() or public.has_permission('manage_news')))
  with check (bucket_id in ('roster','media','giveaway-assets') and (public.is_admin_or_ceo() or public.has_permission('manage_news')));
