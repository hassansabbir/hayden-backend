import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError, ErrorDetail } from '../errors/AppError';
import { handleZodError } from '../errors/handleZodError';
import {
  handleCastError,
  handleDuplicateKeyError,
  handleValidationError,
  isDuplicateKeyError,
} from '../errors/handleMongooseError';
import { handleJwtError } from '../errors/handleJwtError';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errors: ErrorDetail[] | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof ZodError) {
    const formatted = handleZodError(error);
    statusCode = formatted.statusCode;
    message = formatted.message;
    errors = formatted.errors;
  } else if (error instanceof mongoose.Error.ValidationError) {
    const formatted = handleValidationError(error);
    statusCode = formatted.statusCode;
    message = formatted.message;
    errors = formatted.errors;
  } else if (error instanceof mongoose.Error.CastError) {
    const formatted = handleCastError(error);
    statusCode = formatted.statusCode;
    message = formatted.message;
    errors = formatted.errors;
  } else if (isDuplicateKeyError(error)) {
    const formatted = handleDuplicateKeyError(error);
    statusCode = formatted.statusCode;
    message = formatted.message;
    errors = formatted.errors;
  } else if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
    const formatted = handleJwtError(error);
    statusCode = formatted.statusCode;
    message = formatted.message;
    errors = formatted.errors;
  } else if (error instanceof Error) {
    // Unanticipated error — never leak the real message/stack to the client in production.
    message = env.NODE_ENV === 'production' ? message : error.message;
  }

  logger.error(message, {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors ? { errors } : {}),
  });
};
