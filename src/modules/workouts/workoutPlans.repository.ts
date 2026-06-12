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

  listCoachPlans(params: {
    coachId: string;
    page: number;
    limit: number;
    search?: string;
    level?: any;
    tag?: string;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = {
      coachId: params.coachId,
      ...(params.archivedOnly
        ? { archivedAt: { not: null } }
        : params.includeArchived
        ? {}
        : { archivedAt: null }),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
              { goal: { contains: params.search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(params.level ? { level: params.level } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {})
    };

    return prisma.workoutPlan.findMany({
      where,
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

  countCoachPlans(params: {
    coachId: string;
    search?: string;
    level?: any;
    tag?: string;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  }) {
    const where: any = {
      coachId: params.coachId,
      ...(params.archivedOnly
        ? { archivedAt: { not: null } }
        : params.includeArchived
        ? {}
        : { archivedAt: null }),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
              { goal: { contains: params.search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(params.level ? { level: params.level } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {})
    };
    return prisma.workoutPlan.count({ where });
  },

  setArchived(params: { coachId: string; planId: string; archived: boolean }) {
    return prisma.workoutPlan.updateMany({
      where: { id: params.planId, coachId: params.coachId },
      data: { archivedAt: params.archived ? new Date() : null }
    });
  },

  snapshotVersion(
    tx: Prisma.TransactionClient,
    params: { workoutPlanId: string; version: number; snapshot: Prisma.InputJsonValue }
  ) {
    return tx.workoutPlanVersion.create({
      data: {
        workoutPlanId: params.workoutPlanId,
        version: params.version,
        snapshot: params.snapshot
      }
    });
  },

  findLatestVersion(workoutPlanId: string) {
    return prisma.workoutPlanVersion.findFirst({
      where: { workoutPlanId },
      orderBy: { version: "desc" }
    });
  },

  migrateActiveAssignmentsToVersion(params: {
    workoutPlanId: string;
    planVersionId: string;
    pinnedVersion: number;
  }) {
    return prisma.workoutPlanAssignment.updateMany({
      where: { workoutPlanId: params.workoutPlanId, isActive: true },
      data: {
        planVersionId: params.planVersionId,
        pinnedVersion: params.pinnedVersion
      }
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
        weightKg?: number;
        restSeconds?: number;
        durationSecs?: number;
        tempo?: string;
        rpe?: number;
        videoUrl?: string;
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
                weightKg: exercise.weightKg,
                restSeconds: exercise.restSeconds,
                durationSecs: exercise.durationSecs,
                tempo: exercise.tempo,
                rpe: exercise.rpe,
                videoUrl: exercise.videoUrl,
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
                weightKg: exercise.weightKg,
                restSeconds: exercise.restSeconds,
                durationSecs: exercise.durationSecs,
                tempo: exercise.tempo,
                rpe: exercise.rpe,
                videoUrl: exercise.videoUrl,
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
