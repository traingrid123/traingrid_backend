import { Router } from "express";

import { clientsController } from "./clients.controller";

export const clientsRouter = Router();

clientsRouter.get("/:clientId", clientsController.getProfile);
clientsRouter.patch("/:clientId", clientsController.updateProfile);
clientsRouter.get("/:clientId/dashboard", clientsController.getDashboard);
clientsRouter.get("/:clientId/coach", clientsController.getAssignedCoach);
clientsRouter.post(
  "/:clientId/plan-update-request",
  clientsController.requestPlanUpdate
);
clientsRouter.get("/:clientId/leaderboard", clientsController.getLeaderboard);
clientsRouter.get("/:clientId/analytics", clientsController.getAnalytics);
