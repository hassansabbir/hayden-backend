import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../users/user.constant';
import * as teeTimeController from './teeTime.controller';
import {
  bulkCreateTeeTimesSchema,
  listTeeTimesQuerySchema,
  teeTimeIdParamSchema,
  updateTeeTimeSchema,
} from './teeTime.validation';

const router = Router();

router.get(
  '/',
  auth,
  requireRole(ROLE.COURSE_MANAGER, ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest({ query: listTeeTimesQuerySchema }),
  teeTimeController.listTeeTimes
);

router.post(
  '/bulk',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ body: bulkCreateTeeTimesSchema }),
  teeTimeController.bulkCreateTeeTimes
);

router.patch(
  '/:id',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ params: teeTimeIdParamSchema, body: updateTeeTimeSchema }),
  teeTimeController.updateTeeTime
);

router.delete(
  '/:id',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ params: teeTimeIdParamSchema }),
  teeTimeController.deleteTeeTime
);

export const teeTimeRoutes = router;
