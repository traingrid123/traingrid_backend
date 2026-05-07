import { DropOffRisk, Prisma, WeekDay } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import {
  AssignWorkoutPlanInput,
  CompleteWorkoutInput,
  CreateWorkoutPlanInput,
  DuplicateWorkoutPlanInput,
  UpdateWorkoutPlanInput,
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
    level: plan.level,
    durationWeeks: plan.durationWeeks,
    isTemplate: plan.isTemplate,
    isDraft: plan.isDraft,
    tags: plan.tags,
    version: plan.version,
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
        restSeconds: entry.restSeconds,
        durationSecs: entry.durationSecs,
        tempo: entry.tempo,
        notes: entry.notes,
        orderIndex: entry.orderIndex
      }))
    }))
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
      level: input.level,
      durationWeeks: input.durationWeeks ?? null,
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
              restSeconds: exercise.restSeconds ?? null,
              durationSecs: exercise.durationSecs ?? null,
              tempo: exercise.tempo ?? null,
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
    pagination: WorkoutPaginationInput,
    requester?: Requester
  ) {
    ensureCoachAccess(coachId, requester);
    await ensureEntitiesExist({ coachId });

    const [items, total] = await Promise.all([
      workoutPlansRepository.listCoachPlans({
        coachId,
        page: pagination.page,
        limit: pagination.limit
      }),
      workoutPlansRepository.countCoachPlans(coachId)
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        level: item.level,
        durationWeeks: item.durationWeeks,
        isTemplate: item.isTemplate,
        isDraft: item.isDraft,
        tags: item.tags,
        version: item.version,
        updatedAt: item.updatedAt,
        workoutDaysCount: item._count.workoutDays,
        activeAssignmentsCount: item._count.assignments
      })),
      page: pagination.page,
      limit: pagination.limit,
      total
    };
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

    const updateResult = await workoutPlansRepository.updatePlanByIdVersion({
      coachId,
      planId,
      expectedVersion: input.expectedVersion,
      data: {
        title: input.title,
        description: input.description === undefined ? undefined : input.description,
        level: input.level,
        durationWeeks: input.durationWeeks === undefined ? undefined : input.durationWeeks,
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

    const refreshed = await workoutPlansRepository.findCoachPlanById(coachId, planId);
    if (!refreshed) {
      throw new WorkoutError("Workout plan not found after update", 404);
    }

    return mapPlan(refreshed);
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
    await ensureEntitiesExist({
      coachId,
      clientId: input.clientId,
      planId: input.workoutPlanId
    });

    const assignment = await prisma.$transaction(async (tx) => {
      await tx.workoutPlanAssignment.updateMany({
        where: {
          coachId,
          clientId: input.clientId,
          isActive: true
        },
        data: {
          isActive: false,
          endDate: input.startDate
        }
      });

      const created = await tx.workoutPlanAssignment.create({
        data: {
          coachId,
          clientId: input.clientId,
          workoutPlanId: input.workoutPlanId,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          isActive: true,
          assignedBy: requester?.userId ?? coachId
        }
      });

      await tx.coachClientRelationship.upsert({
        where: {
          coachId_clientId: {
            coachId,
            clientId: input.clientId
          }
        },
        update: {
          workoutPlanId: input.workoutPlanId
        },
        create: {
          coachId,
          clientId: input.clientId,
          status: "ACTIVE",
          startDate: input.startDate,
          workoutPlanId: input.workoutPlanId
        }
      });

      return created;
    });

    return assignment;
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
