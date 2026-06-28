import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import * as notificationController from './notification.controller';
import { listNotificationsQuerySchema, notificationIdParamSchema } from './notification.validation';

const router = Router();

router.get(
  '/',
  auth,
  validateRequest({ query: listNotificationsQuerySchema }),
  notificationController.listMyNotifications
);

router.patch(
  '/:id/read',
  auth,
  validateRequest({ params: notificationIdParamSchema }),
  notificationController.markNotificationRead
);

export const notificationRoutes = router;
