import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { optionalAuth } from '../../middlewares/optionalAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../users/user.constant';
import * as bookingController from './booking.controller';
import {
  bookingIdParamSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  lookupBookingQuerySchema,
} from './booking.validation';

const router = Router();

router.post(
  '/',
  optionalAuth,
  validateRequest({ body: createBookingSchema }),
  bookingController.createBooking
);

router.get(
  '/lookup',
  validateRequest({ query: lookupBookingQuerySchema }),
  bookingController.lookupBooking
);

router.get(
  '/mine',
  auth,
  validateRequest({ query: listBookingsQuerySchema }),
  bookingController.listMyBookings
);

router.get(
  '/',
  auth,
  requireRole(ROLE.COURSE_MANAGER, ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest({ query: listBookingsQuerySchema }),
  bookingController.listBookingsForStaff
);

router.patch(
  '/:id/confirm',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ params: bookingIdParamSchema }),
  bookingController.confirmBooking
);

router.patch(
  '/:id/decline',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ params: bookingIdParamSchema }),
  bookingController.declineBooking
);

router.patch(
  '/:id/cancel',
  auth,
  validateRequest({ params: bookingIdParamSchema }),
  bookingController.cancelMyBooking
);

export const bookingRoutes = router;
