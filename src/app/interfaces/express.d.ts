import { Role } from '../modules/users/user.constant';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        mustResetPassword: boolean;
      };
    }
  }
}
