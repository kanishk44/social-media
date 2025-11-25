import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    handle: z
      .string()
      .min(3, 'Handle must be at least 3 characters')
      .max(30, 'Handle must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrHandle: z.string().min(1, 'Email or handle is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

