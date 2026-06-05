import { Router } from "express";

import { coachesController } from "./coaches.controller";

export const coachesRouter = Router();

/**
 * @openapi
 * /coaches/discover:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: Discover coaches
 *     responses:
 *       200:
 *         description: Coaches list fetched
 */
coachesRouter.get("/discover", coachesController.discover);

/**
 * @openapi
 * /coaches/{coachId}:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: Get coach profile
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coach profile fetched
 */
coachesRouter.get("/:coachId", coachesController.getProfile);

/**
 * @openapi
 * /coaches/{coachId}:
 *   patch:
 *     tags:
 *       - Coaches
 *     summary: Update coach profile
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coach profile updated
 */
coachesRouter.patch("/:coachId", coachesController.updateProfile);
coachesRouter.put("/:coachId/profile", coachesController.updateProfile);

/**
 * @openapi
 * /coaches/{coachId}/discovery-card:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: Get coach discovery card
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discovery card fetched
 */
coachesRouter.get("/:coachId/discovery-card", coachesController.getDiscoveryCard);

/**
 * @openapi
 * /coaches/{coachId}/dashboard:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: Get coach dashboard data
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard data fetched
 */
coachesRouter.get("/:coachId/dashboard", coachesController.getDashboard);

/**
 * @openapi
 * /coaches/{coachId}/clients:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: List coach clients
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clients fetched
 */
coachesRouter.get("/:coachId/clients", coachesController.listClients);

/**
 * @openapi
 * /coaches/{coachId}/clients:
 *   post:
 *     tags:
 *       - Coaches
 *     summary: Add a client to coach
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Client added
 */
coachesRouter.post("/:coachId/clients", coachesController.addClient);

/**
 * @openapi
 * /coaches/{coachId}/clients/{clientId}:
 *   get:
 *     tags:
 *       - Coaches
 *     summary: Get coach-side client detail
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client detail fetched
 */
coachesRouter.get("/:coachId/clients/:clientId", coachesController.getClientDetail);
