import { Router } from "express";
import { progressController } from "./progress.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const progressRouter = Router();

progressRouter.use(authMiddleware);

progressRouter.get("/:clientId", progressController.getProgress);

progressRouter.get("/:clientId/metrics", progressController.getMetrics);

progressRouter.get("/:clientId/chart", progressController.getChart);

progressRouter.get("/:clientId/milestones", progressController.getMilestones);
