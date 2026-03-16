import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export function validateMiddleware(_schema: ZodTypeAny) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
}
