import { prisma } from "../../lib/prisma";

export const habitsRepository = {
  getClientHabits: (clientId: string) =>
    prisma.habit.findMany({
      where: { clientId },
      include: {
        logs: true,
        _count: {
          select: {
            logs: true
          }
        }
      }
    }),

  getHabitById: (habitId: string) =>
    prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: true
      }
    }),

  createHabit: (data: any) =>
    prisma.habit.create({
      data
    }),

  updateHabit: (habitId: string, data: any) =>
    prisma.habit.update({
      where: { id: habitId },
      data
    }),

  deleteHabit: (habitId: string) =>
    prisma.habit.delete({
      where: { id: habitId }
    }),

  logHabit: (habitId: string, completed: boolean, notes?: string) =>
    prisma.habitLog.create({
      data: {
        habitId,
        completed,
        notes
      }
    })
};
