import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { JwtPayload } from '../types/index.js';
import { RegisterInput, LoginInput } from '../utils/validation.js';
import { auditService } from './audit.service.js';
import { ApiError } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export class AuthService {
  // Rekisteröidy
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw ApiError.conflict('Sähköpostiosoite on jo käytössä', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    // Audit-lokitus
    await auditService.log({
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
      newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName },
    });

    return user;
  }

  // Kirjaudu
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    // Epäonnistunut kirjautuminen - käyttäjää ei löydy
    if (!user) {
      await auditService.log({
        action: 'LOGIN_FAILED',
        entityType: 'SYSTEM',
        entityId: 'auth',
        newValues: { email: input.email, reason: 'user_not_found' },
      });
      throw ApiError.unauthorized('Virheellinen sähköposti tai salasana', 'INVALID_CREDENTIALS');
    }

    // Käyttäjä ei ole aktiivinen
    if (!user.isActive) {
      await auditService.log({
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        newValues: { reason: 'user_inactive' },
      });
      throw ApiError.unauthorized('Käyttäjätili on poistettu käytöstä', 'USER_INACTIVE');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);

    // Väärä salasana
    if (!validPassword) {
      await auditService.log({
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        newValues: { reason: 'invalid_password' },
      });
      throw ApiError.unauthorized('Virheellinen sähköposti tai salasana', 'INVALID_CREDENTIALS');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Onnistunut kirjautuminen
    await auditService.log({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      userId: user.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // Päivitä access token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('Käyttäjää ei löydy');
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new Error('Virheellinen refresh token');
    }
  }
}

export const authService = new AuthService();
