import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { resolveFirebaseAuthContext } from "../auth/firebase.session";
import { chatSchema, ChatRequesterInput } from "./chat.schema";
import { ChatError, chatService, ChatRequester } from "./chat.service";

function parseBearerToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [type, token] = header.split(" ");

  if (!token || type.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

async function parseAuthHeader(req: Request): Promise<ChatRequester | null> {
  if (req.auth) {
    return {
      role: req.auth.role,
      userId: req.auth.userId
    };
  }

  const token = parseBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    const payload = await resolveFirebaseAuthContext(token);
    return {
      role: payload.role,
      userId: payload.userId
    };
  } catch {
    throw new ChatError("Invalid access token", 401);
  }
}

function getRoomId(req: Request): string {
  const raw = req.params.roomId;
  const roomId = Array.isArray(raw) ? raw[0] : raw;

  if (!roomId) {
    throw new ChatError("Room id is required", 400);
  }

  return roomId;
}

async function resolveRequester(
  req: Request,
  fallback: ChatRequesterInput
): Promise<ChatRequester> {
  const fromHeader = await parseAuthHeader(req);

  if (fromHeader) {
    return fromHeader;
  }

  if (fallback.role && fallback.userId) {
    return {
      role: fallback.role,
      userId: fallback.userId
    };
  }

  throw new ChatError("User identity is required", 401);
}

function handleChatError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof ChatError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  next(error);
}

export const chatController = {
  async createDirectRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.directRoom.parse(req.body);
      const requester = await resolveRequester(req, input);

      const room = await chatService.createOrGetDirectRoom({
        coachId: input.coachId,
        clientId: input.clientId,
        requester
      });

      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.listRooms.parse(req.query);
      const requester = await resolveRequester(req, input);

      const result = await chatService.listRooms({
        requester,
        page: input.page,
        limit: input.limit,
        search: input.search
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async getRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.requester.parse(req.query);
      const requester = await resolveRequester(req, input);

      const room = await chatService.getRoom({
        roomId: getRoomId(req),
        requester
      });

      res.status(200).json({
        success: true,
        data: room
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async listMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.listMessages.parse(req.query);
      const requester = await resolveRequester(req, input);

      const result = await chatService.listMessages({
        roomId: getRoomId(req),
        requester,
        limit: input.limit,
        before: input.before
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.sendMessage.parse(req.body);
      const requester = await resolveRequester(req, input);

      const result = await chatService.sendMessage({
        roomId: getRoomId(req),
        requester,
        type: input.type,
        content: input.content,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileMimeType: input.fileMimeType
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.markRead.parse(req.body);
      const requester = await resolveRequester(req, input);

      const result = await chatService.markRoomRead({
        roomId: getRoomId(req),
        requester,
        readAt: input.readAt
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  },

  async searchMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const input = chatSchema.searchMessages.parse(req.query);
      const requester = await resolveRequester(req, input);

      const result = await chatService.searchMessages({
        requester,
        query: input.query,
        roomId: input.roomId,
        limit: input.limit
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      handleChatError(error, res, next);
    }
  }
};
