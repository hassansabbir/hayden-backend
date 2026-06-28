import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as teeTimeService from './teeTime.service';

export const bulkCreateTeeTimes = catchAsync(async (req: Request, res: Response) => {
  const teeTimes = await teeTimeService.bulkCreateTeeTimes(req.user!.userId, req.body.schedules);
  sendResponse(res, { statusCode: 201, message: 'Tee times published successfully', data: teeTimes });
});

// Role-aware: club owners see their own course's slots, admins see every
// course's slots read-only — matches TeaTime.tsx's branch exactly.
export const listTeeTimes = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  const { teeTimes, meta } = isAdmin
    ? await teeTimeService.adminListAllTeeTimes(req.query)
    : await teeTimeService.listMyTeeTimes(req.user!.userId, req.query);

  sendResponse(res, { statusCode: 200, message: 'Tee times retrieved successfully', data: teeTimes, meta });
});

export const updateTeeTime = catchAsync(async (req: Request, res: Response) => {
  const teeTime = await teeTimeService.updateTeeTime(req.user!.userId, req.params.id, req.body);
  sendResponse(res, { statusCode: 200, message: 'Tee time updated successfully', data: teeTime });
});

export const deleteTeeTime = catchAsync(async (req: Request, res: Response) => {
  await teeTimeService.deleteTeeTime(req.user!.userId, req.params.id);
  sendResponse(res, { statusCode: 200, message: 'Tee time deleted successfully', data: null });
});
