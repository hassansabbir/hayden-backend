import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from './user.constant';
import * as userController from './user.controller';
import {
  getUsersQuerySchema,
  updateMeSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from './user.validation';

const router = Router();

router.get('/me', auth, userController.getMe);
router.patch('/me', auth, validateRequest({ body: updateMeSchema }), userController.updateMe);

router.get(
  '/',
  auth,
  requireRole(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  validateRequest({ query: getUsersQuerySchema }),
  userController.getAllUsers
);

router.patch(
  '/:id/status',
  auth,
  requireRole(ROLE.SUPER_ADMIN, ROLE.ADMIN),
  validateRequest({ params: userIdParamSchema, body: updateUserStatusSchema }),
  userController.updateUserStatus
);

export const userRoutes = router;
