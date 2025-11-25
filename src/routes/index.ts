import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { postsRouter } from '../modules/posts/posts.routes';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { getUserPostsSchema, getFeedSchema } from '../modules/posts/posts.validation';
import { postsController } from '../modules/posts/posts.controller';

export const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/posts', postsRouter);

// Special routes that don't fit the module structure
router.get(
  '/users/:id/posts',
  validate(getUserPostsSchema),
  postsController.getUserPosts.bind(postsController)
);

router.get(
  '/feed',
  authenticate,
  validate(getFeedSchema),
  postsController.getFeed.bind(postsController)
);
