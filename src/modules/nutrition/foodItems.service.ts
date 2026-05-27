import { prisma } from "../../lib/prisma";

export class FoodItemError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "FoodItemError";
  }
}

export const foodItemsService = {
  createFoodItem: async (mealSectionId: string, data: any) => {
    const foodItem = await prisma.foodItem.create({
      data: {
        name: data.name,
        brand: data.brand ?? null,
        caloriesPer100g: data.caloriesPer100g ?? data.calories ?? 0,
        proteinPer100g: data.proteinPer100g ?? data.protein ?? 0,
        carbsPer100g: data.carbsPer100g ?? data.carbs ?? 0,
        fatsPer100g: data.fatsPer100g ?? data.fat ?? 0,
        fiberPer100g: data.fiberPer100g ?? null,
        servingSizeGrams: data.servingSizeGrams ?? null,
        isCustom: true
      }
    });

    const mealFoodCount = await prisma.mealFood.count({
      where: { mealSectionId }
    });

    await prisma.mealFood.create({
      data: {
        mealSectionId,
        foodItemId: foodItem.id,
        quantityGrams: data.quantityGrams ?? data.servingSizeGrams ?? 100,
        orderIndex: mealFoodCount + 1,
        notes: data.notes ?? null
      }
    });

    return foodItem;
  },

  getFoodItem: async (foodItemId: string) => {
    return prisma.foodItem.findUnique({
      where: { id: foodItemId }
    });
  },

  updateFoodItem: async (foodItemId: string, data: any) => {
    return prisma.foodItem.update({
      where: { id: foodItemId },
      data
    });
  },

  deleteFoodItem: async (foodItemId: string) => {
    await prisma.mealFood.deleteMany({
      where: { foodItemId }
    });

    return prisma.foodItem.delete({
      where: { id: foodItemId }
    });
  },

  getMealSectionFoodItems: async (mealSectionId: string) => {
    return prisma.mealFood.findMany({
      where: { mealSectionId },
      include: {
        foodItem: true
      },
      orderBy: { orderIndex: "asc" }
    });
  }
};
