'use server';
import { crudDelete, crudSave } from '@/lib/admin/crud';
import { partnerSchema } from '@/lib/validation/admin2';
import type { FormState } from '@/types/forms';
export const savePartner = (_: FormState, fd: FormData) => crudSave(fd, { table: 'sponsors', schema: partnerSchema, entity: 'sponsor', path: '/admin/partners', label: (d) => d.name });
export async function deletePartner(fd: FormData) { await crudDelete(fd, { table: 'sponsors', entity: 'sponsor', path: '/admin/partners' }); }
