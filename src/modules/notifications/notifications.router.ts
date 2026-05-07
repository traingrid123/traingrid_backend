import { Router } from "express";

import { notificationsController } from "./notifications.controller";

export const notificationsRouter = Router();

/**
 * @openapi
 * /notifications/coaches/{coachId}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List notifications for a coach
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications fetched
 */
notificationsRouter.get(
  "/coaches/:coachId",
  notificationsController.listCoachNotifications
);

/**
 * @openapi
 * /notifications/coaches/{coachId}/read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark selected notifications as read
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
notificationsRouter.post(
  "/coaches/:coachId/read",
  notificationsController.markRead
);

/**
 * @openapi
 * /notifications/coaches/{coachId}/read-all:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark all coach notifications as read
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationsRouter.post(
  "/coaches/:coachId/read-all",
  notificationsController.markAllRead
);

/**
 * @openapi
 * /notifications/clients/{clientId}/plan-update-request:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Request a plan update for a client
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan update notification request created
 */
notificationsRouter.post(
  "/clients/:clientId/plan-update-request",
  notificationsController.requestPlanUpdate
);
