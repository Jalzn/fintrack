import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeApp, createApp } from './setup/app';

async function registerAndLogin(
  request: ReturnType<typeof supertest>,
  email: string,
): Promise<string> {
  const res = await request.post('/auth/register').send({ email, password: 'ValidPass1!' });
  return (res.body as { accessToken: string }).accessToken;
}

describe('Transactions & Categories (E2E)', () => {
  let app: NestFastifyApplication;
  let request: ReturnType<typeof supertest>;
  let token: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createApp();
    request = supertest(app.getHttpAdapter().getInstance().server);
    token = await registerAndLogin(request, 'txuser@example.com');

    const catRes = await request
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salary', color: '#00FF00', type: 'INCOME' });
    categoryId = (catRes.body as { id: string }).id;
  });

  afterAll(async () => {
    await closeApp();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request.get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', db: 'ok' });
    });
  });

  describe('Categories', () => {
    it('creates a category', async () => {
      const res = await request
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', color: '#FF5733', type: 'EXPENSE' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Food', color: '#FF5733', type: 'EXPENSE' });
    });

    it('lists categories', async () => {
      const res = await request.get('/categories').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('updates a category', async () => {
      const create = await request
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old Name', color: '#AAAAAA', type: 'EXPENSE' });
      const id = (create.body as { id: string }).id;

      const res = await request
        .put(`/categories/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', color: '#BBBBBB' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'New Name', color: '#BBBBBB' });
    });

    it('returns 401 without token', async () => {
      const res = await request.get('/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('Transactions', () => {
    it('creates a transaction', async () => {
      const res = await request.post('/transactions').set('Authorization', `Bearer ${token}`).send({
        amountMinorUnits: 100000,
        currencyCode: 'BRL',
        type: 'INCOME',
        categoryId,
        description: 'Monthly salary',
        date: '2025-01-01',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        description: 'Monthly salary',
        type: 'INCOME',
      });
    });

    it('lists transactions with pagination', async () => {
      const res = await request
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: expect.any(Array), total: expect.any(Number) });
    });

    it('updates a transaction', async () => {
      const create = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amountMinorUnits: 5000,
          currencyCode: 'BRL',
          type: 'INCOME',
          categoryId,
          description: 'To be updated',
          date: '2025-02-01',
        });
      const id = (create.body as { id: string }).id;

      const res = await request
        .put(`/transactions/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated description', amountMinorUnits: 9999 });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated description');
    });

    it('calculates balance', async () => {
      const res = await request
        .get('/transactions/balance')
        .set('Authorization', `Bearer ${token}`)
        .query({ startDate: '2025-01-01', endDate: '2025-12-31', currencyCode: 'BRL' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ income: expect.any(Object), expense: expect.any(Object) });
    });

    it('deletes a transaction', async () => {
      const create = await request
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amountMinorUnits: 1000,
          currencyCode: 'BRL',
          type: 'EXPENSE',
          categoryId,
          description: 'To delete',
          date: '2025-03-01',
        });
      const id = (create.body as { id: string }).id;

      const del = await request
        .delete(`/transactions/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(del.status).toBe(204);

      const get = await request.get(`/transactions/${id}`).set('Authorization', `Bearer ${token}`);
      expect(get.status).toBe(404);
    });

    it('returns 404 for non-existent transaction', async () => {
      const res = await request
        .get('/transactions/non-existent-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('does not leak transactions between users', async () => {
      const otherToken = await registerAndLogin(request, 'otheruser@example.com');
      const res = await request.get('/transactions').set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(200);
      expect((res.body as { total: number }).total).toBe(0);
    });
  });
});
