import request from 'supertest';
import app from '../app';
import { prisma } from './setup';

describe('Reservation API', () => {
  let accessToken: string;
  let printerId: string;

  beforeAll(async () => {
    // Hae olemassa oleva tulostin
    const printer = await prisma.printer.findFirst({
      where: { status: 'AVAILABLE' }
    });
    if (printer) {
      printerId = printer.id;
    }
  });

  beforeEach(async () => {
    // Rekisteröi ja kirjaudu testikäyttäjänä
    const uniqueEmail = `test-reservation-${Date.now()}@edu.vamk.fi`;

    await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Test123!',
        firstName: 'Testi',
        lastName: 'Varaaja',
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'Test123!',
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/reservations', () => {
    it('pitäisi palauttaa varauslista kirjautuneelle käyttäjälle', async () => {
      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('pitäisi palauttaa varaukset myös ilman tokenia (julkinen endpoint)', async () => {
      const response = await request(app)
        .get('/api/reservations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/reservations', () => {
    it('pitäisi hylätä varauksen luonti ilman tokenia', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const response = await request(app)
        .post('/api/reservations')
        .send({
          printerId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        });

      expect(response.status).toBe(401);
    });

    it('pitäisi luoda uusi varaus onnistuneesti', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          printerId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
          description: 'Testi varaus',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('pitäisi hylätä varaus menneisyyteen', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(10, 0, 0, 0);

      const endTime = new Date(pastDate);
      endTime.setHours(12, 0, 0, 0);

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          printerId,
          startTime: pastDate.toISOString(),
          endTime: endTime.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('pitäisi hylätä varaus jos loppuaika on ennen alkuaikaa', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(10, 0, 0, 0); // Aiemmin kuin startTime

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          printerId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/reservations/:id/cancel', () => {
    let reservationId: string;

    beforeEach(async () => {
      // Luo varaus peruutettavaksi
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(14, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(16, 0, 0, 0);

      const createResponse = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          printerId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
        });

      reservationId = createResponse.body.data.id;
    });

    it('pitäisi peruuttaa oma varaus onnistuneesti', async () => {
      const response = await request(app)
        .post(`/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });
});
