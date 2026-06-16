import { Router } from "express";
import { nutritionPlansController } from "./nutritionPlans.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const nutritionRouter = Router();

nutritionRouter.use(authMiddleware);

nutritionRouter.post("/plans", nutritionPlansController.createPlan);

nutritionRouter.get("/plans", nutritionPlansController.getCoachPlans);

nutritionRouter.get("/plans/:planId", nutritionPlansController.getPlan);

nutritionRouter.put("/plans/:planId", nutritionPlansController.updatePlan);

nutritionRouter.delete("/plans/:planId", nutritionPlansController.deletePlan);

nutritionRouter.post("/meal-sections/:mealSectionId/food-items", nutritionPlansController.addFoodItem);

nutritionRouter.delete("/food-items/:foodItemId", nutritionPlansController.deleteFoodItem);
