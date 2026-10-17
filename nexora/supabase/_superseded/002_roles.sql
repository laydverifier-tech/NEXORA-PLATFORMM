-- 002_roles: role catalogue + assignments. Roles are NEVER read from the client or from user_metadata.
create table public.roles (
  code        text primary key,
  label       text not null,
  description text
);
insert into public.roles (code, label, description) values
  ('SUPER_ADMIN','Super admin','Full access, can manage roles'),
  ('TOURNAMENT_ADMIN','Tournament admin','Tournaments, registrations, payments, rooms, results'),
  ('CONTENT_ADMIN','Content admin','News, media, giveaways content'),
  ('SPONSOR_MANAGER','Sponsor manager','Partners, campaigns, sponsor analytics'),
  ('CAPTAIN','Captain','Registers and manages their own squad'),
  ('PLAYER','Player','Squad member'),
  ('USER','User','Default authenticated user');

create table public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role_code  text not null references public.roles(code),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role_code)
);
create index user_roles_role_idx on public.user_roles (role_code);

alter table public.roles      enable row level security;
alter table public.user_roles enable row level security;

-- Authorization helpers. SECURITY DEFINER + empty search_path so they cannot be hijacked and avoid RLS recursion.
create or replace function public.has_role(_role text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role_code = _role);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role_code in ('SUPER_ADMIN','TOURNAMENT_ADMIN','CONTENT_ADMIN','SPONSOR_MANAGER')
  );
$$;

revoke all on function public.has_role(text) from public, anon;
revoke all on function public.is_admin()     from public, anon;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_admin()     to authenticated;

-- roles catalogue: readable by any signed-in user, writable by nobody via the API.
create policy "roles: read"            on public.roles for select to authenticated using (true);

-- user_roles: read your own; admins read all; ONLY SUPER_ADMIN may grant/revoke (no self-escalation).
create policy "user_roles: read own"   on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "user_roles: admin read" on public.user_roles for select to authenticated using (public.is_admin());
create policy "user_roles: super insert" on public.user_roles for insert to authenticated with check (public.has_role('SUPER_ADMIN'));
create policy "user_roles: super update" on public.user_roles for update to authenticated using (public.has_role('SUPER_ADMIN')) with check (public.has_role('SUPER_ADMIN'));
create policy "user_roles: super delete" on public.user_roles for delete to authenticated using (public.has_role('SUPER_ADMIN'));

create policy "profiles: admin read" on public.profiles for select to authenticated using (public.is_admin());

-- Signup trigger: profile + default USER role. Only display_name is taken from metadata (never a role).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare dn text;
begin
  dn := left(btrim(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))), 40);
  if char_length(dn) < 2 then dn := 'player'; end if;
  insert into public.profiles (id, display_name) values (new.id, dn);
  insert into public.user_roles (user_id, role_code) values (new.id, 'USER');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
