import { prisma } from "../../lib/prisma";

export const nutritionPlansRepository = {
  getCoachPlans: (coachId: string) =>
    prisma.nutritionPlan.findMany({
      where: { coachId },
      include: {
        mealSections: true
      }
    }),

  getPlanById: (planId: string) =>
    prisma.nutritionPlan.findUnique({
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
        }
      }
    }),

  createPlan: (data: any) =>
    prisma.nutritionPlan.create({
      data,
      include: {
        mealSections: true
      }
    }),

  updatePlan: (planId: string, data: any) =>
    prisma.nutritionPlan.update({
      where: { id: planId },
      data,
      include: {
        mealSections: true
      }
    }),

  deletePlan: (planId: string) =>
    prisma.nutritionPlan.delete({
      where: { id: planId }
    })
};
