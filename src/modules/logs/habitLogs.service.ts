import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";

export const habitLogsService = {
  async logHabit(clientId: string, habitId: string, data: {
    isCompleted: boolean;
    value?: string;
    notes?: string;
    loggedAt?: string;
  }) {
    const loggedAt = data.loggedAt ? new Date(data.loggedAt) : new Date();
    return prisma.habitLog.create({
      data: { clientId, habitId, isCompleted: data.isCompleted, value: data.value, notes: data.notes, loggedAt }
    });
  },

  async getTodayLogs(clientId: string) {
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();

    const habits = await prisma.habit.findMany({
      where: { clientId, isActive: true },
      include: {
        habitLogs: {
          where: { clientId, loggedAt: { gte: todayStart, lte: todayEnd } },
          orderBy: { loggedAt: "desc" },
          take: 1
        }
      }
    });

    return habits.map((habit) => ({
      ...habit,
      todayLog: habit.habitLogs[0] ?? null,
      isCompletedToday: habit.habitLogs[0]?.isCompleted ?? false
    }));
  },

  async listLogs(clientId: string, habitId?: string, startDate?: string, endDate?: string) {
    return prisma.habitLog.findMany({
      where: {
        clientId,
        ...(habitId ? { habitId } : {}),
        ...(startDate || endDate ? {
          loggedAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {})
          }
        } : {})
      },
      include: { habit: true },
      orderBy: { loggedAt: "desc" }
    });
  }
};
