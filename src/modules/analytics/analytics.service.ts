import dayjs from "dayjs";
import { prisma } from "../../lib/prisma";
import { analyticsRepository } from "./analytics.repository";

export class AnalyticsError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AnalyticsError";
  }
}

function toNumber(value: any) {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

export const analyticsService = {
  getCoachAnalyticsDashboard: async (coachId: string) => {
    const analytics = await analyticsRepository.getOrCreateAnalytics(coachId);

    if (!analytics) {
      throw new AnalyticsError("Analytics not found", 404);
    }

    const relationships = await prisma.coachClientRelationship.findMany({
      where: { coachId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const workoutPlans = await prisma.workoutPlan.findMany({
      where: { coachId },
      include: {
        workoutDays: true
      }
    });

    return {
      ...analytics,
      totalClients: relationships.length,
      activeClients: relationships.filter(r => r.status === "ACTIVE").length,
      totalWorkoutPlans: workoutPlans.length,
      relationships: relationships
    };
  },

  calculateCoachMetrics: async (coachId: string) => {
    const relationships = await prisma.coachClientRelationship.findMany({
      where: { coachId },
      include: {
        client: true,
        workoutPlan: {
          include: {
            workoutDays: true,
            workoutLogs: true
          }
        }
      }
    });

    const activeCount = relationships.filter(r => r.status === "ACTIVE").length;
    const totalCount = relationships.length;

    let totalComplianceRate = 0;
    relationships.forEach(rel => {
      if (rel.workoutPlan) {
        const totalWorkouts = rel.workoutPlan.workoutDays.length;
        const completedWorkouts = rel.workoutPlan.workoutLogs.filter(
          log => log.completedAt
        ).length;
        totalComplianceRate += totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
      }
    });

    const avgComplianceRate = relationships.length > 0
      ? Number((totalComplianceRate / relationships.length).toFixed(2))
      : 0;

    await analyticsRepository.updateCoachAnalytics(coachId, {
      totalClients: totalCount,
      activeClients: activeCount,
      avgComplianceRate: avgComplianceRate
    });

    return {
      totalClients: totalCount,
      activeClients: activeCount,
      avgComplianceRate,
      weeklyActiveClients: activeCount
    };
  },

  getClientProgressAnalytics: async (coachId: string, clientId: string) => {
    const relationship = await prisma.coachClientRelationship.findFirst({
      where: { coachId, clientId },
      include: {
        workoutPlan: {
          include: {
            workoutDays: true,
            workoutLogs: {
              include: {
                exercises: true
              }
            }
          }
        }
      }
    });

    if (!relationship) {
      throw new AnalyticsError("Relationship not found", 404);
    }

    if (!relationship.workoutPlan) {
      return {
        clientId,
        workoutCompletionRate: 0,
        totalWorkouts: 0,
        completedWorkouts: 0,
        averageRating: 0
      };
    }

    const workoutPlan = relationship.workoutPlan;
    const totalWorkouts = workoutPlan.workoutDays.length;
    const completedWorkouts = workoutPlan.workoutLogs.filter(
      log => log.completedAt
    ).length;

    const completionRate = totalWorkouts > 0
      ? Number(((completedWorkouts / totalWorkouts) * 100).toFixed(2))
      : 0;

    const ratings = workoutPlan.workoutLogs
      .filter(log => log.rating)
      .map(log => Number(log.rating));

    const averageRating = ratings.length > 0
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
      : 0;

    return {
      clientId,
      workoutCompletionRate: completionRate,
      totalWorkouts,
      completedWorkouts,
      averageRating
    };
  },

  getTopPerformingClients: async (coachId: string, limit: number = 5) => {
    const relationships = await prisma.coachClientRelationship.findMany({
      where: { coachId, status: "ACTIVE" },
      include: {
        client: true,
        workoutPlan: {
          include: {
            workoutLogs: true
          }
        }
      }
    });

    const clientsWithMetrics = relationships
      .map(rel => {
        const completedWorkouts = rel.workoutPlan?.workoutLogs.filter(
          log => log.completedAt
        ).length || 0;
        const totalWorkouts = rel.workoutPlan?.workoutDays?.length || 0;
        const completionRate = totalWorkouts > 0
          ? Number(((completedWorkouts / totalWorkouts) * 100).toFixed(2))
          : 0;

        return {
          client: rel.client,
          completionRate,
          lastActivityAt: rel.workoutPlan?.workoutLogs?.[0]?.completedAt || rel.startDate
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, limit);

    return clientsWithMetrics;
  }
};

