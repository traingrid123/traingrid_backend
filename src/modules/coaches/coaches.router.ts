import { Router } from "express";

import { coachesController } from "./coaches.controller";

export const coachesRouter = Router();

coachesRouter.get("/discover", coachesController.discover);
coachesRouter.get("/:coachId", coachesController.getProfile);
coachesRouter.patch("/:coachId", coachesController.updateProfile);
coachesRouter.get("/:coachId/discovery-card", coachesController.getDiscoveryCard);
coachesRouter.get("/:coachId/dashboard", coachesController.getDashboard);
coachesRouter.get("/:coachId/clients", coachesController.listClients);
coachesRouter.post("/:coachId/clients", coachesController.addClient);
coachesRouter.get("/:coachId/clients/:clientId", coachesController.getClientDetail);
