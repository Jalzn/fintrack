import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeApp, createApp } from './setup/app';

describe('Auth (E2E)', () => {
  let app: NestFastifyApplication;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    app = await createApp();
    request = supertest(app.getHttpAdapter().getInstance().server);
  });

  afterAll(async () => {
    await closeApp();
  });

  describe('POST /auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const res = await request.post('/auth/register').send({
        email: 'test@example.com',
        password: 'Password1!',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: { email: 'test@example.com' },
      });
    });

    it('returns 409 when email is already taken', async () => {
      await request
        .post('/auth/register')
        .send({ email: 'dupe@example.com', password: 'Password1!' });
      const res = await request
        .post('/auth/register')
        .send({ email: 'dupe@example.com', password: 'Password1!' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_ALREADY_TAKEN');
    });

    it('returns 400 for weak password (no uppercase)', async () => {
      const res = await request
        .post('/auth/register')
        .send({ email: 'weak@example.com', password: 'password1!' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for weak password (no number)', async () => {
      const res = await request
        .post('/auth/register')
        .send({ email: 'weak@example.com', password: 'Password!' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for weak password (no special char)', async () => {
      const res = await request
        .post('/auth/register')
        .send({ email: 'weak@example.com', password: 'Password1' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const email = 'logintest@example.com';
    const password = 'Login1Pass!';

    beforeAll(async () => {
      await request.post('/auth/register').send({ email, password });
    });

    it('returns tokens on valid credentials', async () => {
      const res = await request.post('/auth/login').send({ email, password });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('returns 401 on wrong password', async () => {
      const res = await request.post('/auth/login').send({ email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await request.post('/auth/login').send({ email: 'noone@example.com', password });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues new tokens and rotates refresh token', async () => {
      const reg = await request.post('/auth/register').send({
        email: 'refresh@example.com',
        password: 'Refresh1!',
      });
      const { refreshToken } = reg.body as { refreshToken: string };

      const res = await request.post('/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.refreshToken).not.toBe(refreshToken);
      expect(res.body.accessToken).toBeTruthy();
    });

    it('returns 401 for reused refresh token (rotation)', async () => {
      const reg = await request.post('/auth/register').send({
        email: 'rotation@example.com',
        password: 'Rotation1!',
      });
      const { refreshToken } = reg.body as { refreshToken: string };

      await request.post('/auth/refresh').send({ refreshToken });
      const res = await request.post('/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(401);
    });
  });
});
