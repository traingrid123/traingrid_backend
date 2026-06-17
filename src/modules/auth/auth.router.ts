import { Router } from "express";

import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/session", authController.syncSession);
authRouter.get("/me", authMiddleware, authController.getCurrentUser);
authRouter.post("/logout", authController.logout);
