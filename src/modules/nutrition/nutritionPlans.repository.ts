import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

const planInclude = {
  mealSections: {
    orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }, { orderIndex: "asc" }],
    include: {
      mealFoods: {
        orderBy: { orderIndex: "asc" },
        include: {
          foodItem: true
        }
      }
    }
  }
} as const;

export const nutritionPlansRepository = {
  findCoachById(coachId: string) {
    return prisma.coach.findUnique({ where: { id: coachId }, select: { id: true } });
  },

  findClientById(clientId: string) {
    return prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  },

  createPlan(input: Prisma.NutritionPlanCreateInput) {
    return prisma.nutritionPlan.create({
      data: input,
      include: planInclude as any
    });
  },

  findCoachPlanById(coachId: string, planId: string) {
    return prisma.nutritionPlan.findFirst({
      where: { id: planId, coachId },
      include: {
        ...(planInclude as any),
        assignments: {
          where: { isActive: true },
          select: { id: true, clientId: true, startDate: true }
        }
      }
    });
  },

  listCoachPlans(params: {
    coachId: string;
    page: number;
    limit: number;
    search?: string;
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
      ...(params.tag ? { tags: { has: params.tag } } : {})
    };
    return prisma.nutritionPlan.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: params.limit,
      include: {
        _count: { select: { mealSections: true, assignments: true } }
      }
    });
  },

  countCoachPlans(params: {
    coachId: string;
    search?: string;
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
      ...(params.tag ? { tags: { has: params.tag } } : {})
    };
    return prisma.nutritionPlan.count({ where });
  },

  setArchived(params: { coachId: string; planId: string; archived: boolean }) {
    return prisma.nutritionPlan.updateMany({
      where: { id: params.planId, coachId: params.coachId },
      data: { archivedAt: params.archived ? new Date() : null }
    });
  },

  deletePlan(planId: string) {
    return prisma.nutritionPlan.delete({ where: { id: planId } });
  },

  duplicatePlan(
    tx: Prisma.TransactionClient,
    source: any,
    override: { title?: string; isDraft?: boolean }
  ) {
    return tx.nutritionPlan.create({
      data: {
        coachId: source.coachId,
        title: override.title ?? `${source.title} (Copy)`,
        description: source.description,
        goal: source.goal,
        dailyCalories: source.dailyCalories,
        proteinGrams: source.proteinGrams,
        carbsGrams: source.carbsGrams,
        fatsGrams: source.fatsGrams,
        fiberGrams: source.fiberGrams,
        waterMl: source.waterMl,
        durationWeeks: source.durationWeeks,
        isTemplate: source.isTemplate,
        isDraft: override.isDraft ?? true,
        tags: source.tags,
        mealSections: {
          create: source.mealSections.map((section: any) => ({
            mealType: section.mealType,
            name: section.name,
            dayNumber: section.dayNumber,
            weekNumber: section.weekNumber,
            targetCalories: section.targetCalories,
            targetProtein: section.targetProtein,
            targetCarbs: section.targetCarbs,
            targetFats: section.targetFats,
            orderIndex: section.orderIndex,
            notes: section.notes,
            mealFoods: {
              create: section.mealFoods.map((food: any) => ({
                foodItemId: food.foodItemId,
                quantityGrams: food.quantityGrams,
                notes: food.notes,
                orderIndex: food.orderIndex
              }))
            }
          }))
        }
      },
      include: planInclude as any
    });
  },

  updatePlanByIdVersion(params: {
    coachId: string;
    planId: string;
    expectedVersion?: number;
    data: Prisma.NutritionPlanUpdateInput;
  }) {
    const where: any = { id: params.planId, coachId: params.coachId };
    if (params.expectedVersion) {
      where.version = params.expectedVersion;
    }
    return prisma.nutritionPlan.updateMany({
      where,
      data: { ...params.data, version: { increment: 1 } }
    });
  },

  replacePlanMeals(
    tx: Prisma.TransactionClient,
    planId: string,
    meals: Array<{
      mealType: any;
      name?: string;
      dayNumber: number;
      weekNumber: number;
      targetCalories?: number;
      targetProtein?: number;
      targetCarbs?: number;
      targetFats?: number;
      orderIndex: number;
      notes?: string;
      foods: Array<{
        foodItemId?: string;
        quantityGrams: number;
        notes?: string;
        orderIndex: number;
      }>;
    }>
  ) {
    return tx.nutritionPlan.update({
      where: { id: planId },
      data: {
        mealSections: {
          deleteMany: {},
          create: meals.map((meal) => ({
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
            mealFoods: {
              create: meal.foods.map((food) => ({
                foodItemId: food.foodItemId ?? null,
                quantityGrams: food.quantityGrams,
                notes: food.notes ?? null,
                orderIndex: food.orderIndex
              })) as any
            }
          }))
        }
      },
      include: planInclude as any
    });
  },

  snapshotVersion(
    tx: Prisma.TransactionClient,
    params: { nutritionPlanId: string; version: number; snapshot: Prisma.InputJsonValue }
  ) {
    return tx.nutritionPlanVersion.create({
      data: {
        nutritionPlanId: params.nutritionPlanId,
        version: params.version,
        snapshot: params.snapshot
      }
    });
  },

  upsertVersionSnapshot(params: {
    nutritionPlanId: string;
    version: number;
    snapshot: Prisma.InputJsonValue;
  }) {
    return prisma.nutritionPlanVersion.upsert({
      where: {
        nutritionPlanId_version: {
          nutritionPlanId: params.nutritionPlanId,
          version: params.version
        }
      },
      create: {
        nutritionPlanId: params.nutritionPlanId,
        version: params.version,
        snapshot: params.snapshot
      },
      update: {}
    });
  },

  migrateActiveAssignmentsToVersion(params: {
    nutritionPlanId: string;
    planVersionId: string;
    pinnedVersion: number;
  }) {
    return prisma.nutritionPlanAssignment.updateMany({
      where: { nutritionPlanId: params.nutritionPlanId, isActive: true },
      data: {
        planVersionId: params.planVersionId,
        pinnedVersion: params.pinnedVersion
      }
    });
  },

  findActiveAssignmentForClient(clientId: string) {
    return prisma.nutritionPlanAssignment.findFirst({
      where: { clientId, isActive: true },
      orderBy: { startDate: "desc" },
      include: {
        nutritionPlan: { include: planInclude as any },
        coach: { select: { id: true, fullName: true } }
      }
    });
  },

  findActiveAssignmentForCoachClient(coachId: string, clientId: string) {
    return prisma.nutritionPlanAssignment.findFirst({
      where: { coachId, clientId, isActive: true },
      orderBy: { startDate: "desc" },
      include: { nutritionPlan: true }
    });
  },

  listClientNutritionLogs(clientId: string, sinceDays = 60) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    return prisma.nutritionLog.findMany({
      where: { clientId, loggedAt: { gte: since } },
      orderBy: { loggedAt: "desc" }
    });
  }
};
