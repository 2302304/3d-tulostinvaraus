import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.reservation.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      printer: { select: { name: true } }
    },
    orderBy: { startTime: 'desc' }
  });

  console.log('\n=== KAIKKI VARAUKSET TIETOKANNASSA ===\n');

  if (reservations.length === 0) {
    console.log('Ei varauksia.');
  } else {
    reservations.forEach((r, i) => {
      console.log(`${i + 1}. ${r.printer.name}`);
      console.log(`   Käyttäjä: ${r.user.firstName} ${r.user.lastName} (${r.user.email})`);
      console.log(`   Aika: ${r.startTime.toLocaleString('fi-FI')} - ${r.endTime.toLocaleString('fi-FI')}`);
      console.log(`   Tila: ${r.status}`);
      if (r.description) console.log(`   Kuvaus: ${r.description}`);
      console.log('');
    });
  }

  console.log(`Yhteensä: ${reservations.length} varausta`);

  await prisma.$disconnect();
}

main();
