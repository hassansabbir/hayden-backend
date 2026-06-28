import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwtHelpers';
import { Role } from '../modules/users/user.constant';

// For routes that work for both guests and logged-in users (e.g. creating a
// booking) — attaches req.user if a valid token is present, but never throws.
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token, env.JWT_ACCESS_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role as Role,
      mustResetPassword: Boolean(decoded.mustResetPassword),
    };
  } catch {
    // Invalid/expired token on an optional route — proceed as a guest rather than failing the request.
  }

  next();
};
