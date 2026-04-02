import { Router } from "express";

import { chatController } from "./chat.controller";

export const chatRouter = Router();

chatRouter.post("/rooms/direct", chatController.createDirectRoom);
chatRouter.get("/rooms", chatController.listRooms);
chatRouter.get("/rooms/:roomId", chatController.getRoom);
chatRouter.get("/rooms/:roomId/messages", chatController.listMessages);
chatRouter.post("/rooms/:roomId/messages", chatController.sendMessage);
chatRouter.post("/rooms/:roomId/read", chatController.markRead);
chatRouter.get("/messages/search", chatController.searchMessages);
