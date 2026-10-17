-- Rooms, results/leaderboard (account-less, built on squad_registrations), giveaway entries + CSPRNG draw. Additive.
create table if not exists public.nx_rooms (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage text not null check (stage ~ '^[A-Z0-9_]{2,30}$'),
  name text not null check (char_length(name) between 2 and 60),
  room_id text not null check (char_length(room_id) between 1 and 40),
  room_password text check (room_password is null or char_length(room_password) <= 40),
  scheduled_at timestamptz,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','OPEN','LIVE','FINISHED','CANCELLED')),
  created_at timestamptz not null default now()
);
create table if not exists public.nx_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage text not null check (stage ~ '^[A-Z0-9_]{2,30}$'),
  round int not null check (round between 1 and 99),
  registration_id uuid not null references public.squad_registrations(id) on delete cascade,
  placement int not null check (placement between 1 and 100),
  kills int not null default 0 check (kills between 0 and 200),
  created_at timestamptz not null default now(),
  unique (tournament_id, stage, round, registration_id)
);
create index if not exists nx_results_t_stage_idx on public.nx_results (tournament_id, stage);
create table if not exists public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.giveaways(id) on delete cascade,
  contact text not null check (char_length(contact) between 3 and 120),
  contact_hash text not null, ip_hash text,
  created_at timestamptz not null default now(),
  unique (giveaway_id, contact_hash)
);
create table if not exists public.giveaway_winners (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.giveaways(id) on delete cascade,
  entry_id uuid not null references public.giveaway_entries(id),
  selected_at timestamptz not null default now(),
  selected_by uuid references public.profiles(id),
  unique (giveaway_id, entry_id)
);
alter table public.nx_rooms enable row level security;
alter table public.nx_results enable row level security;
alter table public.giveaway_entries enable row level security;
alter table public.giveaway_winners enable row level security;

-- staff (organizer and above, or the permission key) manage rooms/results; results are public once the tournament is public
create policy "nx rooms staff" on public.nx_rooms for all to authenticated
  using (public.is_organizer_or_above() or public.has_permission('manage_tournaments')) with check (public.is_organizer_or_above() or public.has_permission('manage_tournaments'));
create policy "nx results public read" on public.nx_results for select to anon, authenticated
  using (exists (select 1 from public.tournaments t where t.id = nx_results.tournament_id and t.status::text in ('REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','FINISHED')));
create policy "nx results staff write" on public.nx_results for all to authenticated
  using (public.is_organizer_or_above() or public.has_permission('manage_tournaments')) with check (public.is_organizer_or_above() or public.has_permission('manage_tournaments'));
create policy "nx entries staff read" on public.giveaway_entries for select to authenticated using (public.is_admin_or_ceo() or public.has_permission('manage_tournaments'));
create policy "nx winners staff read" on public.giveaway_winners for select to authenticated using (public.is_admin_or_ceo() or public.has_permission('manage_tournaments'));

-- MFA (aal2) required for privileged users on these tables too
do $$
declare spec jsonb := '{"nx_rooms":["select","insert","update","delete"],"nx_results":["insert","update","delete"],"giveaway_entries":["select","delete"],"giveaway_winners":["select"]}'::jsonb;
  t text; c text; cond text := '(public.nx_aal2() or not public.nx_is_privileged())';
begin
  for t in select jsonb_object_keys(spec) loop
    for c in select jsonb_array_elements_text(spec -> t) loop
      execute format('drop policy if exists %I on public.%I', 'nx aal2 ' || c, t);
      if c = 'insert' then execute format('create policy %I on public.%I as restrictive for insert to authenticated with check %s', 'nx aal2 ' || c, t, cond);
      elsif c = 'update' then execute format('create policy %I on public.%I as restrictive for update to authenticated using %s with check %s', 'nx aal2 ' || c, t, cond, cond);
      else execute format('create policy %I on public.%I as restrictive for %s to authenticated using %s', 'nx aal2 ' || c, t, c, cond); end if;
    end loop;
  end loop;
end $$;

-- Leaderboard: points = placement_points[placement] + kills * kill_points (from the tournament config). Public, no private data.
create or replace function public.nx_leaderboard(p_tournament uuid, p_stage text default null)
returns table(rank int, registration_id uuid, squad_name text, tag text, rounds_played int, booyahs int, kills int, points numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  with t as (select placement_points, kill_points from public.tournaments where id = p_tournament and status::text in ('REGISTRATION_OPEN','REGISTRATION_CLOSED','LIVE','FINISHED')),
  agg as (
    select r.registration_id, count(*)::int as rounds_played, (count(*) filter (where r.placement = 1))::int as booyahs, sum(r.kills)::int as kills,
           sum(coalesce(((select placement_points from t) ->> r.placement::text)::numeric, 0) + r.kills * (select kill_points from t)) as points
    from public.nx_results r where r.tournament_id = p_tournament and (p_stage is null or r.stage = p_stage) and exists (select 1 from t)
    group by r.registration_id)
  select (rank() over (order by a.points desc, a.booyahs desc, a.kills desc))::int, a.registration_id, s.squad_name, s.tag, a.rounds_played, a.booyahs, a.kills, a.points
  from agg a join public.squad_registrations s on s.id = a.registration_id
  order by 1, s.squad_name;
$$;
revoke all on function public.nx_leaderboard(uuid, text) from public;
grant execute on function public.nx_leaderboard(uuid, text) to anon, authenticated, service_role;

-- keep giveaways.entries_count accurate
create or replace function public.nx_entries_count() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then update public.giveaways set entries_count = entries_count + 1 where id = new.giveaway_id;
  else update public.giveaways set entries_count = greatest(entries_count - 1, 0) where id = old.giveaway_id; end if;
  return null;
end $$;
drop trigger if exists nx_entries_count_trg on public.giveaway_entries;
create trigger nx_entries_count_trg after insert or delete on public.giveaway_entries for each row execute function public.nx_entries_count();
revoke all on function public.nx_entries_count() from public, anon, authenticated;

-- Entry: ONLY callable by the server (service_role) after captcha + rate limit. Time and limits are checked with the DATABASE clock.
create or replace function public.nx_enter_giveaway(p_slug text, p_contact text, p_hash text, p_ip text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.giveaways;
begin
  select * into g from public.giveaways where slug = p_slug for update;
  if not found or g.status <> 'LIVE' or now() < g.starts_at or now() >= g.ends_at then return 'closed'; end if;
  if g.max_entries is not null and g.entries_count >= g.max_entries then return 'full'; end if;
  insert into public.giveaway_entries (giveaway_id, contact, contact_hash, ip_hash) values (g.id, p_contact, p_hash, p_ip);
  return 'ok';
exception when unique_violation then return 'duplicate';
end $$;
revoke all on function public.nx_enter_giveaway(text, text, text, text) from public, anon, authenticated;
grant execute on function public.nx_enter_giveaway(text, text, text, text) to service_role;

-- Draw: staff + aal2 only; server clock; row-locked; one draw per giveaway; winners picked with the CSPRNG behind gen_random_uuid(); audited.
create or replace function public.nx_draw_giveaway(p_giveaway uuid) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare g public.giveaways; n int;
begin
  if not (public.nx_aal2() and (public.is_admin_or_ceo() or public.has_permission('manage_tournaments'))) then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into g from public.giveaways where id = p_giveaway for update;
  if not found then raise exception 'Giveaway not found'; end if;
  if g.status not in ('LIVE','ENDED') then raise exception 'Giveaway cannot be drawn in status %', g.status; end if;
  if now() < g.ends_at then raise exception 'Giveaway has not ended yet (server time)'; end if;
  if exists (select 1 from public.giveaway_winners where giveaway_id = p_giveaway) then raise exception 'Winners already selected'; end if;
  update public.giveaways set status = 'DRAWING' where id = p_giveaway;
  insert into public.giveaway_winners (giveaway_id, entry_id, selected_by)
    select p_giveaway, e.id, auth.uid() from public.giveaway_entries e where e.giveaway_id = p_giveaway order by gen_random_uuid() limit g.winners_count;
  get diagnostics n = row_count;
  update public.giveaways set status = case when n > 0 then 'WINNER_SELECTED' else 'ENDED' end where id = p_giveaway;
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata) values (auth.uid(), 'giveaway.draw', 'giveaway', p_giveaway, jsonb_build_object('winners', n, 'entries', g.entries_count));
  return n;
end $$;
revoke all on function public.nx_draw_giveaway(uuid) from public, anon;
grant execute on function public.nx_draw_giveaway(uuid) to authenticated;

-- Public: masked winners only (never the full contact)
create or replace function public.nx_giveaway_winners(p_slug text) returns table(masked text, selected_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select left(e.contact, 2) || '•••' || right(e.contact, 2), w.selected_at
  from public.giveaway_winners w join public.giveaway_entries e on e.id = w.entry_id join public.giveaways g on g.id = w.giveaway_id
  where g.slug = p_slug and g.status = 'WINNER_SELECTED' order by w.selected_at;
$$;
revoke all on function public.nx_giveaway_winners(text) from public;
grant execute on function public.nx_giveaway_winners(text) to anon, authenticated, service_role;
