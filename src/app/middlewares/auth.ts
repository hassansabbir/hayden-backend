import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwtHelpers';
import { Role } from '../modules/users/user.constant';

export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  const decoded = verifyToken(token, env.JWT_ACCESS_SECRET);
  req.user = {
    userId: decoded.userId,
    role: decoded.role as Role,
    mustResetPassword: Boolean(decoded.mustResetPassword),
  };

  // Admin-provisioned accounts must reset their temporary password before
  // touching anything else — change-password is the one route exempted.
  const isChangePasswordRoute = req.originalUrl.endsWith('/auth/change-password');
  if (req.user.mustResetPassword && !isChangePasswordRoute) {
    throw new AppError(403, 'You must change your password before continuing');
  }

  next();
};
