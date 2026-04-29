import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

type ValidateTarget = "body" | "query" | "params";

export function validateMiddleware(
  schema: ZodTypeAny,
  target: ValidateTarget = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        issues: result.error.flatten()
      });
      return;
    }

    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
