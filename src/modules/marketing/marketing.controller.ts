import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { marketingSchema } from "./marketing.schema";
import { MarketingError, marketingService } from "./marketing.service";

function getRequesterId(req: Request): string {
  return req.auth?.userId ?? "dev-user-id";
}

function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: "Validation error", issues: error.flatten() });
    return;
  }
  if (error instanceof MarketingError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

export const marketingController = {
  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await marketingService.getPublicProfile(p(req, "coachId"));
      res.json({ success: true, data: profile });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await marketingService.getCoachProfile(p(req, "coachId"), getRequesterId(req));
      res.json({ success: true, data: profile });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async upsertProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = marketingSchema.upsertProfile.parse(req.body);
      const profile = await marketingService.upsertProfile(p(req, "coachId"), getRequesterId(req), data);
      res.json({ success: true, data: profile });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async createPricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const data = marketingSchema.createPricingTier.parse(req.body);
      const tier = await marketingService.createPricingTier(p(req, "coachId"), getRequesterId(req), data);
      res.status(201).json({ success: true, data: tier });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async updatePricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      const data = marketingSchema.updatePricingTier.parse(req.body);
      const tier = await marketingService.updatePricingTier(p(req, "coachId"), getRequesterId(req), p(req, "tierId"), data);
      res.json({ success: true, data: tier });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async deletePricingTier(req: Request, res: Response, next: NextFunction) {
    try {
      await marketingService.deletePricingTier(p(req, "coachId"), getRequesterId(req), p(req, "tierId"));
      res.json({ success: true, message: "Pricing tier deleted" });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async listTestimonials(req: Request, res: Response, next: NextFunction) {
    try {
      const testimonials = await marketingService.listTestimonials(p(req, "coachId"), getRequesterId(req));
      res.json({ success: true, data: testimonials });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async createTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const data = marketingSchema.createTestimonial.parse(req.body);
      const clientId = req.auth?.role === "client" ? req.auth.userId : undefined;
      const testimonial = await marketingService.createTestimonial(p(req, "coachId"), data, clientId);
      res.status(201).json({ success: true, data: testimonial });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async approveTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const testimonial = await marketingService.approveTestimonial(p(req, "coachId"), getRequesterId(req), p(req, "testimonialId"));
      res.json({ success: true, data: testimonial });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
