export const ROLES = ['SUPER_ADMIN','TOURNAMENT_ADMIN','CONTENT_ADMIN','SPONSOR_MANAGER','CAPTAIN','PLAYER','USER'] as const;
export type AppRole = (typeof ROLES)[number];
/** Roles allowed into /admin. Fine-grained per-module permissions are enforced again in RLS + server actions. */
export const ADMIN_ROLES: readonly AppRole[] = ['SUPER_ADMIN','TOURNAMENT_ADMIN','CONTENT_ADMIN','SPONSOR_MANAGER'];
export const CAPTAIN_ROLES: readonly AppRole[] = ['CAPTAIN','SUPER_ADMIN','TOURNAMENT_ADMIN'];
