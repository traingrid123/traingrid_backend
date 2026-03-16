import { NextFunction, Request, Response } from "express";

export function roleMiddleware(_roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
