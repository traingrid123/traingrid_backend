import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { pricingTiersController } from "./pricingTiers.controller";

export const pricingTiersRouter = Router();

pricingTiersRouter.use(authMiddleware);

/**
 * @openapi
 * /pricing-tiers:
 *   get:
 *     tags:
 *       - Pricing Tiers
 *     summary: List coach's pricing tiers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing tiers fetched
 */
pricingTiersRouter.get("/", pricingTiersController.listPricingTiers);

/**
 * @openapi
 * /pricing-tiers:
 *   post:
 *     tags:
 *       - Pricing Tiers
 *     summary: Create a new pricing tier
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PricingTierCreate"
 *     responses:
 *       201:
 *         description: Pricing tier created
 */
pricingTiersRouter.post(
  "/",
  roleMiddleware(["coach"]),
  pricingTiersController.createPricingTier
);

/**
 * @openapi
 * /pricing-tiers/{tierId}:
 *   get:
 *     tags:
 *       - Pricing Tiers
 *     summary: Get pricing tier details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing tier fetched
 */
pricingTiersRouter.get("/:tierId", pricingTiersController.getPricingTier);

/**
 * @openapi
 * /pricing-tiers/{tierId}:
 *   patch:
 *     tags:
 *       - Pricing Tiers
 *     summary: Update a pricing tier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/PricingTierUpdate"
 *     responses:
 *       200:
 *         description: Pricing tier updated
 */
pricingTiersRouter.patch(
  "/:tierId",
  roleMiddleware(["coach"]),
  pricingTiersController.updatePricingTier
);

/**
 * @openapi
 * /pricing-tiers/{tierId}:
 *   delete:
 *     tags:
 *       - Pricing Tiers
 *     summary: Delete a pricing tier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing tier deleted
 */
pricingTiersRouter.delete(
  "/:tierId",
  roleMiddleware(["coach"]),
  pricingTiersController.deletePricingTier
);

/**
 * @openapi
 * /pricing-tiers/{tierId}/toggle:
 *   post:
 *     tags:
 *       - Pricing Tiers
 *     summary: Toggle pricing tier active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing tier toggled
 */
pricingTiersRouter.post(
  "/:tierId/toggle",
  roleMiddleware(["coach"]),
  pricingTiersController.togglePricingTier
);

/**
 * @openapi
 * /pricing-tiers/{tierId}/popular:
 *   post:
 *     tags:
 *       - Pricing Tiers
 *     summary: Set pricing tier as popular
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPopular:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing tier popularity updated
 */
pricingTiersRouter.post(
  "/:tierId/popular",
  roleMiddleware(["coach"]),
  pricingTiersController.setPopularTier
);
