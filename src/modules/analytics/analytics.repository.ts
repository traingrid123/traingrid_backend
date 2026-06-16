import { prisma } from "../../lib/prisma";

export const coachProfileArgs = {
  include: {
    analytics: true,
    certifications: true,
    _count: {
      select: {
        clients: true,
        workoutPlans: true
      }
    }
  }
};

export const analyticsRepository = {
  getCoachAnalytics: async (coachId: string) => {
    return prisma.coachAnalytics.findUnique({
      where: { coachId },
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });
  },

  getCoachAnalyticsByCoachId: async (coachId: string) => {
    const analytics = await prisma.coachAnalytics.findUnique({
      where: { coachId }
    });

    const relationships = await prisma.coachClientRelationship.findMany({
      where: { coachId }
    });

    return {
      ...analytics,
      _relationships: relationships
    };
  },

  updateCoachAnalytics: async (coachId: string, data: Record<string, any>) => {
    return prisma.coachAnalytics.update({
      where: { coachId },
      data: {
        ...data,
        lastUpdatedAt: new Date()
      }
    });
  },

  getOrCreateAnalytics: async (coachId: string) => {
    const existing = await prisma.coachAnalytics.findUnique({
      where: { coachId }
    });

    if (existing) {
      return existing;
    }

    return prisma.coachAnalytics.create({
      data: {
        coachId,
        totalClients: 0,
        activeClients: 0,
        weeklyActiveClients: 0
      }
    });
  },

  getAllCoachesAnalytics: async (limit: number = 10, skip: number = 0) => {
    return prisma.coachAnalytics.findMany({
      include: {
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: limit,
      skip,
      orderBy: {
        totalClients: "desc"
      }
    });
  }
};

