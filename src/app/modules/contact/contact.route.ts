import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import * as contactController from './contact.controller';
import { sendContactMessageSchema } from './contact.validation';

const router = Router();

// Public endpoint (no auth — anonymous visitors use this) but rate-limited
// like the other unauthenticated/abuse-sensitive endpoints since each hit
// triggers a real outbound email send.
router.post(
  '/',
  authRateLimiter,
  validateRequest({ body: sendContactMessageSchema }),
  contactController.sendContactMessage
);

export const contactRoutes = router;
