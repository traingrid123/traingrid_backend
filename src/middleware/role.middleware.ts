import { NextFunction, Request, Response } from "express";

export function roleMiddleware(_roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }

    if (!_roles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
      return;
    }

    next();
  };
}
