'use server';
import { crudDelete, crudSave } from '@/lib/admin/crud';
import { mediaSchema } from '@/lib/validation/admin2';
import type { FormState } from '@/types/forms';
export const saveMedia = (_: FormState, fd: FormData) => crudSave(fd, { table: 'media_items', schema: mediaSchema, entity: 'media', path: '/admin/media', label: (d) => d.title, map: (d) => ({ ...d, published_at: d.is_published ? new Date().toISOString() : null }) });
export async function deleteMedia(fd: FormData) { await crudDelete(fd, { table: 'media_items', entity: 'media', path: '/admin/media' }); }
