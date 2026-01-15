import { prisma } from '../index.js';
import { PrinterStatus } from '@prisma/client';
import { CreatePrinterInput } from '../utils/validation.js';

export class PrinterService {
  // Hae kaikki tulostimet
  async getAll() {
    return prisma.printer.findMany({
      orderBy: { name: 'asc' }
    });
  }

  // Hae yksittäinen tulostin
  async getById(id: string) {
    return prisma.printer.findUnique({
      where: { id }
    });
  }

  // Luo uusi tulostin
  async create(input: CreatePrinterInput) {
    return prisma.printer.create({
      data: {
        name: input.name,
        description: input.description,
        location: input.location || 'Technobothnia'
      }
    });
  }

  // Päivitä tulostin
  async update(id: string, data: Partial<CreatePrinterInput & { status: PrinterStatus }>) {
    return prisma.printer.update({
      where: { id },
      data
    });
  }

  // Poista tulostin
  async delete(id: string) {
    return prisma.printer.delete({ where: { id } });
  }

  // Hae tulostimen varaukset tietylle aikavälille
  async getReservations(id: string, startDate: Date, endDate: Date) {
    return prisma.reservation.findMany({
      where: {
        printerId: id,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }
}

export const printerService = new PrinterService();
