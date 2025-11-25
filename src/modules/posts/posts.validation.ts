import { z } from 'zod';

export const createPostSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, 'Post text is required')
      .max(2000, 'Post text must be at most 2000 characters'),
    mediaUrl: z.string().url('Invalid media URL').optional(),
  }),
});

export const getPostSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Post ID is required'),
  }),
});

export const getUserPostsSchema = z.object({
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

export const getFeedSchema = z.object({
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

export const getUploadUrlSchema = z.object({
  query: z.object({
    ext: z.enum(['png', 'jpg', 'jpeg', 'gif', 'mp4'], {
      errorMap: () => ({ message: 'Extension must be png, jpg, jpeg, gif, or mp4' }),
    }),
  }),
});

