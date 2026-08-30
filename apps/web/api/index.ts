import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import express from 'express';
import { AppModule } from '../../api/src/app.module';
import { HttpExceptionFilter } from '../../api/src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../api/src/common/interceptors/transform.interceptor';

const server = express();
let app: NestExpressApplication | null = null;
let initPromise: Promise<void> | null = null;

async function getApp(): Promise<NestExpressApplication> {
  if (app) return app;
  if (initPromise) {
    await initPromise;
    return app!;
  }
  initPromise = (async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server), {
      logger: ['error', 'warn', 'log'],
    });

    // uploads — on Vercel filesystem is ephemeral, but keep for compat
    // In serverless, process.cwd() may be /var/task; uploads dir may not exist
    try {
      const uploadsPath = join(process.cwd(), 'apps/api/uploads');
      app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
    } catch {
      // ignore if path not found
    }
    try {
      // also try alternative path for Vercel root
      const alt = join(process.cwd(), 'uploads');
      app.useStaticAssets(alt, { prefix: '/uploads/' });
    } catch {}

    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? true,
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  })();
  await initPromise;
  return app!;
}

// Vercel serverless handler - hono/bridge via express
export default async function handler(req: express.Request, res: express.Response) {
  const nestApp = await getApp();
  // Let express handle it - the Nest app is attached to `server`
  // Attach req/res to express server
  return server(req, res);
}

// Allow large payloads for uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
