import { prisma } from '../index.js';
import { Role } from '@prisma/client';

export class UserService {
  // Hae kaikki käyttäjät (admin)
  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { reservations: true }
        }
      },
      orderBy: { lastName: 'asc' }
    });
  }

  // Hae yksittäinen käyttäjä
  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  // Päivitä käyttäjän rooli (admin)
  async updateRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
  }

  // Aktivoi/deaktivoi käyttäjä (admin)
  async setActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
  }

  // Hae käyttäjän varaukset
  async getReservations(id: string) {
    return prisma.reservation.findMany({
      where: { userId: id },
      include: {
        printer: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  }
}

export const userService = new UserService();
