import { Router } from "express";
import { habitsController } from "./habits.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const habitsRouter = Router();

habitsRouter.use(authMiddleware);

habitsRouter.post("/", habitsController.createHabit);

habitsRouter.get("/client/:clientId", habitsController.getClientHabits);

habitsRouter.get("/:habitId", habitsController.getHabit);

habitsRouter.put("/:habitId", habitsController.updateHabit);

habitsRouter.delete("/:habitId", habitsController.deleteHabit);

habitsRouter.post("/:habitId/log", habitsController.logHabit);

habitsRouter.get("/:habitId/stats", habitsController.getStats);
