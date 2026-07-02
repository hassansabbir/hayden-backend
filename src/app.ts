import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { env } from './app/config/env';
import { morganStream } from './app/config/logger';
import { apiRateLimiter } from './app/middlewares/rateLimiter';
import { xssSanitize } from './app/middlewares/xssSanitize';
import { notFoundHandler } from './app/middlewares/notFoundHandler';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { apiRoutes } from './app/routes';
import { getLandingPageHtml } from './app/utils/landingPageHtml';


const app: Application = express();

app.set('trust proxy', true);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    // /uploads is served by this same app and is meant to be loaded by the
    // website/dashboard frontends, which run on different ports/origins.
    // Helmet's default "same-origin" policy blocks <img> loads cross-origin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: [
      env.CLIENT_WEBSITE_URL,
      env.CLIENT_DASHBOARD_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://sabbir3000.naimulhassan.me",
      "https://sabbir3001.naimulhassan.me"
    ],
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use(mongoSanitize());
app.use(hpp());
app.use(xssSanitize);

app.use(apiRateLimiter);

app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get('/', (_req, res) => {
  res.send(getLandingPageHtml(env.PORT, env.NODE_ENV));
});

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, statusCode: 200, message: 'OK', data: { uptime: process.uptime() } });
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
