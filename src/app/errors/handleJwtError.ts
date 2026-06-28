import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ErrorDetail } from './AppError';

interface GenericErrorResponse {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
}

export const handleJwtError = (
  error: JsonWebTokenError | TokenExpiredError
): GenericErrorResponse => {
  const message = error instanceof TokenExpiredError ? 'Session expired, please log in again' : 'Invalid authentication token';

  return {
    statusCode: 401,
    message,
    errors: [{ field: 'token', message }],
  };
};
