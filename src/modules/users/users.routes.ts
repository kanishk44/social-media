import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import {
  getUserSchema,
  followUserSchema,
  unfollowUserSchema,
  getFollowersSchema,
  getFollowingSchema,
} from './users.validation';

export const usersRouter: ExpressRouter = Router();

usersRouter.get('/:id', validate(getUserSchema), usersController.getUser.bind(usersController));

usersRouter.post(
  '/:id/follow',
  authenticate,
  validate(followUserSchema),
  usersController.followUser.bind(usersController)
);

usersRouter.delete(
  '/:id/follow',
  authenticate,
  validate(unfollowUserSchema),
  usersController.unfollowUser.bind(usersController)
);

usersRouter.get(
  '/:id/followers',
  validate(getFollowersSchema),
  usersController.getFollowers.bind(usersController)
);

usersRouter.get(
  '/:id/following',
  validate(getFollowingSchema),
  usersController.getFollowing.bind(usersController)
);

