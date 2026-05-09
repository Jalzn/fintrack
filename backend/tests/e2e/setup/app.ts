import 'reflect-metadata';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';

let app: NestFastifyApplication | undefined;

export async function createApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.register(helmet);
  await app.register(rateLimit, { global: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

export async function closeApp(): Promise<void> {
  await app?.close();
  app = undefined;
}
