import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from './error-handler';

export interface AuthPayload {
  userId: string;
  handle: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new HttpError(401, 'Invalid token', 'UNAUTHORIZED'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new HttpError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Silently ignore auth errors for optional auth
    next();
  }
};

