import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/config/roles';

/** Authenticated user (validated against Supabase Auth) or null. */
export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Roles are derived SERVER-SIDE from the database (existing schema): profiles.role (CEO/ADMIN/ORGANIZER/USER)
 * + teams.captain_id. Never from client input or user_metadata. RLS limits each user to their own rows.
 */
const ROLE_MAP: Record<string, AppRole[]> = {
  CEO: ['SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'CONTENT_ADMIN', 'SPONSOR_MANAGER'],
  ADMIN: ['TOURNAMENT_ADMIN', 'CONTENT_ADMIN', 'SPONSOR_MANAGER'],
  ORGANIZER: ['TOURNAMENT_ADMIN'],
  USER: ['USER'],
};
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const supabase = createClient();
  const { data: profile } = await supabase.from('profiles').select('role, team_id').eq('id', userId).limit(1);
  const p = profile?.[0];
  if (!p) return [];
  const roles = new Set<AppRole>(ROLE_MAP[String(p.role)] ?? ['USER']);
  if (p.team_id) roles.add('PLAYER');
  const { data: team } = await supabase.from('teams').select('id').eq('captain_id', userId).limit(1);
  if (team && team.length > 0) roles.add('CAPTAIN');
  return [...roles];
}

export async function requireUser(nextPath = '/') {
  const user = await getUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Returns { user, roles } if the user holds at least one allowed role, otherwise { user, roles, allowed:false } (caller renders 403). */
export async function checkRole(allowed: readonly AppRole[], nextPath: string) {
  const user = await requireUser(nextPath);
  const roles = await getUserRoles(user.id);
  return { user, roles, allowed: roles.some((r) => allowed.includes(r)) };
}
