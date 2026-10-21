import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const logger = new Logger('Bootstrap');

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'Range',
      'X-Organization-Id',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`LeadOps API running on http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application', error);
  process.exit(1);
});
