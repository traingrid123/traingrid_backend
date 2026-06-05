import { Router } from "express";

import { chatRouter } from "../modules/chat/chat.router";
import { clientsRouter } from "../modules/clients/clients.router";
import { coachesRouter } from "../modules/coaches/coaches.router";
import { workoutPlansRouter } from "../modules/workouts/workoutPlans.router";
import { notificationsRouter } from "../modules/notifications/notifications.router";
import { analyticsRouter } from "../modules/analytics/analytics.router";
import { progressRouter } from "../modules/progress/progress.router";
import { habitsRouter } from "../modules/habits/habits.router";
import { nutritionRouter } from "../modules/nutrition/nutritionPlans.router";
import { relationshipsRouter } from "../modules/relationships/relationships.router";
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
router.use("/coaches", coachesRouter);
router.use("/workouts", workoutPlansRouter);
router.use("/notifications", notificationsRouter);
router.use("/analytics", analyticsRouter);
router.use("/progress", progressRouter);
router.use("/habits", habitsRouter);
router.use("/nutrition", nutritionRouter);
router.use("/relationships", relationshipsRouter);
router.use("/external", externalApisRouter);
router.use("/external", nutritionApisRouter);

export default router;
