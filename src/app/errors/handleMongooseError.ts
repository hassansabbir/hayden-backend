import mongoose from 'mongoose';
import { ErrorDetail } from './AppError';

interface GenericErrorResponse {
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
}

export const handleValidationError = (
  error: mongoose.Error.ValidationError
): GenericErrorResponse => {
  const errors: ErrorDetail[] = Object.values(error.errors).map((issue) => ({
    field: issue.path,
    message: issue.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation Error',
    errors,
  };
};

export const handleCastError = (error: mongoose.Error.CastError): GenericErrorResponse => {
  return {
    statusCode: 400,
    message: 'Invalid Identifier',
    errors: [{ field: error.path, message: `Invalid value for ${error.path}: ${error.value}` }],
  };
};

interface MongoDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}

export const isDuplicateKeyError = (error: unknown): error is MongoDuplicateKeyError => {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
};

export const handleDuplicateKeyError = (error: MongoDuplicateKeyError): GenericErrorResponse => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];

  return {
    statusCode: 409,
    message: 'Duplicate Entry',
    errors: [{ field, message: `${field} '${value}' already exists` }],
  };
};
