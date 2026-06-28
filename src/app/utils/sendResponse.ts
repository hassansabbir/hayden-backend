import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(res: Response, payload: Omit<SuccessResponse<T>, 'success'>): void => {
  res.status(payload.statusCode).json({
    success: true,
    statusCode: payload.statusCode,
    message: payload.message,
    data: payload.data,
    ...(payload.meta ? { meta: payload.meta } : {}),
  });
};
