import { Router } from 'express';
import { optionalAuth } from '../../middlewares/optionalAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import * as paymentController from './payment.controller';
import { bookingIdParamSchema, createPaymentSchema } from './payment.validation';

const router = Router();

router.post(
  '/:bookingId',
  optionalAuth,
  validateRequest({ params: bookingIdParamSchema, body: createPaymentSchema }),
  paymentController.recordPayment
);

router.get(
  '/:bookingId',
  optionalAuth,
  validateRequest({ params: bookingIdParamSchema }),
  paymentController.getPaymentForBooking
);

export const paymentRoutes = router;
