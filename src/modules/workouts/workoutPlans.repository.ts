import { Prisma, WeekDay } from "@prisma/client";

import { prisma } from "../../lib/prisma";

const planInclude = {
  workoutDays: {
    orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
    include: {
      workoutDayExercises: {
        orderBy: { orderIndex: "asc" },
        include: {
          exercise: true
        }
      }
    }
  }
};

export const workoutPlansRepository = {
  findCoachById(coachId: string) {
    return prisma.coach.findUnique({
      where: { id: coachId },
      select: { id: true }
    });
  },

  findClientById(clientId: string) {
    return prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true }
    });
  },

  createPlan(input: Prisma.WorkoutPlanCreateInput) {
    return prisma.workoutPlan.create({
      data: input,
      include: planInclude as any
    });
  },

  listCoachPlans(params: { coachId: string; page: number; limit: number }) {
    const skip = (params.page - 1) * params.limit;
    return prisma.workoutPlan.findMany({
      where: { coachId: params.coachId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: params.limit,
      include: {
        _count: {
          select: {
            workoutDays: true,
            assignments: true
          }
        }
      }
    });
  },

  countCoachPlans(coachId: string) {
    return prisma.workoutPlan.count({
      where: { coachId }
    });
  },

  findCoachPlanById(coachId: string, planId: string) {
    return prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        coachId
      },
      include: {
        ...(planInclude as any),
        assignments: {
          where: { isActive: true },
          select: {
            id: true,
            clientId: true,
            startDate: true
          }
        }
      }
    });
  },

  updatePlanByIdVersion(params: {
    coachId: string;
    planId: string;
    expectedVersion: number;
    data: Prisma.WorkoutPlanUpdateInput;
  }) {
    return prisma.workoutPlan.updateMany({
      where: {
        id: params.planId,
        coachId: params.coachId,
        version: params.expectedVersion
      },
      data: {
        ...params.data,
        version: {
          increment: 1
        }
      }
    });
  },

  replacePlanDays(
    tx: Prisma.TransactionClient,
    planId: string,
    days: Array<{
      title?: string;
      weekNumber: number;
      dayOfWeek?: WeekDay;
      orderIndex: number;
      isRestDay: boolean;
      notes?: string;
      exercises: Array<{
        exerciseId: string;
        sets?: number;
        reps?: string;
        restSeconds?: number;
        durationSecs?: number;
        tempo?: string;
        notes?: string;
        orderIndex: number;
      }>;
    }>
  ) {
    return tx.workoutPlan.update({
      where: { id: planId },
      data: {
        workoutDays: {
          deleteMany: {},
          create: days.map((day) => ({
            title: day.title,
            weekNumber: day.weekNumber,
            dayOfWeek: day.dayOfWeek,
            orderIndex: day.orderIndex,
            isRestDay: day.isRestDay,
            notes: day.notes,
            workoutDayExercises: {
              create: day.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                sets: exercise.sets,
                reps: exercise.reps,
                restSeconds: exercise.restSeconds,
                durationSecs: exercise.durationSecs,
                tempo: exercise.tempo,
                notes: exercise.notes,
                orderIndex: exercise.orderIndex
              }))
            }
          }))
        }
      },
      include: planInclude as any
    });
  },

  duplicatePlan(
    tx: Prisma.TransactionClient,
    sourcePlan: any,
    override: { title?: string; isDraft?: boolean }
  ) {
    return tx.workoutPlan.create({
      data: {
        coachId: sourcePlan.coachId,
        title: override.title ?? `${sourcePlan.title} (Copy)`,
        description: sourcePlan.description,
        level: sourcePlan.level,
        durationWeeks: sourcePlan.durationWeeks,
        isTemplate: sourcePlan.isTemplate,
        isDraft: override.isDraft ?? true,
        tags: sourcePlan.tags,
        workoutDays: {
          create: sourcePlan.workoutDays.map((day: any) => ({
            title: day.title,
            weekNumber: day.weekNumber,
            dayOfWeek: day.dayOfWeek,
            orderIndex: day.orderIndex,
            isRestDay: day.isRestDay,
            notes: day.notes,
            workoutDayExercises: {
              create: day.workoutDayExercises.map((exercise: any) => ({
                exerciseId: exercise.exerciseId,
                sets: exercise.sets,
                reps: exercise.reps,
                restSeconds: exercise.restSeconds,
                durationSecs: exercise.durationSecs,
                tempo: exercise.tempo,
                notes: exercise.notes,
                orderIndex: exercise.orderIndex
              }))
            }
          }))
        }
      },
      include: planInclude as any
    });
  },

  findActiveAssignmentForClient(clientId: string) {
    return prisma.workoutPlanAssignment.findFirst({
      where: {
        clientId,
        isActive: true
      },
      orderBy: {
        startDate: "desc"
      },
      include: {
        workoutPlan: {
          include: planInclude as any
        },
        coach: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
  },

  findActiveAssignmentForCoachClient(coachId: string, clientId: string) {
    return prisma.workoutPlanAssignment.findFirst({
      where: {
        coachId,
        clientId,
        isActive: true
      },
      orderBy: {
        startDate: "desc"
      },
      include: {
        workoutPlan: true
      }
    });
  },

  findWorkoutDayInClientPlan(clientId: string, workoutDayId: string) {
    return prisma.workoutPlanAssignment.findFirst({
      where: {
        clientId,
        isActive: true,
        workoutPlan: {
          workoutDays: {
            some: { id: workoutDayId }
          }
        }
      },
      include: {
        workoutPlan: {
          include: {
            workoutDays: {
              where: { id: workoutDayId },
              include: {
                workoutDayExercises: {
                  orderBy: { orderIndex: "asc" },
                  include: { exercise: true }
                }
              }
            }
          }
        }
      }
    });
  },

  findWorkoutByEventId(sourceEventId: string) {
    return prisma.workoutLog.findUnique({
      where: { sourceEventId },
      include: { exerciseLogs: true }
    });
  },

  findWorkoutByClientDayDate(clientId: string, workoutDayId: string, logDate: Date) {
    return prisma.workoutLog.findFirst({
      where: {
        clientId,
        workoutDayId,
        logDate
      },
      include: { exerciseLogs: true }
    });
  },

  createWorkoutCompletion(params: {
    clientId: string;
    workoutDayId: string;
    loggedAt: Date;
    logDate: Date;
    sourceEventId?: string;
    durationMinutes?: number;
    perceivedEffort?: number;
    notes?: string;
    exerciseLogs?: Array<{
      exerciseId?: string;
      exerciseName: string;
      sets?: unknown;
      notes?: string;
    }>;
  }) {
    return prisma.workoutLog.create({
      data: {
        clientId: params.clientId,
        workoutDayId: params.workoutDayId,
        loggedAt: params.loggedAt,
        logDate: params.logDate,
        sourceEventId: params.sourceEventId,
        isCompleted: true,
        durationMinutes: params.durationMinutes,
        perceivedEffort: params.perceivedEffort,
        notes: params.notes,
        exerciseLogs: params.exerciseLogs
          ? {
              create: params.exerciseLogs.map((entry) => ({
                exerciseId: entry.exerciseId ?? null,
                exerciseName: entry.exerciseName,
                sets: (entry.sets ?? undefined) as Prisma.InputJsonValue | undefined,
                notes: entry.notes
              }))
            }
          : undefined
      },
      include: {
        exerciseLogs: true,
        workoutDay: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  },

  listClientWorkoutLogs(clientId: string, limit = 180) {
    return prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { loggedAt: "desc" },
      take: limit,
      include: {
        workoutDay: {
          select: {
            id: true,
            title: true,
            dayOfWeek: true
          }
        }
      }
    });
  }
};
