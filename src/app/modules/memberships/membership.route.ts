import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import * as membershipController from './membership.controller';
import { updateMembershipSchema } from './membership.validation';

const router = Router();

router.get('/mine', auth, membershipController.getMyMembership);
router.patch(
  '/mine',
  auth,
  validateRequest({ body: updateMembershipSchema }),
  membershipController.updateMyMembership
);

export const membershipRoutes = router;
