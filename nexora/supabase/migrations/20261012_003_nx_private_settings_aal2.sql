-- (applied) private_settings (payment WhatsApp number, Discord webhook) also require a 2-step-verified session for privileged users.
do $$
declare c text; cond text := '(public.nx_aal2() or not public.nx_is_privileged())';
begin
  foreach c in array array['select','insert','update','delete'] loop
    execute format('drop policy if exists %I on public.private_settings', 'nx aal2 ' || c);
    if c = 'insert' then execute format('create policy %I on public.private_settings as restrictive for insert to authenticated with check %s', 'nx aal2 ' || c, cond);
    elsif c = 'update' then execute format('create policy %I on public.private_settings as restrictive for update to authenticated using %s with check %s', 'nx aal2 ' || c, cond, cond);
    else execute format('create policy %I on public.private_settings as restrictive for %s to authenticated using %s', 'nx aal2 ' || c, c, cond); end if;
  end loop;
end $$;
