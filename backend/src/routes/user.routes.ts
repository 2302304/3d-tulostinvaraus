import { Router, Response } from 'express';
import { userService } from '../services/user.service.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/users - Hae kaikki käyttäjät (admin)
router.get('/', authenticate, authorize(Role.ADMIN), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Virhe haettaessa käyttäjiä:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/users/me - Hae oma profiili
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autentikointi vaaditaan' });
      return;
    }
    const user = await userService.getById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Käyttäjää ei löydy' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Virhe haettaessa profiilia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/users/me/reservations - Hae omat varaukset
router.get('/me/reservations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autentikointi vaaditaan' });
      return;
    }
    const reservations = await userService.getReservations(req.user.userId);
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.error('Virhe haettaessa varauksia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// GET /api/users/:id - Hae käyttäjä (admin)
router.get('/:id', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Käyttäjää ei löydy' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Virhe haettaessa käyttäjää:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// PATCH /api/users/:id/role - Päivitä käyttäjän rooli (admin)
router.patch('/:id/role', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(Role).includes(role)) {
      res.status(400).json({ success: false, error: 'Virheellinen rooli' });
      return;
    }
    const user = await userService.updateRole(req.params.id, role);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Virhe päivittäessä roolia:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// PATCH /api/users/:id/active - Aktivoi/deaktivoi käyttäjä (admin)
router.patch('/:id/active', authenticate, authorize(Role.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ success: false, error: 'isActive vaaditaan (boolean)' });
      return;
    }
    const user = await userService.setActive(req.params.id, isActive);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Virhe päivittäessä käyttäjän tilaa:', error);
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

export default router;
