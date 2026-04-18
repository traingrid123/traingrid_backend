import type { MessageType } from "@prisma/client";
import type { Server, Socket } from "socket.io";
import { ZodError } from "zod";

import { logger } from "../../lib/logger";
import { chatSchema } from "./chat.schema";
import { chatService, ChatRequester, ChatError } from "./chat.service";

const validRoles = new Set(["coach", "client"] as const);

type AckPayload = {
  success: boolean;
  data?: unknown;
  message?: string;
};

type AckFn = (payload: AckPayload) => void;

type SocketUser = ChatRequester;

type JoinRoomPayload = {
  roomId?: string;
};

type SendMessagePayload = {
  roomId?: string;
  type?: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
};

type ReadRoomPayload = {
  roomId?: string;
  readAt?: string;
};

function parseSocketUser(socket: Socket): SocketUser | null {
  const auth = socket.handshake.auth as Record<string, unknown> | undefined;
  const userIdFromAuth = typeof auth?.userId === "string" ? auth.userId : null;
  const roleFromAuth = typeof auth?.role === "string" ? auth.role : null;

  const query = socket.handshake.query as Record<string, unknown>;
  const userIdFromQuery =
    typeof query?.userId === "string" ? query.userId : null;
  const roleFromQuery = typeof query?.role === "string" ? query.role : null;

  const userId = userIdFromAuth ?? userIdFromQuery;
  const role = roleFromAuth ?? roleFromQuery;

  if (!userId || !role || !validRoles.has(role as "coach" | "client")) {
    return null;
  }

  return {
    userId,
    role: role as ChatRequester["role"]
  };
}

function sendAck(ack: AckFn | undefined, payload: AckPayload) {
  if (ack) {
    ack(payload);
  }
}

export function registerChatSocket(io: Server): void {
  io.on("connection", async (socket: Socket) => {
    let user: SocketUser | null = null;

    try {
      user = parseSocketUser(socket);
    } catch (error) {
      logger.warn({ error }, "Failed to parse socket auth");
    }

    if (!user) {
      socket.emit("error", { message: "Unauthorized" });
      socket.disconnect(true);
      return;
    }

    socket.data.user = user;

    try {
      const roomIds = await chatService.getRoomIdsForUser(user);
      roomIds.forEach((roomId) => socket.join(roomId));
      socket.emit("rooms:joined", { roomIds });
    } catch (error) {
      logger.warn({ error }, "Failed to join rooms on socket connect");
    }

    socket.on("room:join", async (payload: JoinRoomPayload, ack?: AckFn) => {
      try {
        if (!payload?.roomId) {
          throw new ChatError("Room id is required", 400);
        }

        await chatService.getRoom({ roomId: payload.roomId, requester: user! });
        socket.join(payload.roomId);
        sendAck(ack, { success: true, data: { roomId: payload.roomId } });
      } catch (error) {
        const message =
          error instanceof ChatError ? error.message : "Failed to join room";
        sendAck(ack, { success: false, message });
      }
    });

    socket.on("message:send", async (payload: SendMessagePayload, ack?: AckFn) => {
      try {
        if (!payload?.roomId) {
          throw new ChatError("Room id is required", 400);
        }

        const parsed = chatSchema.sendMessage.parse({
          role: user!.role,
          userId: user!.userId,
          type: payload.type,
          content: payload.content,
          fileUrl: payload.fileUrl,
          fileName: payload.fileName,
          fileMimeType: payload.fileMimeType
        });

        const result = await chatService.sendMessage({
          roomId: payload.roomId,
          requester: user!,
          type: parsed.type,
          content: parsed.content,
          fileUrl: parsed.fileUrl,
          fileName: parsed.fileName,
          fileMimeType: parsed.fileMimeType
        });

        io.to(payload.roomId).emit("message:new", result.message);
        io.to(payload.roomId).emit("room:updated", result.room);

        sendAck(ack, { success: true, data: result });
      } catch (error) {
        const message =
          error instanceof ZodError
            ? "Validation error"
            : error instanceof ChatError
              ? error.message
              : "Failed to send message";
        sendAck(ack, { success: false, message });
      }
    });

    socket.on("room:read", async (payload: ReadRoomPayload, ack?: AckFn) => {
      try {
        if (!payload?.roomId) {
          throw new ChatError("Room id is required", 400);
        }

        const readAt = payload.readAt ? new Date(payload.readAt) : undefined;
        if (readAt && Number.isNaN(readAt.getTime())) {
          throw new ChatError("Invalid readAt timestamp", 400);
        }

        const result = await chatService.markRoomRead({
          roomId: payload.roomId,
          requester: user!,
          readAt
        });

        io.to(payload.roomId).emit("room:read", {
          roomId: payload.roomId,
          userId: user!.userId,
          role: user!.role,
          readAt: result.readAt
        });

        sendAck(ack, { success: true, data: result });
      } catch (error) {
        const message =
          error instanceof ChatError ? error.message : "Failed to mark read";
        sendAck(ack, { success: false, message });
      }
    });

    socket.on("disconnect", (reason: string) => {
      logger.debug({ reason, userId: user?.userId }, "Socket disconnected");
    });
  });
}
