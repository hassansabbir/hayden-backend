import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { Role } from '../modules/users/user.constant';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};
