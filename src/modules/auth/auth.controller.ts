import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, handle, name, password } = req.body as {
        email: string;
        handle: string;
        name: string;
        password: string;
      };

      const result = await authService.register({
        email,
        handle,
        name,
        password,
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { emailOrHandle, password } = req.body as {
        emailOrHandle: string;
        password: string;
      };

      const result = await authService.login({
        emailOrHandle,
        password,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

