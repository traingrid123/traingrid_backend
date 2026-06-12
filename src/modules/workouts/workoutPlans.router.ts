import { Router } from "express";

import { writeRateLimit } from "../../config/rateLimit";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { workoutPlansController } from "./workoutPlans.controller";

export const workoutPlansRouter = Router();

/**
 * @openapi
 * /coaches/{coachId}/workout-plans:
 *   post:
 *     tags: [Workouts]
 *     summary: Create a workout plan for a coach
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutPlanCreateRequest"
 *     responses:
 *       201:
 *         description: Workout plan created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutPlanResponse"
 */
workoutPlansRouter.post(
  "/coaches/:coachId/workout-plans",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.createCoachPlan
);

/**
 * @openapi
 * /coaches/{coachId}/workout-plans:
 *   get:
 *     tags: [Workouts]
 *     summary: List workout plans for a coach
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Workout plans fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutPlansResponse"
 */
workoutPlansRouter.get(
  "/coaches/:coachId/workout-plans",
  authMiddleware,
  roleMiddleware(["coach"]),
  workoutPlansController.listCoachPlans
);

/**
 * @openapi
 * /coaches/{coachId}/workout-plans/{planId}:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout plan details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Workout plan fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutPlanResponse"
 */
workoutPlansRouter.get(
  "/coaches/:coachId/workout-plans/:planId",
  authMiddleware,
  roleMiddleware(["coach"]),
  workoutPlansController.getCoachPlan
);

/**
 * @openapi
 * /coaches/{coachId}/workout-plans/{planId}:
 *   patch:
 *     tags: [Workouts]
 *     summary: Update workout plan (optimistic versioned update)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutPlanUpdateRequest"
 *     responses:
 *       200:
 *         description: Workout plan updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutPlanResponse"
 *       409:
 *         description: Version conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
workoutPlansRouter.patch(
  "/coaches/:coachId/workout-plans/:planId",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.updateCoachPlan
);

/**
 * @openapi
 * /coaches/{coachId}/workout-plans/{planId}/duplicate:
 *   post:
 *     tags: [Workouts]
 *     summary: Duplicate a workout plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutPlanDuplicateRequest"
 *     responses:
 *       201:
 *         description: Workout plan duplicated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutPlanResponse"
 */
workoutPlansRouter.post(
  "/coaches/:coachId/workout-plans/:planId/duplicate",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.duplicateCoachPlan
);

workoutPlansRouter.post(
  "/coaches/:coachId/workout-plans/:planId/archive",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.archiveCoachPlan
);

workoutPlansRouter.post(
  "/coaches/:coachId/workout-plans/:planId/unarchive",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.unarchiveCoachPlan
);

workoutPlansRouter.delete(
  "/coaches/:coachId/workout-plans/:planId",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.deleteCoachPlan
);

/**
 * @openapi
 * /coaches/{coachId}/workout-plan-assignments:
 *   post:
 *     tags: [Workouts]
 *     summary: Assign a workout plan to a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutPlanAssignmentRequest"
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutAssignmentResponse"
 */
workoutPlansRouter.post(
  "/coaches/:coachId/workout-plan-assignments",
  authMiddleware,
  roleMiddleware(["coach"]),
  writeRateLimit,
  workoutPlansController.assignPlan
);

/**
 * @openapi
 * /coaches/{coachId}/clients/{clientId}/workout-analytics:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout analytics for a coach's client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coachId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Analytics fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutAnalyticsResponse"
 */
workoutPlansRouter.get(
  "/coaches/:coachId/clients/:clientId/workout-analytics",
  authMiddleware,
  roleMiddleware(["coach"]),
  workoutPlansController.getCoachClientWorkoutAnalytics
);

/**
 * @openapi
 * /clients/{clientId}/workouts/today:
 *   get:
 *     tags: [Workouts]
 *     summary: Get today's workout for a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Today's workout fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutTodayResponse"
 */
workoutPlansRouter.get(
  "/clients/:clientId/workouts/today",
  authMiddleware,
  roleMiddleware(["client"]),
  workoutPlansController.getTodayWorkout
);

/**
 * @openapi
 * /clients/{clientId}/workouts/{workoutDayId}:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout detail for a client workout day
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: workoutDayId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Workout detail fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutDetailResponse"
 */
workoutPlansRouter.get(
  "/clients/:clientId/workouts/:workoutDayId",
  authMiddleware,
  roleMiddleware(["client"]),
  workoutPlansController.getWorkoutDetail
);

/**
 * @openapi
 * /clients/{clientId}/workouts/{workoutDayId}/complete:
 *   post:
 *     tags: [Workouts]
 *     summary: Mark a client workout as completed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: workoutDayId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutCompleteRequest"
 *     responses:
 *       201:
 *         description: Workout completion recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutCompleteResponse"
 */
workoutPlansRouter.post(
  "/clients/:clientId/workouts/:workoutDayId/complete",
  authMiddleware,
  roleMiddleware(["client"]),
  writeRateLimit,
  workoutPlansController.completeWorkout
);

/**
 * @openapi
 * /clients/{clientId}/workout-analytics:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workout analytics for a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client workout analytics fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/WorkoutAnalyticsResponse"
 */
workoutPlansRouter.get(
  "/clients/:clientId/workout-analytics",
  authMiddleware,
  roleMiddleware(["client"]),
  workoutPlansController.getClientWorkoutAnalytics
);
