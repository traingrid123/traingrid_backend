import { Router } from "express";

import { notificationsController } from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/coaches/:coachId",
  notificationsController.listCoachNotifications
);
notificationsRouter.post(
  "/coaches/:coachId/read",
  notificationsController.markRead
);
notificationsRouter.post(
  "/coaches/:coachId/read-all",
  notificationsController.markAllRead
);
notificationsRouter.post(
  "/clients/:clientId/plan-update-request",
  notificationsController.requestPlanUpdate
);
