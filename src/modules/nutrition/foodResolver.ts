import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { foodsService } from "../foods/foods.service";

type FoodInput = {
  foodItemId?: string;
  fdcId?: string;
  name?: string;
  brand?: string;
  servingSize?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
  fiberPer100g?: number;
};

export async function resolveFoodItemId(
  input: FoodInput,
  coachId: string
): Promise<string> {
  if (input.foodItemId) {
    const existing = await prisma.foodItem.findUnique({
      where: { id: input.foodItemId },
      select: { id: true }
    });
    if (existing) return existing.id;
  }

  if (input.fdcId) {
    const cached = await prisma.foodItem.findFirst({
      where: {
        name: { contains: `[FDC:${input.fdcId}]` }
      },
      select: { id: true }
    });
    if (cached) return cached.id;

    const detail = await foodsService.detail(input.fdcId).catch(() => null);
    const macros = detail ?? {};

    const created = await prisma.foodItem.create({
      data: {
        name: `${(detail as any)?.description ?? input.name ?? `Food ${input.fdcId}`} [FDC:${input.fdcId}]`,
        brand: (detail as any)?.brandOwner ?? input.brand ?? null,
        caloriesPer100g: new Prisma.Decimal(
          (macros as any)?.caloriesPer100g ?? input.caloriesPer100g ?? 0
        ),
        proteinPer100g: new Prisma.Decimal(
          (macros as any)?.proteinPer100g ?? input.proteinPer100g ?? 0
        ),
        carbsPer100g: new Prisma.Decimal(
          (macros as any)?.carbsPer100g ?? input.carbsPer100g ?? 0
        ),
        fatsPer100g: new Prisma.Decimal(
          (macros as any)?.fatsPer100g ?? input.fatsPer100g ?? 0
        ),
        fiberPer100g:
          (macros as any)?.fiberPer100g ?? input.fiberPer100g
            ? new Prisma.Decimal((macros as any)?.fiberPer100g ?? input.fiberPer100g ?? 0)
            : null,
        servingSizeGrams:
          (macros as any)?.servingSize ?? input.servingSize
            ? new Prisma.Decimal((macros as any)?.servingSize ?? input.servingSize ?? 0)
            : null,
        isCustom: false,
        createdById: coachId
      },
      select: { id: true }
    });
    return created.id;
  }

  if (input.name) {
    const created = await prisma.foodItem.create({
      data: {
        name: input.name,
        brand: input.brand ?? null,
        caloriesPer100g: new Prisma.Decimal(input.caloriesPer100g ?? 0),
        proteinPer100g: new Prisma.Decimal(input.proteinPer100g ?? 0),
        carbsPer100g: new Prisma.Decimal(input.carbsPer100g ?? 0),
        fatsPer100g: new Prisma.Decimal(input.fatsPer100g ?? 0),
        fiberPer100g:
          input.fiberPer100g !== undefined
            ? new Prisma.Decimal(input.fiberPer100g)
            : null,
        servingSizeGrams:
          input.servingSize !== undefined
            ? new Prisma.Decimal(input.servingSize)
            : null,
        isCustom: true,
        createdById: coachId
      },
      select: { id: true }
    });
    return created.id;
  }

  throw new Error("Cannot resolve food item without foodItemId, fdcId, or name");
}

export async function resolveFoodsForMeals<
  T extends { foods: any[] }
>(meals: T[], coachId: string): Promise<T[]> {
  const resolved: T[] = [];
  for (const meal of meals) {
    const foods = [];
    for (const food of meal.foods) {
      const foodItemId = await resolveFoodItemId(food, coachId);
      foods.push({
        foodItemId,
        quantityGrams: food.quantityGrams,
        notes: food.notes,
        orderIndex: food.orderIndex
      });
    }
    resolved.push({ ...meal, foods } as T);
  }
  return resolved;
}
