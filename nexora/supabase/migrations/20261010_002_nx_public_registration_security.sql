-- NEXORA Phase 3 — public (account-less) registration + security hardening. Applied to NEXORA GAMING on 2026-10-10.
-- All public WRITES now go through the Next.js server (service_role) → validated, captcha-checked, rate-limited.

-- ───────── registration columns / uniqueness ─────────
alter table public.tournaments add column if not exists vip_fee numeric check (vip_fee is null or vip_fee >= 0);
alter table public.squad_registrations alter column contact_email drop not null;
alter table public.squad_registrations add column if not exists order_id text unique;
alter table public.squad_registrations add column if not exists whatsapp text;
alter table public.squad_registrations add column if not exists discord text;
alter table public.squad_registrations add column if not exists tier text not null default 'NORMAL' check (tier in ('NORMAL','VIP'));
alter table public.squad_registrations add column if not exists payment_status text not null default 'PENDING' check (payment_status in ('PENDING','CONFIRMED','REJECTED','REFUNDED'));
alter table public.squad_registrations add column if not exists name_norm text;
alter table public.squad_registrations add column if not exists whatsapp_norm text;
alter table public.squad_registrations add column if not exists ip_hash text;
create unique index if not exists squad_reg_name_uniq on public.squad_registrations (tournament_id, name_norm)
  where name_norm is not null and status in ('PENDING','CONFIRMED','WAITLISTED');
create unique index if not exists squad_reg_whatsapp_uniq on public.squad_registrations (tournament_id, whatsapp_norm)
  where whatsapp_norm is not null and status in ('PENDING','CONFIRMED','WAITLISTED');

create table if not exists public.registration_uids (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  uid text not null check (uid ~ '^[0-9]{6,15}$'),
  registration_id uuid not null references public.squad_registrations(id) on delete cascade,
  primary key (tournament_id, uid)
);
alter table public.registration_uids enable row level security;   -- no policies: only the SECURITY DEFINER RPC touches it

create or replace function public.nx_free_uids() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status in ('REJECTED','WITHDRAWN') then delete from public.registration_uids where registration_id = new.id; end if;
  return new;
end $$;
drop trigger if exists nx_free_uids_trg on public.squad_registrations;
create trigger nx_free_uids_trg after update of status on public.squad_registrations for each row execute function public.nx_free_uids();

create sequence if not exists public.nx_order_seq;

-- ───────── infrastructure tables (service-role only) ─────────
create table if not exists public.rate_limits (key text primary key, window_start timestamptz not null default now(), hits int not null default 0);
create table if not exists public.captcha_nonces (nonce text primary key, created_at timestamptz not null default now());
alter table public.rate_limits enable row level security;
alter table public.captcha_nonces enable row level security;

create or replace function public.nx_hit(p_key text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare h int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when now() - r.window_start > make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when now() - r.window_start > make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into h;
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return h <= p_limit;
end $$;

create or replace function public.nx_use_captcha(p_nonce text) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if random() < 0.02 then delete from public.captcha_nonces where created_at < now() - interval '1 day'; end if;
  insert into public.captcha_nonces (nonce) values (p_nonce);
  return true;
exception when unique_violation then return false;
end $$;

-- ───────── atomic, validated registration ─────────
create or replace function public.nx_register_squad(p_tournament uuid, p_squad text, p_tag text, p_captain text, p_whatsapp text, p_discord text, p_tier text, p_players jsonb, p_ip text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.tournaments%rowtype; v_norm text; v_wa text; v_id uuid; v_order text; v_cnt int; pl jsonb; v_uid text; v_seen text[] := '{}';
begin
  select * into t from public.tournaments where id = p_tournament for update;
  if not found or t.status <> 'REGISTRATION_OPEN' or now() < t.registration_start or now() > t.registration_end then raise exception 'TOURNAMENT_CLOSED'; end if;
  if p_tier not in ('NORMAL','VIP') then raise exception 'INVALID'; end if;
  v_norm := regexp_replace(lower(btrim(p_squad)), '[\s._\-]+', '', 'g');
  v_wa := right(regexp_replace(coalesce(p_whatsapp,''), '\D', '', 'g'), 9);
  if char_length(v_norm) < 2 or char_length(btrim(p_squad)) > 40 or char_length(v_wa) < 8 or char_length(btrim(p_captain)) not between 2 and 40 then raise exception 'INVALID'; end if;
  if jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) <> 5 then raise exception 'INVALID'; end if;
  for pl in select * from jsonb_array_elements(p_players) loop
    v_uid := pl->>'uid';
    if v_uid is null or v_uid !~ '^[0-9]{6,15}$' or char_length(coalesce(pl->>'nickname','')) not between 2 and 24 then raise exception 'INVALID'; end if;
    if v_uid = any(v_seen) then raise exception 'UID_DUPLICATE'; end if;
    v_seen := v_seen || v_uid;
  end loop;
  select count(*) into v_cnt from public.squad_registrations where tournament_id = p_tournament and status in ('PENDING','CONFIRMED','WAITLISTED');
  if v_cnt >= t.max_teams then raise exception 'SLOTS_FULL'; end if;
  if exists (select 1 from public.squad_registrations where tournament_id = p_tournament and name_norm = v_norm and status in ('PENDING','CONFIRMED','WAITLISTED')) then raise exception 'NAME_TAKEN'; end if;
  if exists (select 1 from public.squad_registrations where tournament_id = p_tournament and whatsapp_norm = v_wa and status in ('PENDING','CONFIRMED','WAITLISTED')) then raise exception 'WHATSAPP_TAKEN'; end if;
  v_order := 'NX-' || lpad(nextval('public.nx_order_seq')::text, 5, '0');
  begin
    insert into public.squad_registrations (tournament_id, squad_name, tag, captain_name, contact_phone, whatsapp, discord, tier, players, status, payment_status, name_norm, whatsapp_norm, order_id, ip_hash)
    values (p_tournament, btrim(p_squad), nullif(btrim(coalesce(p_tag,'')),''), btrim(p_captain), p_whatsapp, p_whatsapp, nullif(btrim(coalesce(p_discord,'')),''), p_tier, p_players, 'PENDING', 'PENDING', v_norm, v_wa, v_order, p_ip)
    returning id into v_id;
    insert into public.registration_uids (tournament_id, uid, registration_id) select p_tournament, e->>'uid', v_id from jsonb_array_elements(p_players) e;
  exception when unique_violation then
    if sqlerrm like '%registration_uids%' then raise exception 'UID_TAKEN'; end if;
    if sqlerrm like '%whatsapp%' then raise exception 'WHATSAPP_TAKEN'; end if;
    raise exception 'NAME_TAKEN';
  end;
  return jsonb_build_object('id', v_id, 'order_id', v_order, 'tournament', t.name, 'tier', p_tier,
    'fee', case when p_tier = 'VIP' then coalesce(t.vip_fee, t.entry_fee) else t.entry_fee end);
end $$;

revoke all on function public.nx_hit(text,int,int), public.nx_use_captcha(text), public.nx_register_squad(uuid,text,text,text,text,text,text,jsonb,text), public.nx_free_uids() from public, anon, authenticated;
grant execute on function public.nx_hit(text,int,int), public.nx_use_captcha(text), public.nx_register_squad(uuid,text,text,text,text,text,text,jsonb,text) to service_role;

-- ───────── close public-write holes + stop leaking private data ─────────
drop policy if exists "squad_registrations_insert_public" on public.squad_registrations;   -- would bypass captcha/uniqueness
drop policy if exists "squad_registrations_select" on public.squad_registrations;           -- exposed phone/email/UIDs of CONFIRMED squads
create policy "nx squad_registrations staff read" on public.squad_registrations for select to authenticated
  using (public.is_admin_or_ceo() or public.has_permission('manage_registrations') or exists (select 1 from public.tournaments t where t.id = squad_registrations.tournament_id and t.organizer_id = auth.uid()));
create or replace view public.public_squads with (security_invoker = false) as
  select id, tournament_id, squad_name, tag, logo_url from public.squad_registrations where status = 'CONFIRMED';
grant select on public.public_squads to anon, authenticated;

drop policy if exists "nx contact insert" on public.contact_messages;
drop policy if exists "nx analytics insert" on public.analytics_events;
create policy "nx contact staff delete" on public.contact_messages for delete to authenticated using (public.is_admin_or_ceo() or public.has_permission('manage_support'));

drop policy if exists "profiles_select_all" on public.profiles;                              -- exposed ban_reason/role of every user
create policy "nx profiles read own or staff" on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin_or_ceo() or public.has_permission('manage_users'));

-- ───────── private settings (e.g. WhatsApp payment number): never public ─────────
create table if not exists public.private_settings (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), updated_by uuid);
alter table public.private_settings enable row level security;
create policy "nx private_settings staff" on public.private_settings for all to authenticated
  using (public.is_ceo() or public.has_permission('manage_settings')) with check (public.is_ceo() or public.has_permission('manage_settings'));

-- ───────── public site content defaults ─────────
insert into public.site_settings (key, value) values
  ('hero', '{"eyebrow":"#GONEXORA","title":"NEXORA","tagline":"BEYOND COMPETITION.","cta1_label":"EXPLORE NEXORA","cta1_href":"/about","cta2_label":"VIEW TOURNAMENTS","cta2_href":"/tournaments","video_url":null,"poster_url":null}')
on conflict (key) do nothing;
update public.site_settings set value = value || '{"instagram_url":null,"tiktok_url":null,"youtube_url":null,"twitch_url":null,"x_url":null,"discord_url":null}'::jsonb
  where key = 'social' and not (value ? 'instagram_url');
update public.tournaments set vip_fee = 3 where slug = 'nexora-mini-tour' and vip_fee is null;

-- ───────── storage: more public buckets + staff write on all content buckets ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-assets','site-assets',true,41943040,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do nothing;
drop policy if exists "nx storage staff write" on storage.objects;
create policy "nx storage staff write v2" on storage.objects for all to authenticated
  using (bucket_id in ('roster','media','giveaway-assets','site-assets','news-covers','sponsor-logos','tournament-banners') and (public.is_admin_or_ceo() or public.has_permission('manage_news') or public.has_permission('manage_settings')))
  with check (bucket_id in ('roster','media','giveaway-assets','site-assets','news-covers','sponsor-logos','tournament-banners') and (public.is_admin_or_ceo() or public.has_permission('manage_news') or public.has_permission('manage_settings')));

-- ───────── analytics summary for the admin dashboard (staff only) ─────────
create or replace function public.nx_analytics_summary(p_days int default 30) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not (public.is_admin_or_ceo() or public.has_permission('view_logs')) then raise exception 'Not authorized'; end if;
  return jsonb_build_object(
    'by_type', coalesce((select jsonb_object_agg(event_type, c) from (select event_type, count(*) c from public.analytics_events where created_at > now() - make_interval(days => p_days) group by 1) x), '{}'::jsonb),
    'by_day',  coalesce((select jsonb_agg(jsonb_build_object('day', d, 'views', c) order by d) from (select created_at::date d, count(*) c from public.analytics_events where event_type = 'page_view' and created_at > now() - make_interval(days => p_days) group by 1) y), '[]'::jsonb),
    'top_paths', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'views', c)) from (select path, count(*) c from public.analytics_events where event_type = 'page_view' and created_at > now() - make_interval(days => p_days) group by 1 order by 2 desc limit 8) z), '[]'::jsonb));
end $$;
revoke all on function public.nx_analytics_summary(int) from public, anon;
grant execute on function public.nx_analytics_summary(int) to authenticated;
