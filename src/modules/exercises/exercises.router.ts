import { Router } from "express";

import { exercisesController } from "./exercises.controller";

export const exercisesRouter = Router();

exercisesRouter.get("/", exercisesController.list);
exercisesRouter.get("/:exerciseId", exercisesController.getById);
exercisesRouter.post("/custom", exercisesController.createCustom);
exercisesRouter.patch("/:exerciseId", exercisesController.update);
exercisesRouter.delete("/:exerciseId", exercisesController.delete);
