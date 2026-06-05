import { Router } from "express";

import { clientsController } from "./clients.controller";

export const clientsRouter = Router();

/**
 * @openapi
 * /clients/{clientId}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client profile
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client profile fetched
 */
clientsRouter.get("/:clientId", clientsController.getProfile);

/**
 * @openapi
 * /clients/{clientId}:
 *   patch:
 *     tags:
 *       - Clients
 *     summary: Update client profile
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client profile updated
 */
clientsRouter.patch("/:clientId", clientsController.updateProfile);
clientsRouter.put("/:clientId/profile", clientsController.updateProfile);

/**
 * @openapi
 * /clients/{clientId}/dashboard:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client dashboard data
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard data fetched
 */
clientsRouter.get("/:clientId/dashboard", clientsController.getDashboard);

/**
 * @openapi
 * /clients/{clientId}/coach:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client's assigned coach
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assigned coach fetched
 */
clientsRouter.get("/:clientId/coach", clientsController.getAssignedCoach);

/**
 * @openapi
 * /clients/{clientId}/plan-update-request:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Submit a plan update request for a client
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan update request submitted
 */
clientsRouter.post(
  "/:clientId/plan-update-request",
  clientsController.requestPlanUpdate
);

/**
 * @openapi
 * /clients/{clientId}/leaderboard:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client leaderboard data
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard fetched
 */
clientsRouter.get("/:clientId/leaderboard", clientsController.getLeaderboard);

/**
 * @openapi
 * /clients/{clientId}/analytics:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client analytics
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics fetched
 */
clientsRouter.get("/:clientId/analytics", clientsController.getAnalytics);
