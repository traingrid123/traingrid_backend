import { marketingRepository } from "./marketing.repository";
import {
  CreatePricingTierInput,
  CreateTestimonialInput,
  UpdatePricingTierInput,
  UpsertMarketingProfileInput
} from "./marketing.schema";

export class MarketingError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "MarketingError";
  }
}

export const marketingService = {
  async getPublicProfile(coachId: string) {
    await marketingRepository.incrementViews(coachId).catch(() => null);
    const profile = await marketingRepository.getProfile(coachId, true);
    return profile;
  },

  async getCoachProfile(coachId: string, requesterId: string) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    return marketingRepository.getProfile(coachId, false);
  },

  async upsertProfile(coachId: string, requesterId: string, data: UpsertMarketingProfileInput) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    return marketingRepository.upsertProfile(coachId, data);
  },

  async createPricingTier(coachId: string, requesterId: string, data: CreatePricingTierInput) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    let profile = await marketingRepository.getProfile(coachId, false);
    if (!profile) {
      profile = await marketingRepository.upsertProfile(coachId, {});
    }
    return marketingRepository.createPricingTier(profile.id, data);
  },

  async updatePricingTier(coachId: string, requesterId: string, tierId: string, data: UpdatePricingTierInput) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    const tier = await marketingRepository.findPricingTier(tierId);
    if (!tier) {
      throw new MarketingError("Pricing tier not found", 404);
    }
    if (tier.marketingProfile.coachId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    return marketingRepository.updatePricingTier(tierId, data);
  },

  async deletePricingTier(coachId: string, requesterId: string, tierId: string) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    const tier = await marketingRepository.findPricingTier(tierId);
    if (!tier) {
      throw new MarketingError("Pricing tier not found", 404);
    }
    if (tier.marketingProfile.coachId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    return marketingRepository.deletePricingTier(tierId);
  },

  async listTestimonials(coachId: string, requesterId: string) {
    const profile = await marketingRepository.getProfile(coachId, false);
    if (!profile) {
      return [];
    }
    const includeUnapproved = requesterId === coachId;
    return marketingRepository.listTestimonials(profile.id, includeUnapproved);
  },

  async createTestimonial(coachId: string, data: CreateTestimonialInput, clientId?: string) {
    let profile = await marketingRepository.getProfile(coachId, false);
    if (!profile) {
      profile = await marketingRepository.upsertProfile(coachId, {});
    }
    return marketingRepository.createTestimonial(profile.id, data, clientId);
  },

  async approveTestimonial(coachId: string, requesterId: string, testimonialId: string) {
    if (requesterId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    const testimonial = await marketingRepository.findTestimonial(testimonialId);
    if (!testimonial) {
      throw new MarketingError("Testimonial not found", 404);
    }
    if (testimonial.marketingProfile.coachId !== coachId) {
      throw new MarketingError("Forbidden", 403);
    }
    return marketingRepository.approveTestimonial(testimonialId);
  }
};
