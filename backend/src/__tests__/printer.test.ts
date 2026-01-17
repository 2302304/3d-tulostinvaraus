import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Printer API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Kirjaudu admin-käyttäjänä (oletetaan että seed on ajettu)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@vamk.fi',
        password: 'Admin123!',
      });

    adminToken = adminLogin.body.data?.accessToken;

    // Luo ja kirjaudu tavallisena käyttäjänä
    const userEmail = `test-printer-${Date.now()}@edu.vamk.fi`;
    await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'Test123!',
        firstName: 'Testi',
        lastName: 'Käyttäjä',
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: 'Test123!',
      });

    userToken = userLogin.body.data?.accessToken;
  });

  describe('GET /api/printers', () => {
    it('pitäisi palauttaa tulostimet kirjautuneelle käyttäjälle', async () => {
      const response = await request(app)
        .get('/api/printers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('pitäisi palauttaa tulostimet myös ilman tokenia (julkinen endpoint)', async () => {
      const response = await request(app)
        .get('/api/printers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/printers/:id', () => {
    it('pitäisi palauttaa yksittäisen tulostimen tiedot', async () => {
      // Hae ensin tulostimet
      const printersResponse = await request(app)
        .get('/api/printers')
        .set('Authorization', `Bearer ${userToken}`);

      const printerId = printersResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/printers/${printerId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(printerId);
    });

    it('pitäisi palauttaa 404 jos tulostinta ei löydy', async () => {
      const response = await request(app)
        .get('/api/printers/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/printers (ADMIN)', () => {
    it('pitäisi hylätä tulostimen luonti ilman tokenia', async () => {
      const response = await request(app)
        .post('/api/printers')
        .send({
          name: 'Unauthorized Printer',
          location: 'Test',
        });

      expect(response.status).toBe(401);
    });

    it('pitäisi sallia adminin luoda tulostin', async () => {
      if (!adminToken) {
        console.log('Admin token not available, skipping test');
        return;
      }

      const response = await request(app)
        .post('/api/printers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Printer ${Date.now()}`,
          description: 'Testitulostimen kuvaus',
          location: 'Testisijainti',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Siivoa luotu tulostin
      if (response.body.data?.id) {
        await prisma.printer.delete({ where: { id: response.body.data.id } });
      }
    });

    it('pitäisi estää tavallisen käyttäjän luomasta tulostinta', async () => {
      const response = await request(app)
        .post('/api/printers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Printer',
          location: 'Test',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/printers/:id (ADMIN)', () => {
    it('pitäisi sallia adminin päivittää tulostimen tilan', async () => {
      if (!adminToken) {
        console.log('Admin token not available, skipping test');
        return;
      }

      // Hae tulostin
      const printersResponse = await request(app)
        .get('/api/printers')
        .set('Authorization', `Bearer ${adminToken}`);

      const printerId = printersResponse.body.data[0].id;
      const originalStatus = printersResponse.body.data[0].status;

      // Päivitä status
      const newStatus = originalStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      const response = await request(app)
        .patch(`/api/printers/${printerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: newStatus,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(newStatus);

      // Palauta alkuperäinen status
      await request(app)
        .patch(`/api/printers/${printerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: originalStatus,
        });
    });
  });
});
