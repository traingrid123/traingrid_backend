import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import { resolveFoodsForMeals } from "./foodResolver";
import { nutritionPlansRepository } from "./nutritionPlans.repository";
import {
  AssignNutritionPlanInput,
  CreateNutritionPlanInput,
  DuplicateNutritionPlanInput,
  LogMealInput,
  NutritionListFilters,
  UpdateNutritionPlanInput
} from "./nutrition.schema";

type Requester = { role: "coach" | "client"; userId: string };

export class NutritionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NutritionError";
  }
}

function ensureCoach(coachId: string, requester?: Requester) {
  if (!requester) return;
  if (requester.role !== "coach" || requester.userId !== coachId) {
    throw new NutritionError("Not allowed to access this coach resource", 403);
  }
}

function ensureClient(clientId: string, requester?: Requester) {
  if (!requester) return;
  if (requester.role !== "client" || requester.userId !== clientId) {
    throw new NutritionError("Not allowed to access this client resource", 403);
  }
}

function mapMealFood(food: any) {
  const foodItem = food.foodItem ?? {};
  return {
    id: food.id,
    foodItemId: food.foodItemId,
    name: foodItem.name,
    brand: foodItem.brand,
    quantityGrams: food.quantityGrams ? Number(food.quantityGrams) : 0,
    caloriesPer100g: foodItem.caloriesPer100g ? Number(foodItem.caloriesPer100g) : 0,
    proteinPer100g: foodItem.proteinPer100g ? Number(foodItem.proteinPer100g) : 0,
    carbsPer100g: foodItem.carbsPer100g ? Number(foodItem.carbsPer100g) : 0,
    fatsPer100g: foodItem.fatsPer100g ? Number(foodItem.fatsPer100g) : 0,
    fiberPer100g: foodItem.fiberPer100g ? Number(foodItem.fiberPer100g) : null,
    notes: food.notes,
    orderIndex: food.orderIndex
  };
}

function mapMealSection(section: any) {
  return {
    id: section.id,
    mealType: section.mealType,
    name: section.name,
    dayNumber: section.dayNumber,
    weekNumber: section.weekNumber,
    targetCalories: section.targetCalories,
    targetProtein: section.targetProtein ? Number(section.targetProtein) : null,
    targetCarbs: section.targetCarbs ? Number(section.targetCarbs) : null,
    targetFats: section.targetFats ? Number(section.targetFats) : null,
    orderIndex: section.orderIndex,
    notes: section.notes,
    foods: (section.mealFoods ?? []).map(mapMealFood)
  };
}

function mapPlan(plan: any) {
  return {
    id: plan.id,
    coachId: plan.coachId,
    title: plan.title,
    description: plan.description,
    goal: plan.goal,
    dailyCalories: plan.dailyCalories,
    proteinGrams: plan.proteinGrams ? Number(plan.proteinGrams) : null,
    carbsGrams: plan.carbsGrams ? Number(plan.carbsGrams) : null,
    fatsGrams: plan.fatsGrams ? Number(plan.fatsGrams) : null,
    fiberGrams: plan.fiberGrams ? Number(plan.fiberGrams) : null,
    waterMl: plan.waterMl,
    durationWeeks: plan.durationWeeks,
    isTemplate: plan.isTemplate,
    isDraft: plan.isDraft,
    tags: plan.tags,
    version: plan.version,
    archivedAt: plan.archivedAt,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    meals: (plan.mealSections ?? []).map(mapMealSection)
  };
}

function buildSnapshot(plan: any) {
  return { version: plan.version, plan: mapPlan(plan) };
}

export const nutritionPlansService = {
  async createPlan(
    coachId: string,
    input: CreateNutritionPlanInput,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const coach = await nutritionPlansRepository.findCoachById(coachId);
    if (!coach) throw new NutritionError("Coach not found", 404);

    const resolvedMeals = await resolveFoodsForMeals(input.meals, coachId);

    const created = await nutritionPlansRepository.createPlan({
      coach: { connect: { id: coachId } },
      title: input.title,
      description: input.description ?? null,
      goal: input.goal ?? null,
      dailyCalories: input.dailyCalories ?? null,
      proteinGrams:
        input.proteinGrams !== undefined
          ? new Prisma.Decimal(input.proteinGrams)
          : null,
      carbsGrams:
        input.carbsGrams !== undefined ? new Prisma.Decimal(input.carbsGrams) : null,
      fatsGrams:
        input.fatsGrams !== undefined ? new Prisma.Decimal(input.fatsGrams) : null,
      fiberGrams:
        input.fiberGrams !== undefined
          ? new Prisma.Decimal(input.fiberGrams)
          : null,
      waterMl: input.waterMl ?? null,
      durationWeeks: input.durationWeeks ?? null,
      isTemplate: input.isTemplate,
      isDraft: input.isDraft,
      tags: input.tags,
      mealSections: {
        create: resolvedMeals.map((meal: any) => ({
          mealType: meal.mealType,
          name: meal.name,
          dayNumber: meal.dayNumber,
          weekNumber: meal.weekNumber,
          targetCalories: meal.targetCalories,
          targetProtein:
            meal.targetProtein !== undefined
              ? new Prisma.Decimal(meal.targetProtein)
              : null,
          targetCarbs:
            meal.targetCarbs !== undefined
              ? new Prisma.Decimal(meal.targetCarbs)
              : null,
          targetFats:
            meal.targetFats !== undefined
              ? new Prisma.Decimal(meal.targetFats)
              : null,
          orderIndex: meal.orderIndex,
          notes: meal.notes,
          mealFoods: {
            create: meal.foods.map((food: any) => ({
              foodItemId: food.foodItemId,
              quantityGrams: new Prisma.Decimal(food.quantityGrams),
              notes: food.notes,
              orderIndex: food.orderIndex
            }))
          }
        }))
      }
    });

    return mapPlan(created);
  },

  async listCoachPlans(
    coachId: string,
    filters: NutritionListFilters,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const baseParams = {
      coachId,
      search: filters.search,
      tag: filters.tag,
      includeArchived: filters.includeArchived,
      archivedOnly: filters.archivedOnly
    };
    const [items, total] = await Promise.all([
      nutritionPlansRepository.listCoachPlans({
        ...baseParams,
        page: filters.page,
        limit: filters.limit
      }),
      nutritionPlansRepository.countCoachPlans(baseParams)
    ]);

    return {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        goal: item.goal,
        dailyCalories: item.dailyCalories,
        proteinGrams: item.proteinGrams ? Number(item.proteinGrams) : null,
        carbsGrams: item.carbsGrams ? Number(item.carbsGrams) : null,
        fatsGrams: item.fatsGrams ? Number(item.fatsGrams) : null,
        waterMl: item.waterMl,
        durationWeeks: item.durationWeeks,
        isTemplate: item.isTemplate,
        isDraft: item.isDraft,
        tags: item.tags,
        version: item.version,
        archivedAt: item.archivedAt,
        updatedAt: item.updatedAt,
        mealSectionsCount: item._count.mealSections,
        activeAssignmentsCount: item._count.assignments
      })),
      page: filters.page,
      limit: filters.limit,
      total
    };
  },

  async getCoachPlan(coachId: string, planId: string, requester?: Requester) {
    ensureCoach(coachId, requester);
    const plan: any = await nutritionPlansRepository.findCoachPlanById(coachId, planId);
    if (!plan) throw new NutritionError("Nutrition plan not found", 404);
    return { ...mapPlan(plan), activeAssignments: plan.assignments };
  },

  async updateCoachPlan(
    coachId: string,
    planId: string,
    input: UpdateNutritionPlanInput,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const existing = await nutritionPlansRepository.findCoachPlanById(coachId, planId);
    if (!existing) throw new NutritionError("Nutrition plan not found", 404);

    const priorSnapshot = buildSnapshot(existing);
    const priorVersion = (existing as any).version;

    const result = await nutritionPlansRepository.updatePlanByIdVersion({
      coachId,
      planId,
      expectedVersion: input.expectedVersion,
      data: {
        title: input.title,
        description: input.description === undefined ? undefined : input.description,
        goal: input.goal === undefined ? undefined : input.goal,
        dailyCalories: input.dailyCalories === undefined ? undefined : input.dailyCalories,
        proteinGrams:
          input.proteinGrams === undefined
            ? undefined
            : input.proteinGrams === null
              ? null
              : new Prisma.Decimal(input.proteinGrams),
        carbsGrams:
          input.carbsGrams === undefined
            ? undefined
            : input.carbsGrams === null
              ? null
              : new Prisma.Decimal(input.carbsGrams),
        fatsGrams:
          input.fatsGrams === undefined
            ? undefined
            : input.fatsGrams === null
              ? null
              : new Prisma.Decimal(input.fatsGrams),
        fiberGrams:
          input.fiberGrams === undefined
            ? undefined
            : input.fiberGrams === null
              ? null
              : new Prisma.Decimal(input.fiberGrams),
        waterMl: input.waterMl === undefined ? undefined : input.waterMl,
        durationWeeks: input.durationWeeks === undefined ? undefined : input.durationWeeks,
        isTemplate: input.isTemplate,
        isDraft: input.isDraft,
        tags: input.tags
      }
    });

    if (result.count === 0) {
      throw new NutritionError("Nutrition plan version mismatch", 409);
    }

    if (input.meals) {
      const resolved = await resolveFoodsForMeals(input.meals, coachId);
      await prisma.$transaction(async (tx) => {
        await nutritionPlansRepository.replacePlanMeals(
          tx,
          planId,
          resolved.map((meal: any) => ({
            mealType: meal.mealType,
            name: meal.name,
            dayNumber: meal.dayNumber,
            weekNumber: meal.weekNumber,
            targetCalories: meal.targetCalories,
            targetProtein: meal.targetProtein,
            targetCarbs: meal.targetCarbs,
            targetFats: meal.targetFats,
            orderIndex: meal.orderIndex,
            notes: meal.notes,
            foods: meal.foods
          }))
        );
      });
    }

    // Persist prior snapshot
    await nutritionPlansRepository.upsertVersionSnapshot({
      nutritionPlanId: planId,
      version: priorVersion,
      snapshot: priorSnapshot as unknown as Prisma.InputJsonValue
    });

    const refreshed = await nutritionPlansRepository.findCoachPlanById(coachId, planId);
    if (!refreshed) throw new NutritionError("Plan vanished after update", 500);

    if (input.propagation === "MIGRATE_NEW") {
      const newSnapshot = await nutritionPlansRepository.upsertVersionSnapshot({
        nutritionPlanId: planId,
        version: (refreshed as any).version,
        snapshot: buildSnapshot(refreshed) as unknown as Prisma.InputJsonValue
      });
      await nutritionPlansRepository.migrateActiveAssignmentsToVersion({
        nutritionPlanId: planId,
        planVersionId: newSnapshot.id,
        pinnedVersion: (refreshed as any).version
      });
    }

    return mapPlan(refreshed);
  },

  async deleteCoachPlan(coachId: string, planId: string, requester?: Requester) {
    ensureCoach(coachId, requester);
    const existing = await nutritionPlansRepository.findCoachPlanById(coachId, planId);
    if (!existing) throw new NutritionError("Nutrition plan not found", 404);
    await nutritionPlansRepository.deletePlan(planId);
    return { id: planId, deleted: true };
  },

  async setArchived(
    coachId: string,
    planId: string,
    archived: boolean,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const res = await nutritionPlansRepository.setArchived({ coachId, planId, archived });
    if (res.count === 0) throw new NutritionError("Nutrition plan not found", 404);
    return { id: planId, archived };
  },

  async duplicateCoachPlan(
    coachId: string,
    planId: string,
    input: DuplicateNutritionPlanInput,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const source = await nutritionPlansRepository.findCoachPlanById(coachId, planId);
    if (!source) throw new NutritionError("Nutrition plan not found", 404);

    const dup = await prisma.$transaction((tx) =>
      nutritionPlansRepository.duplicatePlan(tx, source, {
        title: input.title,
        isDraft: input.isDraft
      })
    );
    return mapPlan(dup);
  },

  async assignPlan(
    coachId: string,
    input: AssignNutritionPlanInput,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const plan = await nutritionPlansRepository.findCoachPlanById(coachId, input.nutritionPlanId);
    if (!plan) throw new NutritionError("Nutrition plan not found", 404);

    const clientIds = input.clientIds && input.clientIds.length > 0
      ? input.clientIds
      : input.clientId
        ? [input.clientId]
        : [];
    if (clientIds.length === 0) {
      throw new NutritionError("clientId or clientIds required", 400);
    }

    const planVersion = await nutritionPlansRepository.upsertVersionSnapshot({
      nutritionPlanId: plan.id,
      version: (plan as any).version,
      snapshot: buildSnapshot(plan) as unknown as Prisma.InputJsonValue
    });

    const created: any[] = [];
    await prisma.$transaction(async (tx) => {
      for (const clientId of clientIds) {
        const client = await tx.client.findUnique({
          where: { id: clientId },
          select: { id: true }
        });
        if (!client) throw new NutritionError(`Client ${clientId} not found`, 404);

        await tx.nutritionPlanAssignment.updateMany({
          where: { coachId, clientId, isActive: true },
          data: { isActive: false, endDate: input.startDate }
        });

        const assignment = await tx.nutritionPlanAssignment.create({
          data: {
            coachId,
            clientId,
            nutritionPlanId: input.nutritionPlanId,
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
          update: { nutritionPlanId: input.nutritionPlanId },
          create: {
            coachId,
            clientId,
            status: "ACTIVE",
            startDate: input.startDate,
            nutritionPlanId: input.nutritionPlanId
          }
        });

        created.push(assignment);
      }
    });

    return { count: created.length, assignments: created };
  },

  async getTodayNutrition(clientId: string, requester?: Requester) {
    ensureClient(clientId, requester);
    const assignment: any = await nutritionPlansRepository.findActiveAssignmentForClient(clientId);
    if (!assignment) return { assignmentId: null, today: null };

    const dayNumber =
      Math.floor(
        (Date.now() - new Date(assignment.startDate).getTime()) / (24 * 60 * 60 * 1000)
      ) % Math.max(1, assignment.nutritionPlan.durationWeeks ? assignment.nutritionPlan.durationWeeks * 7 : 7) +
      1;

    const todayMeals = assignment.nutritionPlan.mealSections.filter(
      (s: any) => s.dayNumber === dayNumber || s.dayNumber === 1
    );

    const startOfDay = dayjs().startOf("day").toDate();
    const endOfDay = dayjs().endOf("day").toDate();
    const logs = await prisma.nutritionLog.findMany({
      where: {
        clientId,
        loggedAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    return {
      assignmentId: assignment.id,
      coach: { id: assignment.coach.id, name: assignment.coach.fullName },
      planId: assignment.nutritionPlanId,
      planTitle: assignment.nutritionPlan.title,
      dailyCalories: assignment.nutritionPlan.dailyCalories,
      proteinGrams: assignment.nutritionPlan.proteinGrams
        ? Number(assignment.nutritionPlan.proteinGrams)
        : null,
      carbsGrams: assignment.nutritionPlan.carbsGrams
        ? Number(assignment.nutritionPlan.carbsGrams)
        : null,
      fatsGrams: assignment.nutritionPlan.fatsGrams
        ? Number(assignment.nutritionPlan.fatsGrams)
        : null,
      waterMl: assignment.nutritionPlan.waterMl,
      dayNumber,
      meals: todayMeals.map((meal: any) => ({
        ...mapMealSection(meal),
        completed: logs.some((l) => l.mealSectionId === meal.id && l.isCompleted)
      }))
    };
  },

  async logMeal(clientId: string, input: LogMealInput, requester?: Requester) {
    ensureClient(clientId, requester);
    const loggedAt = input.loggedAt ?? new Date();
    const logDate = dayjs(loggedAt).startOf("day").toDate();
    const created = await prisma.nutritionLog.create({
      data: {
        clientId,
        mealSectionId: input.mealSectionId ?? null,
        loggedAt,
        logDate,
        isCompleted: input.isCompleted,
        caloriesConsumed: input.caloriesConsumed ?? null,
        proteinConsumed:
          input.proteinConsumed !== undefined
            ? new Prisma.Decimal(input.proteinConsumed)
            : null,
        carbsConsumed:
          input.carbsConsumed !== undefined
            ? new Prisma.Decimal(input.carbsConsumed)
            : null,
        fatsConsumed:
          input.fatsConsumed !== undefined
            ? new Prisma.Decimal(input.fatsConsumed)
            : null,
        waterMl: input.waterMl ?? null,
        notes: input.notes ?? null
      }
    });
    return created;
  },

  async getClientCompliance(clientId: string, days = 14, requester?: Requester) {
    ensureClient(clientId, requester);
    const assignment: any =
      await nutritionPlansRepository.findActiveAssignmentForClient(clientId);
    if (!assignment) {
      return {
        clientId,
        planId: null,
        weeklyAdherence: 0,
        dailyAdherence: [],
        missedMeals: 0,
        totalMeals: 0
      };
    }

    const since = dayjs().subtract(days, "day").startOf("day").toDate();
    const logs = await prisma.nutritionLog.findMany({
      where: { clientId, loggedAt: { gte: since } }
    });

    const totalMealsPerDay = assignment.nutritionPlan.mealSections.length || 1;
    const buckets = new Map<string, number>();
    for (const log of logs) {
      if (!log.isCompleted) continue;
      const key = dayjs(log.loggedAt).format("YYYY-MM-DD");
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const dailyAdherence: Array<{ date: string; adherence: number; meals: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const meals = buckets.get(d) ?? 0;
      dailyAdherence.push({
        date: d,
        meals,
        adherence: Math.min(100, Math.round((meals / totalMealsPerDay) * 100))
      });
    }
    const sum = dailyAdherence.reduce((acc, d) => acc + d.adherence, 0);
    const weeklyAdherence = Math.round(sum / Math.max(dailyAdherence.length, 1));
    const totalMealsAssigned = days * totalMealsPerDay;
    const totalCompleted = logs.filter((l) => l.isCompleted).length;

    return {
      clientId,
      planId: assignment.nutritionPlanId,
      planTitle: assignment.nutritionPlan.title,
      weeklyAdherence,
      dailyAdherence,
      missedMeals: Math.max(totalMealsAssigned - totalCompleted, 0),
      totalMeals: totalMealsAssigned,
      totalCompleted
    };
  },

  async getCoachClientCompliance(
    coachId: string,
    clientId: string,
    requester?: Requester
  ) {
    ensureCoach(coachId, requester);
    const active = await nutritionPlansRepository.findActiveAssignmentForCoachClient(coachId, clientId);
    if (!active) throw new NutritionError("No active nutrition assignment", 404);
    const data = await this.getClientCompliance(clientId);
    return { coachId, ...data };
  }
};
