import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import * as authController from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionIdParamSchema,
  verifyOtpSchema,
} from './auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
router.post(
  '/verify-otp',
  authRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  authController.verifyOtp
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword
);

router.post(
  '/change-password',
  auth,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword
);

router.get('/sessions', auth, authController.listSessions);
router.delete(
  '/sessions/:id',
  auth,
  validateRequest({ params: sessionIdParamSchema }),
  authController.revokeSession
);

export const authRoutes = router;
