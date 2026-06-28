import { ZodError } from 'zod';
import { ErrorDetail } from './AppError';

interface GenericErrorResponse {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
}

export const handleZodError = (error: ZodError): GenericErrorResponse => {
  const errors: ErrorDetail[] = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation Error',
    errors,
  };
};
