import { Router } from "express";

import { writeRateLimit } from "../../config/rateLimit";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { exercisesController } from "./exercises.controller";

export const exercisesRouter = Router();

exercisesRouter.get(
  "/exercises",
  authMiddleware,
  roleMiddleware(["coach", "client"]),
  exercisesController.list
);

exercisesRouter.get(
  "/exercises/:id",
  authMiddleware,
  roleMiddleware(["coach", "client"]),
  exercisesController.get
);

exercisesRouter.post(
  "/coaches/:coachId/exercises",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  exercisesController.createForCoach
);
