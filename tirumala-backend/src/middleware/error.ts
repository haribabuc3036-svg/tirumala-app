import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

/** Global error handler — always returns JSON */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  console.error(`[Error] ${err.message}`);
  res.status(statusCode).json({
    success: false,
    error: err.message ?? 'Internal server error',
  });
}

/** Wrap async route handlers so thrown errors propagate to errorHandler */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
