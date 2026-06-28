import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as userService from './user.service';
import { getUsersQuerySchema } from './user.validation';
import { z } from 'zod';

type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Profile retrieved successfully', data: user });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.userId, req.body);
  sendResponse(res, { statusCode: 200, message: 'Profile updated successfully', data: user });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { users, meta } = await userService.getAllUsers(req.query as GetUsersQuery);
  sendResponse(res, { statusCode: 200, message: 'Users retrieved successfully', data: users, meta });
});

export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserStatus(req.user!.userId, req.params.id, req.body.isActive);
  sendResponse(res, { statusCode: 200, message: 'User status updated successfully', data: user });
});
