import { PrismaClient } from '@prisma/client';

// Testiympäristön prisma-instanssi
export const prisma = new PrismaClient();

// Ennen kaikkia testejä
beforeAll(async () => {
  // Varmista tietokantayhteys
  await prisma.$connect();
});

// Jokaisen testin jälkeen - siivoa testidata
afterEach(async () => {
  // Poistetaan testikäyttäjät (email sisältää "test-")
  await prisma.auditLog.deleteMany({
    where: {
      user: {
        email: { contains: 'test-' }
      }
    }
  });
  await prisma.reservation.deleteMany({
    where: {
      user: {
        email: { contains: 'test-' }
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'test-' }
    }
  });
});

// Kaikkien testien jälkeen
afterAll(async () => {
  await prisma.$disconnect();
});
