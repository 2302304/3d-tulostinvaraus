import { prisma } from '../index.js';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationInput } from '../utils/validation.js';
import { auditService } from './audit.service.js';
import { ApiError } from '../middleware/error.middleware.js';

export class ReservationService {
  // Hae kaikki varaukset
  async getAll(filters?: { printerId?: string; userId?: string; startDate?: Date; endDate?: Date; status?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.printerId) {
      where.printerId = filters.printerId;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.status) {
      where.status = filters.status;
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
      orderBy: { startTime: 'desc' }
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
    const now = new Date();

    // Validoi: aloitusaika ei voi olla menneisyydessä
    if (startTime < now) {
      throw ApiError.badRequest('Varauksen aloitusaika ei voi olla menneisyydessä', 'INVALID_START_TIME');
    }

    // Validoi: lopetusaika on oltava aloitusajan jälkeen
    if (endTime <= startTime) {
      throw ApiError.badRequest('Lopetusajan on oltava aloitusajan jälkeen', 'INVALID_TIME_RANGE');
    }

    // Hae järjestelmäasetukset
    const settings = await prisma.systemSettings.findFirst();
    const maxReservationHours = settings?.maxReservationHours || 48;
    const maxReservations = settings?.maxReservationsPerUser || 3;
    const allowWeekends = settings?.allowWeekendReservations ?? true;

    // Validoi: varauksen maksimikesto
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > maxReservationHours) {
      throw ApiError.badRequest(
        `Varauksen maksimikesto on ${maxReservationHours} tuntia`,
        'DURATION_EXCEEDED'
      );
    }

    // Validoi: viikonloppuvaraukset
    if (!allowWeekends) {
      const startDay = startTime.getDay();
      const endDay = endTime.getDay();
      if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
        throw ApiError.badRequest('Viikonloppuvaraukset eivät ole sallittuja', 'WEEKEND_NOT_ALLOWED');
      }
    }

    // Tarkista tulostimen olemassaolo ja tila
    const printer = await prisma.printer.findUnique({ where: { id: input.printerId } });
    if (!printer) {
      throw ApiError.notFound('Tulostinta ei löydy', 'PRINTER_NOT_FOUND');
    }
    if (printer.status !== 'AVAILABLE') {
      throw ApiError.badRequest('Tulostin ei ole varattavissa', 'PRINTER_NOT_AVAILABLE');
    }

    // Tarkista päällekkäisyydet
    const overlapping = await this.checkOverlap(input.printerId, startTime, endTime);
    if (overlapping) {
      throw ApiError.conflict('Valittu aika on jo varattu', 'TIME_SLOT_TAKEN');
    }

    // Tarkista käyttäjän varausten määrä
    const userActiveReservations = await prisma.reservation.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        endTime: { gt: now }
      }
    });

    if (userActiveReservations >= maxReservations) {
      throw ApiError.badRequest(
        `Sinulla voi olla enintään ${maxReservations} aktiivista varausta`,
        'MAX_RESERVATIONS_EXCEEDED'
      );
    }

    // Luo varaus
    const reservation = await prisma.reservation.create({
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

    // Audit-lokitus
    await auditService.log({
      action: 'RESERVATION_CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      userId,
      newValues: {
        printerId: input.printerId,
        printerName: printer.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });

    return reservation;
  }

  // Päivitä varaus
  async update(id: string, userId: string, userRole: string, data: Partial<CreateReservationInput>) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw ApiError.notFound('Varausta ei löydy', 'RESERVATION_NOT_FOUND');
    }

    // Vain omistaja, STAFF tai ADMIN voi muokata
    if (reservation.userId !== userId && userRole === 'STUDENT') {
      throw ApiError.forbidden('Ei oikeutta muokata tätä varausta', 'NOT_OWNER');
    }

    // Tallenna vanhat arvot audit-lokia varten
    const oldValues = {
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      description: reservation.description,
    };

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
        throw ApiError.conflict('Valittu aika on jo varattu', 'TIME_SLOT_TAKEN');
      }
    }

    const updated = await prisma.reservation.update({
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

    // Audit-lokitus
    await auditService.log({
      action: 'RESERVATION_UPDATE',
      entityType: 'RESERVATION',
      entityId: id,
      userId,
      oldValues,
      newValues: {
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
        description: updated.description,
      },
    });

    return updated;
  }

  // Peruuta varaus
  async cancel(id: string, userId: string, userRole: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw ApiError.notFound('Varausta ei löydy', 'RESERVATION_NOT_FOUND');
    }

    // Vain omistaja, STAFF tai ADMIN voi peruuttaa
    if (reservation.userId !== userId && userRole === 'STUDENT') {
      throw ApiError.forbidden('Ei oikeutta peruuttaa tätä varausta', 'NOT_OWNER');
    }

    const cancelled = await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED }
    });

    // Audit-lokitus
    await auditService.log({
      action: 'RESERVATION_CANCEL',
      entityType: 'RESERVATION',
      entityId: id,
      userId,
      oldValues: { status: reservation.status },
      newValues: { status: 'CANCELLED' },
    });

    return cancelled;
  }

  // Poista varaus (vain ADMIN)
  async delete(id: string, adminUserId: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw ApiError.notFound('Varausta ei löydy', 'RESERVATION_NOT_FOUND');
    }

    await prisma.reservation.delete({ where: { id } });

    // Audit-lokitus
    await auditService.log({
      action: 'RESERVATION_DELETE',
      entityType: 'RESERVATION',
      entityId: id,
      userId: adminUserId,
      oldValues: {
        userId: reservation.userId,
        printerId: reservation.printerId,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
      },
    });
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
