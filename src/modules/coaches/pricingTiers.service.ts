import { prisma } from "../../lib/prisma";
import { PricingTierCreateInput, PricingTierUpdateInput } from "./pricingTiers.schema";
import { Prisma } from "@prisma/client";

type Requester = {
  role: "coach" | "client";
  userId: string;
};

export class PricingTierError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "PricingTierError";
  }
}

function toNumber(value: number | string | Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object") {
    return value.toNumber();
  }
  return typeof value === "string" ? parseFloat(value) : value;
}

function ensureCoachAccess(coachId: string, requester?: Requester) {
  if (!requester) {
    return;
  }

  if (requester.role !== "coach" || requester.userId !== coachId) {
    throw new PricingTierError("You are not allowed to access this pricing tier", 403);
  }
}

export const pricingTiersService = {
  async listPricingTiers(coachId: string, requester?: Requester) {
    ensureCoachAccess(coachId, requester);

    const marketingProfile = await prisma.marketingProfile.findUnique({
      where: { coachId },
      include: {
        pricingTiers: {
          where: {
            isActive: true
          },
          orderBy: [
            { isPopular: "desc" },
            { price: "asc" }
          ]
        }
      }
    });

    if (!marketingProfile) {
      return [];
    }

    return marketingProfile.pricingTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    }));
  },

  async getPricingTier(tierId: string, requester?: Requester) {
    const tier = await prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: {
        marketingProfile: {
          select: {
            coachId: true
          }
        }
      }
    });

    if (!tier) {
      throw new PricingTierError("Pricing tier not found", 404);
    }

    ensureCoachAccess(tier.marketingProfile.coachId, requester);

    return {
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    };
  },

  async createPricingTier(coachId: string, input: PricingTierCreateInput, requester?: Requester) {
    ensureCoachAccess(coachId, requester);

    let marketingProfile = await prisma.marketingProfile.findUnique({
      where: { coachId }
    });

    if (!marketingProfile) {
      marketingProfile = await prisma.marketingProfile.create({
        data: {
          coachId
        }
      });
    }

    const tier = await prisma.pricingTier.create({
      data: {
        marketingProfileId: marketingProfile.id,
        name: input.name,
        price: input.price,
        currency: input.currency,
        billingCycle: input.billingCycle,
        features: input.features,
        isPopular: input.isPopular,
        isActive: input.isActive
      }
    });

    return {
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    };
  },

  async updatePricingTier(tierId: string, input: PricingTierUpdateInput, requester?: Requester) {
    const existing = await prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: {
        marketingProfile: {
          select: {
            coachId: true
          }
        }
      }
    });

    if (!existing) {
      throw new PricingTierError("Pricing tier not found", 404);
    }

    ensureCoachAccess(existing.marketingProfile.coachId, requester);

    const tier = await prisma.pricingTier.update({
      where: { id: tierId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.billingCycle !== undefined && { billingCycle: input.billingCycle }),
        ...(input.features !== undefined && { features: input.features }),
        ...(input.isPopular !== undefined && { isPopular: input.isPopular }),
        ...(input.isActive !== undefined && { isActive: input.isActive })
      }
    });

    return {
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    };
  },

  async deletePricingTier(tierId: string, requester?: Requester) {
    const existing = await prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: {
        marketingProfile: {
          select: {
            coachId: true
          }
        }
      }
    });

    if (!existing) {
      throw new PricingTierError("Pricing tier not found", 404);
    }

    ensureCoachAccess(existing.marketingProfile.coachId, requester);

    await prisma.pricingTier.delete({
      where: { id: tierId }
    });

    return { success: true };
  },

  async togglePricingTier(tierId: string, requester?: Requester) {
    const existing = await prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: {
        marketingProfile: {
          select: {
            coachId: true
          }
        }
      }
    });

    if (!existing) {
      throw new PricingTierError("Pricing tier not found", 404);
    }

    ensureCoachAccess(existing.marketingProfile.coachId, requester);

    const tier = await prisma.pricingTier.update({
      where: { id: tierId },
      data: {
        isActive: !existing.isActive
      }
    });

    return {
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    };
  },

  async setPopularTier(tierId: string, isPopular: boolean, requester?: Requester) {
    const existing = await prisma.pricingTier.findUnique({
      where: { id: tierId },
      include: {
        marketingProfile: {
          select: {
            coachId: true
          }
        }
      }
    });

    if (!existing) {
      throw new PricingTierError("Pricing tier not found", 404);
    }

    ensureCoachAccess(existing.marketingProfile.coachId, requester);

    if (isPopular) {
      await prisma.pricingTier.updateMany({
        where: {
          marketingProfileId: existing.marketingProfileId,
          id: { not: tierId }
        },
        data: {
          isPopular: false
        }
      });
    }

    const tier = await prisma.pricingTier.update({
      where: { id: tierId },
      data: {
        isPopular
      }
    });

    return {
      id: tier.id,
      name: tier.name,
      price: toNumber(tier.price),
      currency: tier.currency,
      billingCycle: tier.billingCycle,
      features: tier.features,
      isPopular: tier.isPopular,
      isActive: tier.isActive,
      createdAt: tier.createdAt
    };
  }
};
