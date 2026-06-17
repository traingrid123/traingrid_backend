import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import {
  CreatePricingTierInput,
  CreateTestimonialInput,
  UpdatePricingTierInput,
  UpsertMarketingProfileInput
} from "./marketing.schema";

function buildInclude(publicOnly: boolean): Prisma.MarketingProfileInclude {
  if (publicOnly) {
    return {
      pricingTiers: {
        where: { isActive: true },
        orderBy: [{ isPopular: "desc" }, { createdAt: "asc" }]
      },
      testimonials: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" }
      }
    };
  }
  return {
    pricingTiers: {
      orderBy: [{ isPopular: "desc" }, { createdAt: "asc" }]
    },
    testimonials: {
      orderBy: { createdAt: "desc" }
    }
  };
}

export const marketingRepository = {
  async upsertProfile(coachId: string, data: UpsertMarketingProfileInput) {
    return prisma.marketingProfile.upsert({
      where: { coachId },
      create: { coachId, ...data },
      update: data,
      include: buildInclude(false)
    });
  },

  async getProfile(coachId: string, publicOnly = false) {
    return prisma.marketingProfile.findUnique({
      where: { coachId },
      include: buildInclude(publicOnly)
    });
  },

  async incrementViews(coachId: string) {
    return prisma.marketingProfile.updateMany({
      where: { coachId },
      data: { profileViews: { increment: 1 } }
    });
  },

  async createPricingTier(marketingProfileId: string, data: CreatePricingTierInput) {
    return prisma.pricingTier.create({
      data: { marketingProfileId, ...data, price: data.price }
    });
  },

  async updatePricingTier(tierId: string, data: UpdatePricingTierInput) {
    return prisma.pricingTier.update({
      where: { id: tierId },
      data
    });
  },

  async deletePricingTier(tierId: string) {
    return prisma.pricingTier.delete({ where: { id: tierId } });
  },

  async findPricingTier(tierId: string) {
    return prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: { marketingProfile: { select: { coachId: true } } }
    });
  },

  async createTestimonial(marketingProfileId: string, data: CreateTestimonialInput, clientId?: string) {
    return prisma.testimonial.create({
      data: { marketingProfileId, clientId: clientId ?? null, ...data }
    });
  },

  async approveTestimonial(testimonialId: string) {
    return prisma.testimonial.update({
      where: { id: testimonialId },
      data: { isApproved: true, approvedAt: new Date() }
    });
  },

  async findTestimonial(testimonialId: string) {
    return prisma.testimonial.findUnique({
      where: { id: testimonialId },
      include: { marketingProfile: { select: { coachId: true } } }
    });
  },

  async listTestimonials(marketingProfileId: string, includeUnapproved = false) {
    return prisma.testimonial.findMany({
      where: {
        marketingProfileId,
        ...(includeUnapproved ? {} : { isApproved: true })
      },
      orderBy: { createdAt: "desc" }
    });
  }
};
