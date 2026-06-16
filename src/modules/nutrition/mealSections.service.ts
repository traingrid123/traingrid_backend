import { prisma } from "../../lib/prisma";

export class MealSectionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "MealSectionError";
  }
}

export const mealSectionsService = {
  createMealSection: async (planId: string, data: any) => {
    return prisma.mealSection.create({
      data: {
        ...data,
        nutritionPlanId: planId
      }
    });
  },

  getMealSection: async (sectionId: string) => {
    return prisma.mealSection.findUnique({
      where: { id: sectionId },
      include: {
        mealFoods: {
          include: {
            foodItem: true
          }
        }
      }
    });
  },

  updateMealSection: async (sectionId: string, data: any) => {
    return prisma.mealSection.update({
      where: { id: sectionId },
      data
    });
  },

  deleteMealSection: async (sectionId: string) => {
    return prisma.mealSection.delete({
      where: { id: sectionId }
    });
  }
};
