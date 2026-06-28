import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AppError } from '../../errors/AppError';
import * as mediaService from './media.service';

export const uploadMedia = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'No file was uploaded');

  const media = await mediaService.uploadMedia(
    {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    },
    {
      type: req.body.type,
      relatedTo: req.body.relatedTo,
      relatedModel: req.body.relatedModel,
      uploadedBy: req.user!.userId,
    }
  );

  sendResponse(res, { statusCode: 201, message: 'File uploaded successfully', data: media });
});

export const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  await mediaService.deleteMedia(req.params.id);
  sendResponse(res, { statusCode: 200, message: 'File deleted successfully', data: null });
});
