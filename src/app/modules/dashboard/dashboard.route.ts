import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { ROLE } from '../users/user.constant';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(auth, requireRole(ROLE.COURSE_MANAGER, ROLE.ADMIN, ROLE.SUPER_ADMIN));

router.get('/stats', dashboardController.getStats);
router.get('/requests-overview', dashboardController.getRequestsOverview);
router.get('/booking-status', dashboardController.getBookingStatusBreakdown);
router.get('/tee-time-utilization', dashboardController.getTeeTimeUtilization);

export const dashboardRoutes = router;
