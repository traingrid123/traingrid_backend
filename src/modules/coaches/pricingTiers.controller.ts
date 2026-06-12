import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { PricingTierError, pricingTiersService } from "./pricingTiers.service";
import { pricingTiersSchema } from "./pricingTiers.schema";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    role: "coach" | "client";
  };
};

function getAuth(req: Request) {
  return (req as AuthRequest).auth;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof PricingTierError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const pricingTiersController = {
  async listPricingTiers(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const coachId = auth?.userId;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const tiers = await pricingTiersService.listPricingTiers(coachId, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: tiers
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getPricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const tierId = getParam(req.params.tierId);

      if (!tierId) {
        return res.status(400).json({
          success: false,
          message: "Tier ID is required"
        });
      }

      const tier = await pricingTiersService.getPricingTier(tierId, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async createPricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const coachId = auth?.userId;
      const input = pricingTiersSchema.create.parse(req.body);

      if (!coachId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const tier = await pricingTiersService.createPricingTier(coachId, input, auth ?? undefined);

      res.status(201).json({
        success: true,
        data: tier
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async updatePricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const tierId = getParam(req.params.tierId);
      const input = pricingTiersSchema.update.parse(req.body);

      if (!tierId) {
        return res.status(400).json({
          success: false,
          message: "Tier ID is required"
        });
      }

      const tier = await pricingTiersService.updatePricingTier(tierId, input, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async deletePricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const tierId = getParam(req.params.tierId);

      if (!tierId) {
        return res.status(400).json({
          success: false,
          message: "Tier ID is required"
        });
      }

      const result = await pricingTiersService.deletePricingTier(tierId, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async togglePricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const tierId = getParam(req.params.tierId);

      if (!tierId) {
        return res.status(400).json({
          success: false,
          message: "Tier ID is required"
        });
      }

      const tier = await pricingTiersService.togglePricingTier(tierId, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async setPopularTier(req: Request, res: Response, next: NextFunction) {
    try {
      const auth = getAuth(req);
      const tierId = getParam(req.params.tierId);
      const input = pricingTiersSchema.setPopular.parse(req.body);

      if (!tierId) {
        return res.status(400).json({
          success: false,
          message: "Tier ID is required"
        });
      }

      const tier = await pricingTiersService.setPopularTier(tierId, input.isPopular, auth ?? undefined);

      res.status(200).json({
        success: true,
        data: tier
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
