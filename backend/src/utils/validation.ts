import { z } from 'zod';

// Rekisteröityminen
export const registerSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
  password: z
    .string()
    .min(8, 'Salasanan tulee olla vähintään 8 merkkiä')
    .regex(/[A-Z]/, 'Salasanassa tulee olla vähintään yksi iso kirjain')
    .regex(/[a-z]/, 'Salasanassa tulee olla vähintään yksi pieni kirjain')
    .regex(/[0-9]/, 'Salasanassa tulee olla vähintään yksi numero'),
  firstName: z.string().min(1, 'Etunimi vaaditaan').max(50),
  lastName: z.string().min(1, 'Sukunimi vaaditaan').max(50),
});

// Kirjautuminen
export const loginSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
  password: z.string().min(1, 'Salasana vaaditaan'),
});

// Varauksen luonti
// datetime-local lähettää muodossa "2026-01-17T10:00", ISO 8601 on "2026-01-17T10:00:00Z"
const dateTimeString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Virheellinen päivämäärä/aika' }
);

export const createReservationSchema = z.object({
  printerId: z.string().cuid('Virheellinen tulostimen ID'),
  startTime: dateTimeString,
  endTime: dateTimeString,
  description: z.string().max(500).optional(),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'Lopetusajan tulee olla aloitusajan jälkeen',
  path: ['endTime'],
});

// Tulostimen luonti
export const createPrinterSchema = z.object({
  name: z.string().min(1, 'Nimi vaaditaan').max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

// Tyyppiapurit
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreatePrinterInput = z.infer<typeof createPrinterSchema>;
