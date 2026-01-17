import { PrismaClient } from '@prisma/client';
import app from './app.js';

// Prisma client
export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// Käynnistys
async function main() {
  try {
    await prisma.$connect();
    console.log('Tietokantayhteys muodostettu');

    app.listen(PORT, () => {
      console.log(`Palvelin käynnissä portissa ${PORT}`);
    });
  } catch (error) {
    console.error('Käynnistysvirhe:', error);
    process.exit(1);
  }
}

// Käynnistä vain jos ei ole testiympäristö
if (process.env.NODE_ENV !== 'test') {
  main();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
