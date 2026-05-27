import { prisma } from "../../lib/prisma";

export const progressRepository = {
  getClientProgressHistory: async (clientId: string, limit: number = 30) => {
    return prisma.workoutLog.findMany({
      where: {
        workoutPlan: {
          coachClientRelationships: {
            some: { clientId }
          }
        }
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        exercises: true
      }
    });
  },

  getClientStats: async (clientId: string) => {
    const workoutLogs = await prisma.workoutLog.findMany({
      where: {
        workoutPlan: {
          coachClientRelationships: {
            some: { clientId }
          }
        }
      },
      include: {
        exercises: true
      }
    });

    return {
      totalWorkouts: workoutLogs.length,
      completedWorkouts: workoutLogs.filter(w => w.completedAt).length,
      averageRating: workoutLogs.length > 0
        ? workoutLogs
          .filter(w => w.rating)
          .map(w => Number(w.rating))
          .reduce((a, b) => a + b, 0) / workoutLogs.length
        : 0
    };
  }
};
