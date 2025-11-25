import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'HTTP_ERROR';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
    },
    'Error occurred'
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors,
    });
  }

  // Handle custom HTTP errors
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as AppError & { code?: string };
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        code: 'CONFLICT',
        message: 'Resource already exists',
        details: prismaError.details,
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }
  }

  // Default server error
  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

