import { DropOffRisk, Prisma, WeekDay } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import {
  AssignWorkoutPlanInput,
  CompleteWorkoutInput,
  CreateWorkoutPlanInput,
  DuplicateWorkoutPlanInput,
  UpdateWorkoutPlanInput,
  WorkoutListFiltersInput,
  WorkoutPaginationInput
} from "./workouts.schema";
import {
  computeDropOffRisk,
  computeWorkoutMetrics,
  estimateAssignedWorkouts
} from "./workout.metrics";
import { workoutPlansRepository } from "./workoutPlans.repository";

type Requester = {
  role: "coach" | "client";
  userId: string;
};

export class WorkoutError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "WorkoutError";
  }
}

function ensureCoachAccess(coachId: string, requester?: Requester) {
  if (!requester) {
    return;
  }

  if (requester.role !== "coach" || requester.userId !== coachId) {
    throw new WorkoutError("You are not allowed to access this coach resource", 403);
  }
}

function ensureClientAccess(clientId: string, requester?: Requester) {
  if (!requester) {
    return;
  }

  if (requester.role !== "client" || requester.userId !== clientId) {
    throw new WorkoutError("You are not allowed to access this client resource", 403);
  }
}

function mapPlan(plan: any) {
  return {
    id: plan.id,
    coachId: plan.coachId,
    title: plan.title,
    description: plan.description,
    goal: plan.goal,
    level: plan.level,
    durationWeeks: plan.durationWeeks,
    estimatedMinutes: plan.estimatedMinutes,
    isTemplate: plan.isTemplate,
    isDraft: plan.isDraft,
    tags: plan.tags,
    version: plan.version,
    archivedAt: plan.archivedAt,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    days: (plan.workoutDays ?? []).map((day: any) => ({
      id: day.id,
      title: day.title,
      weekNumber: day.weekNumber,
      dayOfWeek: day.dayOfWeek,
      orderIndex: day.orderIndex,
      isRestDay: day.isRestDay,
      notes: day.notes,
      exercises: (day.workoutDayExercises ?? []).map((entry: any) => ({
        id: entry.id,
        exerciseId: entry.exerciseId,
        exerciseName: entry.exercise?.name,
        muscleGroup: entry.exercise?.muscleGroup,
        equipment: entry.exercise?.equipment,
        level: entry.exercise?.level,
        sets: entry.sets,
        reps: entry.reps,
        weightKg: entry.weightKg ? Number(entry.weightKg) : null,
        restSeconds: entry.restSeconds,
        durationSecs: entry.durationSecs,
        tempo: entry.tempo,
        rpe: entry.rpe ? Number(entry.rpe) : null,
        videoUrl: entry.videoUrl ?? entry.exercise?.videoUrl ?? null,
        notes: entry.notes,
        orderIndex: entry.orderIndex
      }))
    }))
  };
}

function buildSnapshot(plan: any) {
  return {
    version: plan.version,
    plan: mapPlan(plan)
  };
}

async function ensureEntitiesExist(params: {
  coachId: string;
  clientId?: string;
  planId?: string;
}) {
  const [coach, client, plan] = await Promise.all([
    workoutPlansRepository.findCoachById(params.coachId),
    params.clientId ? workoutPlansRepository.findClientById(params.clientId) : null,
    params.planId
      ? workoutPlansRepository.findCoachPlanById(params.coachId, params.planId)
      : null
  ]);

  if (!coach) {
    throw new WorkoutError("Coach not found", 404);
  }
  if (params.clientId && !client) {
    throw new WorkoutError("Client not found", 404);
  }
  if (params.planId && !plan) {
    throw new WorkoutError("Workout plan not found", 404);
  }

  return { coach, client, plan };
}

export const workoutPlansService = {
  async createPlan(coachId: string, input: CreateWorkoutPlanInput, requester?: Requester) {
    ensureCoachAccess(coachId, requester);
    await ensureEntitiesExist({ coachId });

    const created = await workoutPlansRepository.createPlan({
      coach: {
        connect: {
          id: coachId
        }
      },
      title: input.title,
      description: input.description ?? null,
      goal: input.goal ?? null,
      level: input.level,
      durationWeeks: input.durationWeeks ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      isTemplate: input.isTemplate,
      isDraft: input.isDraft,
      tags: input.tags,
      workoutDays: {
        create: input.days.map((day) => ({
          title: day.title ?? null,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek ?? null,
          orderIndex: day.orderIndex,
          isRestDay: day.isRestDay,
          notes: day.notes ?? null,
          workoutDayExercises: {
            create: day.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              sets: exercise.sets ?? null,
              reps: exercise.reps ?? null,
              weightKg: exercise.weightKg ?? null,
              restSeconds: exercise.restSeconds ?? null,
              durationSecs: exercise.durationSecs ?? null,
              tempo: exercise.tempo ?? null,
              rpe: exercise.rpe ?? null,
              videoUrl: exercise.videoUrl ?? null,
              notes: exercise.notes ?? null,
              orderIndex: exercise.orderIndex
            }))
          }
        }))
      }
    });

    return mapPlan(created);
  },

  async listCoachPlans(
    coachId: string,
    filters: WorkoutListFiltersInput,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    await ensureEntitiesExist({ coachId });

    const baseParams = {
      coachId,
      search: filters.search,
      level: filters.level,
      tag: filters.tag,
      includeArchived: filters.includeArchived,
      archivedOnly: filters.archivedOnly
    };

    const [items, total] = await Promise.all([
      workoutPlansRepository.listCoachPlans({
        ...baseParams,
        page: filters.page,
        limit: filters.limit
      }),
      workoutPlansRepository.countCoachPlans(baseParams)
    ]);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        goal: item.goal,
        level: item.level,
        durationWeeks: item.durationWeeks,
        estimatedMinutes: item.estimatedMinutes,
        isTemplate: item.isTemplate,
        isDraft: item.isDraft,
        archivedAt: item.archivedAt,
        tags: item.tags,
        version: item.version,
        updatedAt: item.updatedAt,
        workoutDaysCount: item._count.workoutDays,
        activeAssignmentsCount: item._count.assignments
      })),
      page: filters.page,
      limit: filters.limit,
      total
    };
  },

  async setArchived(
    coachId: string,
    planId: string,
    archived: boolean,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    const result = await workoutPlansRepository.setArchived({
      coachId,
      planId,
      archived
    });
    if (result.count === 0) {
      throw new WorkoutError("Workout plan not found", 404);
    }
    return { id: planId, archived };
  },

  async getCoachPlan(coachId: string, planId: string, requester?: Requester) {
    ensureCoachAccess(coachId, requester);
    const plan: any = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!plan) {
      throw new WorkoutError("Workout plan not found", 404);
    }

    return {
      ...mapPlan(plan),
      activeAssignments: plan.assignments
    };
  },

  async updateCoachPlan(
    coachId: string,
    planId: string,
    input: UpdateWorkoutPlanInput,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    const existing = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!existing) {
      throw new WorkoutError("Workout plan not found", 404);
    }

    // Snapshot the existing version before mutation
    const previousSnapshotData = buildSnapshot(existing);

    const updateResult = await workoutPlansRepository.updatePlanByIdVersion({
      coachId,
      planId,
      expectedVersion: input.expectedVersion,
      data: {
        title: input.title,
        description: input.description === undefined ? undefined : input.description,
        goal: input.goal === undefined ? undefined : input.goal,
        level: input.level,
        durationWeeks: input.durationWeeks === undefined ? undefined : input.durationWeeks,
        estimatedMinutes:
          input.estimatedMinutes === undefined ? undefined : input.estimatedMinutes,
        isTemplate: input.isTemplate,
        isDraft: input.isDraft,
        tags: input.tags
      }
    });

    if (updateResult.count === 0) {
      throw new WorkoutError(
        "Workout plan version mismatch. Refresh and retry.",
        409
      );
    }

    if (input.days) {
      const days = input.days;
      await prisma.$transaction(async (tx) => {
        await workoutPlansRepository.replacePlanDays(
          tx,
          planId,
          days.map((day) => ({
            title: day.title,
            weekNumber: day.weekNumber,
            dayOfWeek: day.dayOfWeek,
            orderIndex: day.orderIndex,
            isRestDay: day.isRestDay,
            notes: day.notes,
            exercises: day.exercises
          }))
        );
      });
    }

    // Persist the prior version snapshot, then optionally migrate active assignments
    await prisma.$transaction(async (tx) => {
      await workoutPlansRepository.snapshotVersion(tx, {
        workoutPlanId: planId,
        version: (existing as any).version,
        snapshot: previousSnapshotData as unknown as Prisma.InputJsonValue
      });
    });

    const refreshed = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!refreshed) {
      throw new WorkoutError("Workout plan not found after update", 404);
    }

    if (input.propagation === "MIGRATE_NEW") {
      // Snapshot the new version and migrate active assignments
      const newSnapshot = await prisma.workoutPlanVersion.create({
        data: {
          workoutPlanId: planId,
          version: (refreshed as any).version,
          snapshot: buildSnapshot(refreshed) as unknown as Prisma.InputJsonValue
        }
      });
      await workoutPlansRepository.migrateActiveAssignmentsToVersion({
        workoutPlanId: planId,
        planVersionId: newSnapshot.id,
        pinnedVersion: (refreshed as any).version
      });
    }

    return mapPlan(refreshed);
  },

  async deleteCoachPlan(coachId: string, planId: string, requester?: Requester) {
    ensureCoachAccess(coachId, requester);
    const existing = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!existing) {
      throw new WorkoutError("Workout plan not found", 404);
    }
    await prisma.workoutPlan.delete({ where: { id: planId } });
    return { id: planId, deleted: true };
  },

  async duplicateCoachPlan(
    coachId: string,
    planId: string,
    input: DuplicateWorkoutPlanInput,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    const source = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!source) {
      throw new WorkoutError("Workout plan not found", 404);
    }

    const copy = await prisma.$transaction(async (tx) => {
      const duplicated = await workoutPlansRepository.duplicatePlan(tx, source, {
        title: input.title,
        isDraft: input.isDraft
      });

      if (input.mode === "MONTHLY" && (duplicated.durationWeeks ?? 0) < 4) {
        return tx.workoutPlan.update({
          where: { id: duplicated.id },
          data: {
            durationWeeks: 4
          },
          include: {
            workoutDays: {
              orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
              include: {
                workoutDayExercises: {
                  orderBy: { orderIndex: "asc" },
                  include: { exercise: true }
                }
              }
            }
          }
        });
      }

      return duplicated;
    });

    return mapPlan(copy);
  },

  async assignPlan(
    coachId: string,
    input: AssignWorkoutPlanInput,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);

    const clientIds = input.clientIds && input.clientIds.length > 0
      ? input.clientIds
      : input.clientId
      ? [input.clientId]
      : [];

    if (clientIds.length === 0) {
      throw new WorkoutError("clientId or clientIds is required", 400);
    }

    const plan = await workoutPlansRepository.findCoachPlanById(coachId, input.workoutPlanId);
    if (!plan) throw new WorkoutError("Workout plan not found", 404);

    // Snapshot the current plan version for this assignment cohort
    const planVersion = await prisma.workoutPlanVersion.upsert({
      where: {
        workoutPlanId_version: {
          workoutPlanId: plan.id,
          version: (plan as any).version
        }
      },
      create: {
        workoutPlanId: plan.id,
        version: (plan as any).version,
        snapshot: buildSnapshot(plan) as unknown as Prisma.InputJsonValue
      },
      update: {}
    });

    const created: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const clientId of clientIds) {
        const client = await tx.client.findUnique({
          where: { id: clientId },
          select: { id: true }
        });
        if (!client) {
          throw new WorkoutError(`Client ${clientId} not found`, 404);
        }

        await tx.workoutPlanAssignment.updateMany({
          where: { coachId, clientId, isActive: true },
          data: { isActive: false, endDate: input.startDate }
        });

        const assignment = await tx.workoutPlanAssignment.create({
          data: {
            coachId,
            clientId,
            workoutPlanId: input.workoutPlanId,
            planVersionId: planVersion.id,
            pinnedVersion: (plan as any).version,
            startDate: input.startDate,
            endDate: input.endDate ?? null,
            isActive: true,
            assignedBy: requester?.userId ?? coachId
          }
        });

        await tx.coachClientRelationship.upsert({
          where: { coachId_clientId: { coachId, clientId } },
          update: { workoutPlanId: input.workoutPlanId },
          create: {
            coachId,
            clientId,
            status: "ACTIVE",
            startDate: input.startDate,
            workoutPlanId: input.workoutPlanId
          }
        });

        created.push(assignment);
      }
    });

    return { count: created.length, assignments: created };
  },

  async getTodayWorkout(clientId: string, requester?: Requester) {
    ensureClientAccess(clientId, requester);
    const assignment: any =
      await workoutPlansRepository.findActiveAssignmentForClient(clientId);
    if (!assignment) {
      throw new WorkoutError("No active workout assignment found", 404);
    }

    const todayWeekday = dayjs().format("dddd").toUpperCase() as WeekDay;
    const todayWorkout =
      assignment.workoutPlan.workoutDays.find(
        (day: any) => day.dayOfWeek === todayWeekday && !day.isRestDay
      ) ??
      assignment.workoutPlan.workoutDays.find((day: any) => !day.isRestDay) ??
      null;

    if (!todayWorkout) {
      return {
        assignmentId: assignment.id,
        planId: assignment.workoutPlanId,
        today: null
      };
    }

    return {
      assignmentId: assignment.id,
      coach: {
        id: assignment.coach.id,
        name: assignment.coach.fullName
      },
      planId: assignment.workoutPlanId,
      planTitle: assignment.workoutPlan.title,
      today: {
        id: todayWorkout.id,
        title: todayWorkout.title ?? assignment.workoutPlan.title,
        weekNumber: todayWorkout.weekNumber,
        dayOfWeek: todayWorkout.dayOfWeek,
        isRestDay: todayWorkout.isRestDay,
        notes: todayWorkout.notes,
        exercises: todayWorkout.workoutDayExercises.map((entry: any) => ({
          id: entry.id,
          exerciseId: entry.exerciseId,
          exerciseName: entry.exercise.name,
          sets: entry.sets,
          reps: entry.reps,
          restSeconds: entry.restSeconds,
          durationSecs: entry.durationSecs,
          notes: entry.notes,
          orderIndex: entry.orderIndex
        }))
      }
    };
  },

  async getWorkoutDetail(clientId: string, workoutDayId: string, requester?: Requester) {
    ensureClientAccess(clientId, requester);
    const assignment: any = await workoutPlansRepository.findWorkoutDayInClientPlan(
      clientId,
      workoutDayId
    );
    if (!assignment || assignment.workoutPlan.workoutDays.length === 0) {
      throw new WorkoutError("Workout not found for this client", 404);
    }

    const day = assignment.workoutPlan.workoutDays[0];
    return {
      assignmentId: assignment.id,
      planId: assignment.workoutPlanId,
      planTitle: assignment.workoutPlan.title,
      workout: {
        id: day.id,
        title: day.title ?? assignment.workoutPlan.title,
        weekNumber: day.weekNumber,
        dayOfWeek: day.dayOfWeek,
        orderIndex: day.orderIndex,
        isRestDay: day.isRestDay,
        notes: day.notes,
        exercises: day.workoutDayExercises.map((entry: any) => ({
          id: entry.id,
          exerciseId: entry.exerciseId,
          exerciseName: entry.exercise.name,
          sets: entry.sets,
          reps: entry.reps,
          restSeconds: entry.restSeconds,
          durationSecs: entry.durationSecs,
          notes: entry.notes,
          orderIndex: entry.orderIndex
        }))
      }
    };
  },

  async completeWorkout(
    clientId: string,
    workoutDayId: string,
    input: CompleteWorkoutInput,
    requester?: Requester
  ) {
    ensureClientAccess(clientId, requester);
    const assignment = await workoutPlansRepository.findWorkoutDayInClientPlan(
      clientId,
      workoutDayId
    );
    if (!assignment) {
      throw new WorkoutError("Workout not found for this client", 404);
    }

    if (input.sourceEventId) {
      const existingByEvent = await workoutPlansRepository.findWorkoutByEventId(
        input.sourceEventId
      );
      if (existingByEvent) {
        return {
          idempotent: true,
          workoutLog: existingByEvent
        };
      }
    }

    const loggedAt = input.loggedAt ?? new Date();
    const logDate = dayjs(loggedAt).startOf("day").toDate();

    const existingByDay = await workoutPlansRepository.findWorkoutByClientDayDate(
      clientId,
      workoutDayId,
      logDate
    );
    if (existingByDay) {
      return {
        idempotent: true,
        workoutLog: existingByDay
      };
    }

    try {
      const created = await workoutPlansRepository.createWorkoutCompletion({
        clientId,
        workoutDayId,
        loggedAt,
        logDate,
        sourceEventId: input.sourceEventId,
        durationMinutes: input.durationMinutes,
        perceivedEffort: input.perceivedEffort,
        notes: input.notes,
        exerciseLogs: input.exerciseLogs?.map((entry) => ({
          exerciseId: entry.exerciseId,
          exerciseName: entry.exerciseName,
          sets: entry.sets,
          notes: entry.notes
        }))
      });

      return {
        idempotent: false,
        workoutLog: created
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const duplicate = await workoutPlansRepository.findWorkoutByClientDayDate(
          clientId,
          workoutDayId,
          logDate
        );
        if (duplicate) {
          return {
            idempotent: true,
            workoutLog: duplicate
          };
        }
      }
      throw error;
    }
  },

  async getClientWorkoutAnalytics(clientId: string, requester?: Requester) {
    ensureClientAccess(clientId, requester);
    const assignment: any =
      await workoutPlansRepository.findActiveAssignmentForClient(clientId);
    const logs = await workoutPlansRepository.listClientWorkoutLogs(clientId);

    const assignedWorkouts = assignment
      ? estimateAssignedWorkouts({
          startDate: assignment.startDate,
          workoutDays: assignment.workoutPlan.workoutDays.map((day: any) => ({
            dayOfWeek: day.dayOfWeek,
            isRestDay: day.isRestDay
          }))
        })
      : logs.length;

    const metrics = computeWorkoutMetrics(logs, assignedWorkouts);
    return {
      clientId,
      planId: assignment?.workoutPlanId ?? null,
      completionPercent: metrics.completionPercent,
      totalAssigned: metrics.assignedWorkouts,
      totalCompleted: metrics.completedWorkouts,
      missedWorkoutsCount: metrics.missedWorkouts,
      weeklyWorkoutFrequency: metrics.weeklyFrequency,
      currentStreak: metrics.currentStreak,
      longestStreak: metrics.longestStreak,
      lastWorkoutDate: metrics.lastWorkoutDate,
      mostSkippedWorkoutType: metrics.mostSkippedWorkoutType,
      inactivityDays: metrics.inactivityDays,
      dropOffRiskLevel: computeDropOffRisk(
        metrics.completionPercent,
        metrics.inactivityDays
      )
    };
  },

  async getCoachClientWorkoutAnalytics(
    coachId: string,
    clientId: string,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    const active = await workoutPlansRepository.findActiveAssignmentForCoachClient(
      coachId,
      clientId
    );
    if (!active) {
      throw new WorkoutError("No active workout assignment found", 404);
    }

    const analytics = await this.getClientWorkoutAnalytics(clientId);
    const risk = analytics.dropOffRiskLevel as DropOffRisk;

    await prisma.coachClientRelationship.updateMany({
      where: {
        coachId,
        clientId
      },
      data: {
        dropOffRisk: risk
      }
    });

    return {
      coachId,
      workoutPlanId: active.workoutPlanId,
      ...analytics
    };
  }
};
