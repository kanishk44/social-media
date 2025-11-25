import { z } from 'zod';

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const followUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const unfollowUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const getFollowersSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    offset: z
      .string()
      .optional()
      .default('0')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 0, 'Offset must be non-negative'),
    limit: z
      .string()
      .optional()
      .default('20')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

export const getFollowingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  query: z.object({
    offset: z
      .string()
      .optional()
      .default('0')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 0, 'Offset must be non-negative'),
    limit: z
      .string()
      .optional()
      .default('20')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

