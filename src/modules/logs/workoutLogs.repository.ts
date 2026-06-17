import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";

export const workoutLogsRepository = {
  async create(clientId: string, data: {
    workoutDayId?: string;
    loggedAt: Date;
    isCompleted: boolean;
    durationMinutes?: number;
    perceivedEffort?: number;
    notes?: string;
    exercises: Array<{ exerciseId?: string; exerciseName: string; sets?: unknown; notes?: string }>;
  }) {
    const logDate = dayjs(data.loggedAt).startOf("day").toDate();

    // If no workoutDayId, always create a new log (no upsert key)
    if (!data.workoutDayId) {
      return prisma.workoutLog.create({
        data: {
          clientId,
          loggedAt: data.loggedAt,
          logDate,
          isCompleted: data.isCompleted,
          durationMinutes: data.durationMinutes,
          perceivedEffort: data.perceivedEffort,
          notes: data.notes,
          exerciseLogs: {
            create: data.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              sets: ex.sets ?? undefined,
              notes: ex.notes
            }))
          }
        },
        include: { exerciseLogs: true }
      });
    }

    return prisma.workoutLog.upsert({
      where: {
        clientId_workoutDayId_logDate: {
          clientId,
          workoutDayId: data.workoutDayId,
          logDate
        }
      },
      create: {
        clientId,
        workoutDayId: data.workoutDayId,
        loggedAt: data.loggedAt,
        logDate,
        isCompleted: data.isCompleted,
        durationMinutes: data.durationMinutes,
        perceivedEffort: data.perceivedEffort,
        notes: data.notes,
        exerciseLogs: {
          create: data.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: ex.sets ?? undefined,
            notes: ex.notes
          }))
        }
      },
      update: {
        isCompleted: data.isCompleted,
        durationMinutes: data.durationMinutes,
        perceivedEffort: data.perceivedEffort,
        notes: data.notes,
        loggedAt: data.loggedAt
      },
      include: { exerciseLogs: true }
    });
  },

  async list(clientId: string, startDate?: string, endDate?: string, limit = 20, offset = 0) {
    const where = {
      clientId,
      ...(startDate || endDate ? {
        logDate: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {})
        }
      } : {})
    };

    const [items, total] = await Promise.all([
      prisma.workoutLog.findMany({
        where,
        include: { exerciseLogs: true, workoutDay: { select: { id: true, title: true, dayOfWeek: true } } },
        orderBy: { logDate: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.workoutLog.count({ where })
    ]);

    return { items, total };
  },

  async findById(logId: string) {
    return prisma.workoutLog.findUnique({
      where: { id: logId },
      include: { exerciseLogs: { include: { exercise: true } }, workoutDay: true }
    });
  }
};
