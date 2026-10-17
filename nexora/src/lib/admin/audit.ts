import 'server-only';
import type { AdminCtx } from './context';

/** Writes to activity_logs AS the admin (RLS: actor_id must equal auth.uid()). Never pass secrets in metadata. */
export async function audit(ctx: AdminCtx, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  const id = entityId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId) ? entityId : null;
  const { error } = await ctx.supabase.from('activity_logs').insert({ actor_id: ctx.user.id, action, entity_type: entityType, entity_id: id, metadata });
  if (error) console.error('[audit]', error.message);
}
