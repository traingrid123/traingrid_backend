import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { exercisesController } from "./exercises.controller";

export const exercisesRouter = Router();

exercisesRouter.get("/", authMiddleware, exercisesController.list);
exercisesRouter.get("/:id", authMiddleware, exercisesController.get);
exercisesRouter.post("/coaches/:coachId/exercises", authMiddleware, exercisesController.createForCoach);
