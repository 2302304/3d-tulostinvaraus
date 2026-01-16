import { Request, Response, NextFunction } from 'express';

/**
 * Mukautettu virheluokka API-virheille
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.name = 'ApiError';
  }

  // Yleisimmät virhetyypit staattisina metodeina
  static badRequest(message: string, code = 'BAD_REQUEST'): ApiError {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Kirjautuminen vaaditaan', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Ei käyttöoikeutta', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resurssia ei löydy', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT'): ApiError {
    return new ApiError(409, message, code);
  }

  static validationError(message: string, code = 'VALIDATION_ERROR'): ApiError {
    return new ApiError(422, message, code);
  }

  static internal(message = 'Palvelinvirhe', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code);
  }
}

/**
 * Keskitetty virheenkäsittelijä
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Kehitystilassa tulostetaan koko virhe
  if (process.env.NODE_ENV === 'development') {
    console.error('Virhe:', err);
  }

  // Käsittele ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  // Prisma-virheet
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string };

    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'Tietue on jo olemassa',
          code: 'DUPLICATE_ENTRY',
        },
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Tietuetta ei löydy',
          code: 'NOT_FOUND',
        },
      });
      return;
    }
  }

  // Zod-validointivirheet
  if (err.name === 'ZodError') {
    res.status(422).json({
      success: false,
      error: {
        message: 'Virheelliset syöttötiedot',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  // JSON-parsintavirhe
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Virheellinen JSON-muoto',
        code: 'INVALID_JSON',
      },
    });
    return;
  }

  // Tuntematon virhe - ei paljasteta sisäisiä yksityiskohtia
  res.status(500).json({
    success: false,
    error: {
      message: 'Palvelinvirhe',
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * Async-funktioiden virhekäsittely wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
