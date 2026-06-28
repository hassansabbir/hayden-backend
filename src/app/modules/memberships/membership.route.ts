import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../users/user.constant';
import * as membershipController from './membership.controller';
import { updateMembershipSchema } from './membership.validation';

const router = Router();

router.get('/mine', auth, requireRole(ROLE.USER), membershipController.getMyMembership);
router.patch(
  '/mine',
  auth,
  requireRole(ROLE.USER),
  validateRequest({ body: updateMembershipSchema }),
  membershipController.updateMyMembership
);

export const membershipRoutes = router;
