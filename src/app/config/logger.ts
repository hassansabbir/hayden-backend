import path from 'path';
import util from 'util';
import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const { stack, ...restMeta } = meta;

    let metaString = '';
    if (Object.keys(restMeta).length) {
      const inspected = util.inspect(restMeta, { colors: true, depth: null });
      metaString = `\n  Metadata: ${inspected.split('\n').join('\n  ')}`;
    }

    let stackString = '';
    if (stack) {
      stackString = `\n  Stack:\n  ${String(stack).split('\n').join('\n  ')}`;
    }

    return `[${ts}] ${level}: ${message}${metaString}${stackString}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat }),
];

// File transports only in dev — Vercel's serverless filesystem is read-only.
if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({ filename: path.join('logs', 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join('logs', 'combined.log') }),
  );
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), json()),
  transports,
});

export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
