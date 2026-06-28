import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as courseService from './course.service';

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.createCourseWithOwner(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 201, message: 'Club created successfully', data: course });
});

export const listPublicCourses = catchAsync(async (req: Request, res: Response) => {
  const { courses, meta } = await courseService.listPublicCourses(req.query);
  sendResponse(res, { statusCode: 200, message: 'Courses retrieved successfully', data: courses, meta });
});

export const listFeaturedCourses = catchAsync(async (_req: Request, res: Response) => {
  const courses = await courseService.listFeaturedCourses();
  sendResponse(res, { statusCode: 200, message: 'Featured courses retrieved successfully', data: courses });
});

export const getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.getCourseBySlug(req.params.slug);
  sendResponse(res, { statusCode: 200, message: 'Course retrieved successfully', data: course });
});

export const getMyCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.getMyCourse(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Course retrieved successfully', data: course });
});

export const updateMyCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.updateMyCourse(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 200, message: 'Course updated successfully', data: course });
});

export const adminListCourses = catchAsync(async (req: Request, res: Response) => {
  const { courses, meta } = await courseService.adminListCourses(req.query);
  sendResponse(res, { statusCode: 200, message: 'Clubs retrieved successfully', data: courses, meta });
});

export const approveCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.approveCourse(req.user!.userId, req.params.id, req.body.isFeatured);
  sendResponse(res, { statusCode: 200, message: 'Club approved successfully', data: course });
});
