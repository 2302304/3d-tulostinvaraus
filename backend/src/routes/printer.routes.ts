import { Router, Request, Response } from 'express';
import { printerService } from '../services/printer.service.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { createPrinterSchema } from '../utils/validation.js';
import { Role, PrinterStatus } from '@prisma/client';
import { ZodError } from 'zod';

const router = Router();

// GET /api/printers - Hae kaikki tulostimet
router.get('/', async (_req: Request, res: Response) => {
  try {
    const printers = await printerService.getAll();
    res.json({ success: true, data: printers });
  } catch (error) {
    console.error('Virhe haettaessa tulostimia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/printers/:id - Hae yksittäinen tulostin
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const printer = await printerService.getById(req.params.id);
    if (!printer) {
      res.status(404).json({ success: false, error: 'Tulostinta ei löydy' });
      return;
    }
    res.json({ success: true, data: printer });
  } catch (error) {
    console.error('Virhe haettaessa tulostinta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/printers/:id/reservations - Hae tulostimen varaukset
router.get('/:id/reservations', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Oletus: nykyinen viikko
    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate
      ? new Date(endDate as string)
      : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reservations = await printerService.getReservations(req.params.id, start, end);
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Virhe haettaessa varauksia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// POST /api/printers - Luo uusi tulostin (admin)
router.post('/', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const data = createPrinterSchema.parse(req.body);
    const printer = await printerService.create(data);
    res.status(201).json({ success: true, data: printer });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('Virhe luotaessa tulostinta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// PATCH /api/printers/:id - Päivitä tulostin (admin)
router.patch('/:id', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, location, status } = req.body;

    // Validoi status jos annettu
    if (status && !Object.values(PrinterStatus).includes(status)) {
      res.status(400).json({ success: false, error: 'Virheellinen tila' });
      return;
    }

    const printer = await printerService.update(req.params.id, {
      name,
      description,
      location,
      status
    });
    res.json({ success: true, data: printer });
  } catch (error) {
    console.error('Virhe päivittäessä tulostinta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// DELETE /api/printers/:id - Poista tulostin (admin)
router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    await printerService.delete(req.params.id);
    res.json({ success: true, message: 'Tulostin poistettu' });
  } catch (error) {
    console.error('Virhe poistettaessa tulostinta:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

export default router;
