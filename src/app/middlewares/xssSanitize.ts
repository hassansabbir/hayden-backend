import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

// xss-clean is unmaintained; this recursively sanitizes string fields in
// body/params/query using the actively maintained `xss` package instead.
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, sanitizeValue(val)])
    );
  }
  return value;
};

export const xssSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params) as typeof req.params;
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  next();
};
