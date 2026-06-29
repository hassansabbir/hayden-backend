import { Server } from 'http';
import app from './app';
import { env } from './app/config/env';
import { connectDB } from './app/config/database';
import { logger } from './app/config/logger';
import { printTerminalDashboard } from './app/utils/terminalVisual';
import { seedSuperAdmin } from './app/utils/seedSuperAdmin';



let server: Server;

const bootstrap = async (): Promise<void> => {
  await connectDB();
  const superAdminStatus = await seedSuperAdmin();

  server = app.listen(env.PORT, () => {
    logger.info(`Tee-It-Up backend listening on port ${env.PORT} (${env.NODE_ENV})`);
    printTerminalDashboard(env.PORT, env.NODE_ENV, superAdminStatus);
  });
};

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server?.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  server?.close(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

bootstrap();
