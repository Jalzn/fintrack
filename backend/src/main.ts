import 'reflect-metadata';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { FastifyRequest } from 'fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 12 * 1024 * 1024 }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  await app.register(helmet);
  await app.register(rateLimit, {
    max: (req: FastifyRequest) => (req.url?.startsWith('/api/auth') ? 10 : 60),
    timeWindow: '1 minute',
  });
  await app.register(fastifyCookie);

  const corsOrigins = process.env['CORS_ORIGINS'] ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env['PORT'] ? Number(process.env['PORT']) : 3000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
