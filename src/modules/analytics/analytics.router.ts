import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);

analyticsRouter.get("/dashboard", analyticsController.getCoachDashboard);

analyticsRouter.get("/metrics", analyticsController.getCoachMetrics);

analyticsRouter.get("/client/:clientId/progress", analyticsController.getClientProgress);

analyticsRouter.get("/top-clients", analyticsController.getTopClients);

