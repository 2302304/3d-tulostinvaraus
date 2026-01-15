import { PrismaClient, Role, PrinterStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Alustetaan tietokantaa...');

  // Luo admin-käyttäjä
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vamk.fi' },
    update: {},
    create: {
      email: 'admin@vamk.fi',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Käyttäjä',
      role: Role.ADMIN,
    },
  });
  console.log('Admin-käyttäjä luotu:', admin.email);

  // Luo henkilökunta-käyttäjä
  const staffPassword = await bcrypt.hash('Staff123!', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@vamk.fi' },
    update: {},
    create: {
      email: 'staff@vamk.fi',
      passwordHash: staffPassword,
      firstName: 'Henkilökunta',
      lastName: 'Käyttäjä',
      role: Role.STAFF,
    },
  });
  console.log('Henkilökunta-käyttäjä luotu:', staff.email);

  // Luo opiskelija-käyttäjä
  const studentPassword = await bcrypt.hash('Student123!', 12);
  const student = await prisma.user.upsert({
    where: { email: 'opiskelija@edu.vamk.fi' },
    update: {},
    create: {
      email: 'opiskelija@edu.vamk.fi',
      passwordHash: studentPassword,
      firstName: 'Opiskelija',
      lastName: 'Testaaja',
      role: Role.STUDENT,
    },
  });
  console.log('Opiskelija-käyttäjä luotu:', student.email);

  // Luo tulostimet (Technobothnian Ultimaker-tulostimet)
  const printers = [
    { name: 'Ultimaker S5', description: 'Suurin tulostusalue, dual extrusion' },
    { name: 'Ultimaker S3-1', description: 'Kompakti, dual extrusion' },
    { name: 'Ultimaker S3-2', description: 'Kompakti, dual extrusion' },
    { name: 'Ultimaker 3', description: 'Dual extrusion' },
    { name: 'Ultimaker 3ext', description: 'Pidennetty tulostusalue, dual extrusion' },
  ];

  for (const printer of printers) {
    await prisma.printer.upsert({
      where: { name: printer.name },
      update: {},
      create: {
        name: printer.name,
        description: printer.description,
        location: 'Technobothnia',
        status: PrinterStatus.AVAILABLE,
      },
    });
    console.log('Tulostin luotu:', printer.name);
  }

  // Luo järjestelmäasetukset
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        maxReservationsPerUser: 3,
        maxReservationHours: 48,
        allowWeekendReservations: true,
      },
    });
    console.log('Järjestelmäasetukset luotu');
  }

  console.log('Tietokannan alustus valmis!');
  console.log('');
  console.log('Testikäyttäjät:');
  console.log('  Admin: admin@vamk.fi / Admin123!');
  console.log('  Staff: staff@vamk.fi / Staff123!');
  console.log('  Student: opiskelija@edu.vamk.fi / Student123!');
}

main()
  .catch((e) => {
    console.error('Virhe:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
