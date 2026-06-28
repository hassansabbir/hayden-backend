import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as dashboardService from './dashboard.service';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await dashboardService.getStats(req.user!.userId, req.user!.role);
  sendResponse(res, { statusCode: 200, message: 'Dashboard stats retrieved successfully', data: stats });
});

export const getRequestsOverview = catchAsync(async (req: Request, res: Response) => {
  const overview = await dashboardService.getRequestsOverview(req.user!.userId, req.user!.role);
  sendResponse(res, { statusCode: 200, message: 'Requests overview retrieved successfully', data: overview });
});

export const getBookingStatusBreakdown = catchAsync(async (req: Request, res: Response) => {
  const breakdown = await dashboardService.getBookingStatusBreakdown(req.user!.userId, req.user!.role);
  sendResponse(res, { statusCode: 200, message: 'Booking status breakdown retrieved successfully', data: breakdown });
});

export const getTeeTimeUtilization = catchAsync(async (req: Request, res: Response) => {
  const utilization = await dashboardService.getTeeTimeUtilization(req.user!.userId, req.user!.role);
  sendResponse(res, { statusCode: 200, message: 'Tee time utilization retrieved successfully', data: utilization });
});
