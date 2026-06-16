import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";

export const nutritionLogsService = {
  async logMeal(clientId: string, data: {
    mealSectionId?: string;
    isCompleted: boolean;
    caloriesConsumed?: number;
    proteinConsumed?: number;
    carbsConsumed?: number;
    fatsConsumed?: number;
    notes?: string;
    loggedAt?: string;
  }) {
    const loggedAt = data.loggedAt ? new Date(data.loggedAt) : new Date();
    return prisma.nutritionLog.create({
      data: {
        clientId,
        mealSectionId: data.mealSectionId,
        isCompleted: data.isCompleted,
        caloriesConsumed: data.caloriesConsumed,
        proteinConsumed: data.proteinConsumed,
        carbsConsumed: data.carbsConsumed,
        fatsConsumed: data.fatsConsumed,
        notes: data.notes,
        loggedAt
      }
    });
  },

  async getTodayLogs(clientId: string) {
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();

    return prisma.nutritionLog.findMany({
      where: { clientId, loggedAt: { gte: todayStart, lte: todayEnd } },
      include: { mealSection: true },
      orderBy: { loggedAt: "asc" }
    });
  },

  async listLogs(clientId: string, startDate?: string, endDate?: string) {
    return prisma.nutritionLog.findMany({
      where: {
        clientId,
        ...(startDate || endDate ? {
          loggedAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {})
          }
        } : {})
      },
      include: { mealSection: true },
      orderBy: { loggedAt: "desc" }
    });
  }
};
