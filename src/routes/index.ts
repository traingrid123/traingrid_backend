import { Router } from "express";

import { chatRouter } from "../modules/chat/chat.router";
import { clientsRouter } from "../modules/clients/clients.router";
import { coachesRouter } from "../modules/coaches/coaches.router";
<<<<<<< HEAD
import { workoutPlansRouter } from "../modules/workouts/workoutPlans.router";
=======
import { notificationsRouter } from "../modules/notifications/notifications.router";
>>>>>>> 47bb829989354e396a7976726eab2bec100d851b

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
<<<<<<< HEAD
router.use("/", workoutPlansRouter);
=======
router.use("/notifications", notificationsRouter);
>>>>>>> 47bb829989354e396a7976726eab2bec100d851b

export default router;
