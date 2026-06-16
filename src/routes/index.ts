import { Router } from "express";

import { chatRouter } from "../modules/chat/chat.router";
import { clientsRouter } from "../modules/clients/clients.router";
import { coachesRouter } from "../modules/coaches/coaches.router";
import { exercisesRouter } from "../modules/exercises/exercises.router";
import { logsRouter } from "../modules/logs/logs.router";
import { marketingRouter } from "../modules/marketing/marketing.router";
import { notificationsRouter } from "../modules/notifications/notifications.router";
import { nutritionPlansRouter } from "../modules/nutrition/nutritionPlans.router";
import { progressRouter } from "../modules/progress/progress.router";
import { analyticsRouter } from "../modules/analytics/analytics.router";
import { habitsRouter } from "../modules/habits/habits.router";
import { relationshipsRouter } from "../modules/relationships/relationships.router";
import { resourcesRouter } from "../modules/resources/resources.router";
import { workoutPlansRouter } from "../modules/workouts/workoutPlans.router";
import externalApisRouter from "./externalApis.router";
import nutritionApisRouter from "./nutritionApis.router";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TrainGrid backend is running"
  });
});

router.use("/chat", chatRouter);
router.use("/clients", clientsRouter);
router.use("/clients", logsRouter);
router.use("/coaches", coachesRouter);
router.use("/exercises", exercisesRouter);
router.use("/marketing", marketingRouter);
router.use("/notifications", notificationsRouter);
router.use("/nutrition", nutritionPlansRouter);
router.use("/analytics", analyticsRouter);
router.use("/progress", progressRouter);
router.use("/habits", habitsRouter);
router.use("/relationships", relationshipsRouter);
router.use("/resources", resourcesRouter);
router.use("/workouts", workoutPlansRouter);
router.use("/external", externalApisRouter);
router.use("/external", nutritionApisRouter);

export default router;
