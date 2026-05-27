import { prisma } from "../../lib/prisma";

export class NutritionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NutritionError";
  }
}

export const nutritionPlansService = {
  createNutritionPlan: async (data: any) => {
    const { coachId, title, description, clientId } = data;

    const plan = await prisma.nutritionPlan.create({
      data: {
        coachId,
        title,
        description,
        mealSections: {
          create: [
            { name: "Breakfast", mealType: "BREAKFAST", dayNumber: 1, weekNumber: 1, orderIndex: 1 },
            { name: "Mid-Morning Snack", mealType: "SNACK", dayNumber: 1, weekNumber: 1, orderIndex: 2 },
            { name: "Lunch", mealType: "LUNCH", dayNumber: 1, weekNumber: 1, orderIndex: 3 },
            { name: "Afternoon Snack", mealType: "SNACK", dayNumber: 1, weekNumber: 1, orderIndex: 4 },
            { name: "Dinner", mealType: "DINNER", dayNumber: 1, weekNumber: 1, orderIndex: 5 },
            { name: "Evening Snack", mealType: "SNACK", dayNumber: 1, weekNumber: 1, orderIndex: 6 }
          ]
        }
      },
      include: {
        mealSections: true
      }
    });

    if (clientId) {
      await prisma.coachClientRelationship.update({
        where: {
          coachId_clientId: { coachId, clientId }
        },
        data: {
          nutritionPlanId: plan.id
        }
      });
    }

    return plan;
  },

  getNutritionPlan: async (planId: string) => {
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id: planId },
      include: {
        mealSections: {
          include: {
            mealFoods: {
              include: {
                foodItem: true
              }
            }
          }
        },
        assignedRelationships: true
      }
    });

    if (!plan) {
      throw new NutritionError("Nutrition plan not found", 404);
    }

    return plan;
  },

  getCoachNutritionPlans: async (coachId: string) => {
    return prisma.nutritionPlan.findMany({
      where: { coachId },
      include: {
        mealSections: true,
        _count: {
          select: {
            assignedRelationships: true
          }
        }
      }
    });
  },

  deleteNutritionPlan: async (planId: string, coachId: string) => {
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || plan.coachId !== coachId) {
      throw new NutritionError("Unauthorized", 403);
    }

    return prisma.nutritionPlan.delete({
      where: { id: planId }
    });
  },

  updateNutritionPlan: async (planId: string, coachId: string, data: any) => {
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || plan.coachId !== coachId) {
      throw new NutritionError("Unauthorized", 403);
    }

    return prisma.nutritionPlan.update({
      where: { id: planId },
      data,
      include: {
        mealSections: true
      }
    });
  }
};
