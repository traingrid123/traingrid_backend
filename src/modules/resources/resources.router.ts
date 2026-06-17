import { Router } from "express";

import { resourcesController } from "./resources.controller";

export const resourcesRouter = Router();

resourcesRouter.post("/", resourcesController.create);
resourcesRouter.get("/coaches/:coachId", resourcesController.listCoachResources);
resourcesRouter.patch("/:resourceId", resourcesController.update);
resourcesRouter.delete("/:resourceId", resourcesController.delete);
resourcesRouter.post("/:resourceId/access", resourcesController.grantAccess);
resourcesRouter.delete("/:resourceId/access/:clientId", resourcesController.revokeAccess);
resourcesRouter.get("/clients/:clientId", resourcesController.listClientResources);
