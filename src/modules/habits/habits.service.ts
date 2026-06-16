import { prisma } from "../../lib/prisma";

export class HabitsError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HabitsError";
  }
}

export const habitsService = {
  createHabit: async (data: any) => {
    return prisma.habit.create({
      data
    });
  },

  getClientHabits: async (clientId: string) => {
    return prisma.habit.findMany({
      where: { clientId },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 30
        }
      }
    });
  },

  getHabitDetail: async (habitId: string) => {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!habit) {
      throw new HabitsError("Habit not found", 404);
    }

    return habit;
  },

  logHabit: async (habitId: string, data: any) => {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    if (!habit) {
      throw new HabitsError("Habit not found", 404);
    }

    return prisma.habitLog.create({
      data: {
        habitId,
        ...data
      }
    });
  },

  updateHabit: async (habitId: string, data: any) => {
    return prisma.habit.update({
      where: { id: habitId },
      data
    });
  },

  deleteHabit: async (habitId: string) => {
    return prisma.habit.delete({
      where: { id: habitId }
    });
  },

  getHabitStats: async (habitId: string) => {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: true
      }
    });

    if (!habit) {
      throw new HabitsError("Habit not found", 404);
    }

    const completedLogs = habit.logs.filter(log => log.completed).length;
    const totalLogs = habit.logs.length;
    const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;

    return {
      habitId,
      habitName: habit.name,
      totalLogs,
      completedLogs,
      completionRate: Number(completionRate.toFixed(2)),
      recentLogs: habit.logs.slice(0, 7)
    };
  }
};
