import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as notificationService from './notification.service';

export const listMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const { notifications, meta } = await notificationService.listMyNotifications(req.user!.userId, req.query);
  sendResponse(res, { statusCode: 200, message: 'Notifications retrieved successfully', data: notifications, meta });
});

export const markNotificationRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markNotificationRead(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Notification marked as read', data: null });
});
