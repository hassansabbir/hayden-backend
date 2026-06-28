import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.route';
import { userRoutes } from '../modules/users/user.route';
import { courseRoutes } from '../modules/golfCourses/course.route';
import { teeTimeRoutes } from '../modules/teeTimes/teeTime.route';
import { bookingRoutes } from '../modules/bookings/booking.route';
import { reviewRoutes } from '../modules/reviews/review.route';
import { membershipRoutes } from '../modules/memberships/membership.route';
import { paymentRoutes } from '../modules/payments/payment.route';
import { mediaRoutes } from '../modules/media/media.route';
import { notificationRoutes } from '../modules/notifications/notification.route';
import { dashboardRoutes } from '../modules/dashboard/dashboard.route';

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  { path: '/courses', route: courseRoutes },
  { path: '/courses/:id/reviews', route: reviewRoutes },
  { path: '/tee-times', route: teeTimeRoutes },
  { path: '/bookings', route: bookingRoutes },
  { path: '/memberships', route: membershipRoutes },
  { path: '/payments', route: paymentRoutes },
  { path: '/media', route: mediaRoutes },
  { path: '/notifications', route: notificationRoutes },
  { path: '/dashboard', route: dashboardRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export const apiRoutes = router;
