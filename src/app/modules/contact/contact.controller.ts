import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import * as contactService from './contact.service';

export const sendContactMessage = catchAsync(async (req: Request, res: Response) => {
  await contactService.sendContactMessage(req.body);
  sendResponse(res, { statusCode: 200, message: 'Your message has been sent successfully', data: null });
});
