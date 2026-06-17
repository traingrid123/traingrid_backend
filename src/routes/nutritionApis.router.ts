import { Router, Request, Response } from 'express';

const router = Router();
import { usdaService } from '../services/usda.service';

/**
 * @openapi
 * /external/foods:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Search foods from USDA FoodData Central
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of foods
 *       500:
 *         description: API error
 */
router.get('/foods', async (req: Request, res: Response) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const result = await usdaService.searchFoods(query, Number(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search foods'
    });
  }
});

/**
 * @openapi
 * /external/foods/{fdcId}:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Get food details and nutrients
 *     parameters:
 *       - in: path
 *         name: fdcId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Food details with nutrients
 *       404:
 *         description: Food not found
 */
router.get('/foods/:fdcId', async (req: Request, res: Response) => {
  try {
    const fdcId = Array.isArray(req.params.fdcId) ? req.params.fdcId[0] : req.params.fdcId;
    const result = await usdaService.getFoodNutrients(fdcId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Food not found'
    });
  }
});

export default router;