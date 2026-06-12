import { z } from "zod";

export const foodsSchema = {
  search: z.object({
    q: z.string().trim().min(2).max(120),
    limit: z.coerce.number().int().min(1).max(50).default(20)
  }),
  detail: z.object({
    fdcId: z.string().trim().min(1).max(40)
  })
};

export type FoodSearchInput = z.infer<typeof foodsSchema.search>;
export type FoodDetailInput = z.infer<typeof foodsSchema.detail>;
