'use client';
import { AdminForm } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { adminLogin } from './actions';

export function LoginForm({ next }: { next: string }) {
  return (
    <AdminForm action={adminLogin} submit="CONTINUE">
      {(s) => (<>
        <input type="hidden" name="next" value={next} />
        <Field name="email" label="Email" type="email" autoComplete="username" required error={s.fieldErrors?.email} />
        <Field name="password" label="Password" type="password" autoComplete="current-password" required error={s.fieldErrors?.password} />
      </>)}
    </AdminForm>
  );
}
