import { prisma } from "../../lib/prisma";

export class ProgressError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ProgressError";
  }
}

export const progressService = {
  getClientProgress: async (clientId: string, coachId: string) => {
    const relationship = await prisma.coachClientRelationship.findFirst({
      where: { clientId, coachId },
      include: {
        workoutPlan: {
          include: {
            workoutLogs: true,
            workoutDays: true
          }
        }
      }
    });

    if (!relationship) {
      throw new ProgressError("Relationship not found", 404);
    }

    return relationship;
  },

  getProgressChart: async (clientId: string, coachId: string, days: number = 30) => {
    const relationship = await prisma.coachClientRelationship.findFirst({
      where: { clientId, coachId },
      include: {
        workoutPlan: {
          include: {
            workoutLogs: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                }
              },
              orderBy: { createdAt: "asc" }
            }
          }
        }
      }
    });

    if (!relationship?.workoutPlan) {
      return { logs: [] };
    }

    return {
      logs: relationship.workoutPlan.workoutLogs.map(log => ({
        date: log.createdAt,
        completed: !!log.completedAt,
        rating: log.rating,
        duration: log.duration
      }))
    };
  },

  getProgressMetrics: async (clientId: string, coachId: string) => {
    const relationship = await prisma.coachClientRelationship.findFirst({
      where: { clientId, coachId },
      include: {
        workoutPlan: {
          include: {
            workoutDays: true,
            workoutLogs: true
          }
        }
      }
    });

    if (!relationship?.workoutPlan) {
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        completionRate: 0,
        averageRating: 0,
        streakDays: 0
      };
    }

    const workoutPlan = relationship.workoutPlan;
    const completedWorkouts = workoutPlan.workoutLogs.filter(log => log.completedAt).length;
    const totalWorkouts = workoutPlan.workoutDays.length;
    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    const ratings = workoutPlan.workoutLogs
      .filter(log => log.rating)
      .map(log => Number(log.rating));
    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      totalWorkouts,
      completedWorkouts,
      completionRate: Number(completionRate.toFixed(2)),
      averageRating: Number(averageRating.toFixed(2)),
      streakDays: 0
    };
  },

  getProgressMilestones: async (clientId: string, coachId: string) => {
    const relationship = await prisma.coachClientRelationship.findFirst({
      where: { clientId, coachId }
    });

    if (!relationship) {
      throw new ProgressError("Relationship not found", 404);
    }

    const daysSinceStart = Math.floor(
      (Date.now() - relationship.startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    const milestones = [
      { days: 7, name: "First Week Champion", achieved: daysSinceStart >= 7 },
      { days: 30, name: "Monthly Master", achieved: daysSinceStart >= 30 },
      { days: 90, name: "Quarterly Warrior", achieved: daysSinceStart >= 90 },
      { days: 180, name: "Half Year Hero", achieved: daysSinceStart >= 180 },
      { days: 365, name: "Annual Legend", achieved: daysSinceStart >= 365 }
    ];

    return milestones;
  }
};
