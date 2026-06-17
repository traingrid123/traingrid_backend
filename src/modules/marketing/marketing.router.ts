import { Router } from "express";

import { marketingController } from "./marketing.controller";

export const marketingRouter = Router();

marketingRouter.get("/coaches/:coachId/profile/public", marketingController.getPublicProfile);
marketingRouter.get("/coaches/:coachId/profile", marketingController.getProfile);
marketingRouter.put("/coaches/:coachId/profile", marketingController.upsertProfile);
marketingRouter.post("/coaches/:coachId/pricing-tiers", marketingController.createPricingTier);
marketingRouter.patch("/coaches/:coachId/pricing-tiers/:tierId", marketingController.updatePricingTier);
marketingRouter.delete("/coaches/:coachId/pricing-tiers/:tierId", marketingController.deletePricingTier);
marketingRouter.get("/coaches/:coachId/testimonials", marketingController.listTestimonials);
marketingRouter.post("/coaches/:coachId/testimonials", marketingController.createTestimonial);
marketingRouter.patch("/coaches/:coachId/testimonials/:testimonialId/approve", marketingController.approveTestimonial);
