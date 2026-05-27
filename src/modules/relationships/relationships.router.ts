import { Router } from "express";
import { relationshipsController } from "./relationships.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const relationshipsRouter = Router();

relationshipsRouter.use(authMiddleware);

relationshipsRouter.post("/", relationshipsController.createRelationship);

relationshipsRouter.get("/coach/clients", relationshipsController.getCoachClients);

relationshipsRouter.get("/client/coaches", relationshipsController.getClientCoaches);

relationshipsRouter.get("/:clientId", relationshipsController.getRelationship);

relationshipsRouter.put("/:clientId", relationshipsController.updateRelationship);

relationshipsRouter.delete("/:clientId", relationshipsController.endRelationship);

relationshipsRouter.post("/:clientId/workout-plan", relationshipsController.assignWorkoutPlan);

relationshipsRouter.post("/:clientId/nutrition-plan", relationshipsController.assignNutritionPlan);
