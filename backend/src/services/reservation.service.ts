import { prisma } from '../index.js';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationInput } from '../utils/validation.js';

export class ReservationService {
  // Hae kaikki varaukset
  async getAll(filters?: { printerId?: string; userId?: string; startDate?: Date; endDate?: Date }) {
    const where: Record<string, unknown> = {};

    if (filters?.printerId) {
      where.printerId = filters.printerId;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters?.startDate) {
        (where.startTime as Record<string, Date>).gte = filters.startDate;
      }
      if (filters?.endDate) {
        (where.startTime as Record<string, Date>).lte = filters.endDate;
      }
    }

    return prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        printer: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  // Hae yksittäinen varaus
  async getById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        printer: {
          select: { id: true, name: true, location: true }
        }
      }
    });
  }

  // Luo uusi varaus
  async create(userId: string, input: CreateReservationInput) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    // Tarkista päällekkäisyydet
    const overlapping = await this.checkOverlap(input.printerId, startTime, endTime);
    if (overlapping) {
      throw new Error('Valittu aika on jo varattu');
    }

    // Tarkista käyttäjän varausten määrä
    const settings = await prisma.systemSettings.findFirst();
    const maxReservations = settings?.maxReservationsPerUser || 3;

    const userActiveReservations = await prisma.reservation.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        endTime: { gt: new Date() }
      }
    });

    if (userActiveReservations >= maxReservations) {
      throw new Error(`Sinulla voi olla enintään ${maxReservations} aktiivista varausta`);
    }

    return prisma.reservation.create({
      data: {
        userId,
        printerId: input.printerId,
        startTime,
        endTime,
        description: input.description,
        status: ReservationStatus.CONFIRMED
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        printer: {
          select: { id: true, name: true, location: true }
        }
      }
    });
  }

  // Päivitä varaus
  async update(id: string, userId: string, userRole: string, data: Partial<CreateReservationInput>) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new Error('Varausta ei löydy');
    }

    // Vain omistaja, STAFF tai ADMIN voi muokata
    if (reservation.userId !== userId && userRole === 'STUDENT') {
      throw new Error('Ei oikeutta muokata tätä varausta');
    }

    // Jos aikoja muutetaan, tarkista päällekkäisyydet
    if (data.startTime || data.endTime) {
      const startTime = data.startTime ? new Date(data.startTime) : reservation.startTime;
      const endTime = data.endTime ? new Date(data.endTime) : reservation.endTime;

      const overlapping = await this.checkOverlap(
        reservation.printerId,
        startTime,
        endTime,
        id
      );

      if (overlapping) {
        throw new Error('Valittu aika on jo varattu');
      }
    }

    return prisma.reservation.update({
      where: { id },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        description: data.description,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        printer: {
          select: { id: true, name: true, location: true }
        }
      }
    });
  }

  // Peruuta varaus
  async cancel(id: string, userId: string, userRole: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new Error('Varausta ei löydy');
    }

    // Vain omistaja, STAFF tai ADMIN voi peruuttaa
    if (reservation.userId !== userId && userRole === 'STUDENT') {
      throw new Error('Ei oikeutta peruuttaa tätä varausta');
    }

    return prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED }
    });
  }

  // Poista varaus (vain ADMIN)
  async delete(id: string) {
    return prisma.reservation.delete({ where: { id } });
  }

  // Tarkista päällekkäisyydet
  private async checkOverlap(
    printerId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const overlapping = await prisma.reservation.findFirst({
      where: {
        printerId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime }
          }
        ]
      }
    });

    return !!overlapping;
  }
}

export const reservationService = new ReservationService();
