import { Router, Request, Response } from 'express';

const router = Router();
import { exerciseDBService } from '../services/exerciseDB.service';

/**
 * @openapi
 * /external/exercises:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Search exercises from ExerciseDB
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: bodyPart
 *         schema:
 *           type: string
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of exercises
 *       500:
 *         description: API error
 */
router.get('/exercises', async (req: Request, res: Response) => {
  try {
    const { search, bodyPart, equipment, limit = 20 } = req.query;

    let result;

    if (search) {
      result = await exerciseDBService.searchExercises(search as string, Number(limit));
    } else if (bodyPart) {
      result = await exerciseDBService.getByBodyPart(bodyPart as string, Number(limit));
    } else if (equipment) {
      result = await exerciseDBService.getByEquipment(equipment as string, Number(limit));
    } else {
      result = await exerciseDBService.getExercises({ limit: Number(limit) });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exercises'
    });
  }
});

/**
 * @openapi
 * /external/exercises/{id}:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Get exercise details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exercise details
 *       404:
 *         description: Exercise not found
 */
router.get('/exercises/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await exerciseDBService.getExerciseById(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || 'Exercise not found'
    });
  }
});

/**
 * @openapi
 * /external/exercises/lists/bodyparts:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Get list of body parts
 *     responses:
 *       200:
 *         description: List of body parts
 *       500:
 *         description: API error
 */
router.get('/exercises/lists/bodyparts', async (_req: Request, res: Response) => {
  try {
    const result = await exerciseDBService.getBodyParts();
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch body parts'
    });
  }
});

/**
 * @openapi
 * /external/exercises/lists/equipment:
 *   get:
 *     tags:
 *       - External APIs
 *     summary: Get list of equipment
 *     responses:
 *       200:
 *         description: List of equipment
 *       500:
 *         description: API error
 */
router.get('/exercises/lists/equipment', async (_req: Request, res: Response) => {
  try {
    const result = await exerciseDBService.getEquipmentList();
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch equipment list'
    });
  }
});

export default router;