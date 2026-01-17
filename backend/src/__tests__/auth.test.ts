import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Auth API', () => {
  const testUser = {
    email: `test-${Date.now()}@edu.vamk.fi`,
    password: 'Test123!',
    firstName: 'Testi',
    lastName: 'Käyttäjä',
  };

  describe('POST /api/auth/register', () => {
    it('pitäisi rekisteröidä uusi käyttäjä onnistuneesti', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.role).toBe('STUDENT');
      expect(response.body.data.password).toBeUndefined();
    });

    it('pitäisi hylätä rekisteröinti jos sähköposti on jo käytössä', async () => {
      // Rekisteröi ensin
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Yritä uudelleen samalla sähköpostilla
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('pitäisi hylätä rekisteröinti jos salasana on liian heikko', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: `test-weak-${Date.now()}@edu.vamk.fi`,
          password: '123', // Liian heikko
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('pitäisi hylätä rekisteröinti jos sähköposti on virheellinen', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Luo testikäyttäjä ennen kirjautumistestejä
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('pitäisi kirjata käyttäjä sisään oikeilla tunnuksilla', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('pitäisi hylätä kirjautuminen väärällä salasanalla', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('pitäisi hylätä kirjautuminen jos käyttäjää ei ole', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@edu.vamk.fi',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Rekisteröi ja kirjaudu saadaksesi refresh tokenin
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('pitäisi palauttaa uusi access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('pitäisi hylätä virheellinen refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
