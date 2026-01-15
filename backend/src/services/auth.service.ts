import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { JwtPayload } from '../types/index.js';
import { RegisterInput, LoginInput } from '../utils/validation.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  // Rekisteröidy
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new Error('Sähköpostiosoite on jo käytössä');
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

    return user;
  }

  // Kirjaudu
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user || !user.isActive) {
      throw new Error('Virheellinen sähköposti tai salasana');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!validPassword) {
      throw new Error('Virheellinen sähköposti tai salasana');
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
