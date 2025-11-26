import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { registerSchema, loginSchema } from './auth.validation';

export const authRouter: ExpressRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController)
);

authRouter.post('/login', validate(loginSchema), authController.login.bind(authController));

