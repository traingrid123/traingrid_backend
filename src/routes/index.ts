import { Router } from "express";

import { chatRouter } from "../modules/chat/chat.router";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TrainGrid backend is running"
  });
});

router.use("/chat", chatRouter);

export default router;
