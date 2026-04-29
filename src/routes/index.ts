import { Router } from "express";

import { chatRouter } from "../modules/chat/chat.router";
import { clientsRouter } from "../modules/clients/clients.router";
import { coachesRouter } from "../modules/coaches/coaches.router";
import { notificationsRouter } from "../modules/notifications/notifications.router";

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
router.use("/notifications", notificationsRouter);

export default router;
