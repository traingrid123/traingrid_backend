import { Router } from "express";

import { usdaRateLimit, writeRateLimit } from "../../config/rateLimit";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { foodsController } from "./foods.controller";

export const foodsRouter = Router();

/**
 * @openapi
 * /foods/search:
 *   get:
 *     tags: [Foods]
 *     summary: Search foods (USDA + local cache)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200:
 *         description: Food search results
 */
foodsRouter.get(
  "/search",
  authMiddleware,
  roleMiddleware(["coach", "client"]),
  usdaRateLimit,
  foodsController.search
);

/**
 * @openapi
 * /foods/{fdcId}:
 *   get:
 *     tags: [Foods]
 *     summary: Get food detail by FDC id
 */
foodsRouter.get(
  "/:fdcId",
  authMiddleware,
  roleMiddleware(["coach", "client"]),
  foodsController.detail
);

/**
 * @openapi
 * /foods/{fdcId}/refresh:
 *   post:
 *     tags: [Foods]
 *     summary: Force refresh a food from USDA
 */
foodsRouter.post(
  "/:fdcId/refresh",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  foodsController.refresh
);
