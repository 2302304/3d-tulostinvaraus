import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { ZodError } from 'zod';

const router = Router();

// POST /api/auth/register - Rekisteröidy
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// POST /api/auth/login - Kirjaudu
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    if (error instanceof Error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

// POST /api/auth/refresh - Päivitä access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token vaaditaan' });
      return;
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Palvelinvirhe' });
  }
});

export default router;
