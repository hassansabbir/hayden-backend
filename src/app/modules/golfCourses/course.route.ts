import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/requireRole';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../users/user.constant';
import * as courseController from './course.controller';
import {
  adminListCoursesQuerySchema,
  approveCourseSchema,
  courseIdParamSchema,
  courseSlugParamSchema,
  createCourseSchema,
  listCoursesQuerySchema,
  updateMyCourseSchema,
  getPublicTeeTimesQuerySchema,
} from './course.validation';

const router = Router();

router.get('/', validateRequest({ query: listCoursesQuerySchema }), courseController.listPublicCourses);
router.get('/featured', courseController.listFeaturedCourses);

router.get(
  '/admin/all',
  auth,
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest({ query: adminListCoursesQuerySchema }),
  courseController.adminListCourses
);

router.post(
  '/',
  auth,
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest({ body: createCourseSchema }),
  courseController.createCourse
);

router.patch(
  '/:id/approve',
  auth,
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateRequest({ params: courseIdParamSchema, body: approveCourseSchema }),
  courseController.approveCourse
);

router.get('/mine', auth, requireRole(ROLE.COURSE_MANAGER), courseController.getMyCourse);
router.patch(
  '/mine',
  auth,
  requireRole(ROLE.COURSE_MANAGER),
  validateRequest({ body: updateMyCourseSchema }),
  courseController.updateMyCourse
);

router.get(
  '/:slug/tee-times',
  validateRequest({ params: courseSlugParamSchema, query: getPublicTeeTimesQuerySchema }),
  courseController.getPublicTeeTimes
);

// Slug route last — it's a public catch-most path among GET /courses/*.
router.get('/:slug', validateRequest({ params: courseSlugParamSchema }), courseController.getCourseBySlug);

export const courseRoutes = router;
