import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { postsController } from './posts.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import {
  createPostSchema,
  getPostSchema,
  getFeedSchema,
  getUploadUrlSchema,
} from './posts.validation';

export const postsRouter: ExpressRouter = Router();

postsRouter.post(
  '/',
  authenticate,
  validate(createPostSchema),
  postsController.createPost.bind(postsController)
);

postsRouter.get(
  '/upload-url',
  authenticate,
  validate(getUploadUrlSchema),
  postsController.getUploadUrl.bind(postsController)
);

postsRouter.get('/:id', validate(getPostSchema), postsController.getPost.bind(postsController));

// Feed must come before /:id to avoid route conflicts
postsRouter.get(
  '/feed',
  authenticate,
  validate(getFeedSchema),
  postsController.getFeed.bind(postsController)
);

