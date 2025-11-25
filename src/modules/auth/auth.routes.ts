import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { registerSchema, loginSchema } from './auth.validation';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController)
);

authRouter.post('/login', validate(loginSchema), authController.login.bind(authController));

