'use server';
import { crudDelete, crudSave } from '@/lib/admin/crud';
import { hofSchema } from '@/lib/validation/admin2';
import type { FormState } from '@/types/forms';
export const saveHof = (_: FormState, fd: FormData) => crudSave(fd, { table: 'hall_of_fame', schema: hofSchema, entity: 'hall_of_fame', path: '/admin/hall-of-fame', label: (d) => `${d.tournament_name} — ${d.winner}` });
export async function deleteHof(fd: FormData) { await crudDelete(fd, { table: 'hall_of_fame', entity: 'hall_of_fame', path: '/admin/hall-of-fame' }); }
