import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as membershipService from './membership.service';

export const getMyMembership = catchAsync(async (req: Request, res: Response) => {
  const membership = await membershipService.getMyMembership(req.user!.userId);
  sendResponse(res, { statusCode: 200, message: 'Membership retrieved successfully', data: membership });
});

export const updateMyMembership = catchAsync(async (req: Request, res: Response) => {
  const membership = await membershipService.updateMyMembership(req.user!.userId, req.body.tier);
  sendResponse(res, { statusCode: 200, message: 'Membership updated successfully', data: membership });
});
