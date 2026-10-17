import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email').max(254);
const password = z.string().min(10, 'At least 10 characters').max(128)
  .regex(/[a-z]/, 'Needs a lowercase letter').regex(/[A-Z]/, 'Needs an uppercase letter').regex(/\d/, 'Needs a number');

export const loginSchema = z.object({ email, password: z.string().min(1).max(128), next: z.string().optional() });
export const registerSchema = z.object({
  email, password,
  displayName: z.string().trim().min(2, 'Too short').max(40).regex(/^[\p{L}\p{N} ._-]+$/u, 'Letters, numbers, space . _ - only'),
});
export const resetSchema = z.object({ email });
