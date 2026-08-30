import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import express from 'express';
import { AppModule } from '../apps/api/src/app.module';
import { HttpExceptionFilter } from '../apps/api/src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../apps/api/src/common/interceptors/transform.interceptor';

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

    try {
      const uploadsPath = join(process.cwd(), 'apps/api/uploads');
      app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
    } catch {}
    try {
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

export default async function handler(req: express.Request, res: express.Response) {
  await getApp();
  return server(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
