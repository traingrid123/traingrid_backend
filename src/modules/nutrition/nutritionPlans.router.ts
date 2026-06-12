import { Router } from "express";

import { writeRateLimit } from "../../config/rateLimit";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { nutritionPlansController } from "./nutritionPlans.controller";

export const nutritionPlansRouter = Router();

const coachOnly = [authMiddleware, roleMiddleware(["coach"])];
const clientOnly = [authMiddleware, roleMiddleware(["client"])];

nutritionPlansRouter.post(
  "/coaches/:coachId/nutrition-plans",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.createCoachPlan
);

nutritionPlansRouter.get(
  "/coaches/:coachId/nutrition-plans",
  ...coachOnly,
  nutritionPlansController.listCoachPlans
);

nutritionPlansRouter.get(
  "/coaches/:coachId/nutrition-plans/:planId",
  ...coachOnly,
  nutritionPlansController.getCoachPlan
);

nutritionPlansRouter.patch(
  "/coaches/:coachId/nutrition-plans/:planId",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.updateCoachPlan
);

nutritionPlansRouter.delete(
  "/coaches/:coachId/nutrition-plans/:planId",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.deleteCoachPlan
);

nutritionPlansRouter.post(
  "/coaches/:coachId/nutrition-plans/:planId/duplicate",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.duplicateCoachPlan
);

nutritionPlansRouter.post(
  "/coaches/:coachId/nutrition-plans/:planId/archive",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.archiveCoachPlan
);

nutritionPlansRouter.post(
  "/coaches/:coachId/nutrition-plans/:planId/unarchive",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.unarchiveCoachPlan
);

nutritionPlansRouter.post(
  "/coaches/:coachId/nutrition-plan-assignments",
  ...coachOnly,
  writeRateLimit,
  nutritionPlansController.assignPlan
);

nutritionPlansRouter.get(
  "/coaches/:coachId/clients/:clientId/nutrition-compliance",
  ...coachOnly,
  nutritionPlansController.getCoachClientCompliance
);

nutritionPlansRouter.get(
  "/clients/:clientId/nutrition/today",
  ...clientOnly,
  nutritionPlansController.getTodayNutrition
);

nutritionPlansRouter.post(
  "/clients/:clientId/nutrition/log",
  ...clientOnly,
  writeRateLimit,
  nutritionPlansController.logMeal
);

nutritionPlansRouter.get(
  "/clients/:clientId/nutrition/compliance",
  ...clientOnly,
  nutritionPlansController.getClientCompliance
);
