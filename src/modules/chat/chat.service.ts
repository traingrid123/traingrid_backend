import { ChatRoom, MessageType, NotificationType } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { chatRepository } from "./chat.repository";
import { ChatRole } from "./chat.schema";

export class ChatError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ChatError";
  }
}

export type ChatRequester = {
  role: ChatRole;
  userId: string;
};

type ChatMember = {
  id: string;
  role: ChatRole;
  userId: string;
  fullName: string | null;
  profilePhoto: string | null;
  isAdmin: boolean;
  joinedAt: Date;
  lastReadAt: Date | null;
};

type ChatSender = {
  id: string;
  role: ChatRole;
  fullName: string | null;
  profilePhoto: string | null;
};

type ChatMessage = {
  id: string;
  chatRoomId: string;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date;
  sender: ChatSender | null;
  senderRole: ChatRole | "system";
};

type ChatRoomSummary = {
  id: string;
  type: ChatRoom["type"];
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: ChatMember[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  counterpart: ChatMember | null;
};

function mapMember(member: {
  id: string;
  coachId: string | null;
  clientId: string | null;
  isAdmin: boolean;
  joinedAt: Date;
  lastReadAt: Date | null;
  coach: { id: string; fullName: string | null; profilePhoto: string | null } | null;
  client: { id: string; fullName: string | null; profilePhoto: string | null } | null;
}): ChatMember {
  const isCoach = Boolean(member.coachId);
  const user = member.coach ?? member.client;

  return {
    id: member.id,
    role: isCoach ? "coach" : "client",
    userId: member.coachId ?? member.clientId ?? "",
    fullName: user?.fullName ?? null,
    profilePhoto: user?.profilePhoto ?? null,
    isAdmin: member.isAdmin,
    joinedAt: member.joinedAt,
    lastReadAt: member.lastReadAt
  };
}

function mapMessage(message: {
  id: string;
  chatRoomId: string;
  type: MessageType;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  isRead: boolean;
  readAt: Date | null;
  sentAt: Date;
  senderCoach: { id: string; fullName: string | null; profilePhoto: string | null } | null;
  senderClient: { id: string; fullName: string | null; profilePhoto: string | null } | null;
}): ChatMessage {
  if (message.senderCoach) {
    return {
      id: message.id,
      chatRoomId: message.chatRoomId,
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileMimeType: message.fileMimeType,
      isRead: message.isRead,
      readAt: message.readAt,
      sentAt: message.sentAt,
      senderRole: "coach",
      sender: {
        id: message.senderCoach.id,
        role: "coach",
        fullName: message.senderCoach.fullName,
        profilePhoto: message.senderCoach.profilePhoto
      }
    };
  }

  if (message.senderClient) {
    return {
      id: message.id,
      chatRoomId: message.chatRoomId,
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileMimeType: message.fileMimeType,
      isRead: message.isRead,
      readAt: message.readAt,
      sentAt: message.sentAt,
      senderRole: "client",
      sender: {
        id: message.senderClient.id,
        role: "client",
        fullName: message.senderClient.fullName,
        profilePhoto: message.senderClient.profilePhoto
      }
    };
  }

  return {
    id: message.id,
    chatRoomId: message.chatRoomId,
    type: message.type,
    content: message.content,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileMimeType: message.fileMimeType,
    isRead: message.isRead,
    readAt: message.readAt,
    sentAt: message.sentAt,
    senderRole: "system",
    sender: null
  };
}

function findCounterpart(
  members: ChatMember[],
  requester?: ChatRequester
): ChatMember | null {
  if (!requester) {
    return null;
  }

  return (
    members.find(
      (member) =>
        member.role !== requester.role || member.userId !== requester.userId
    ) ?? null
  );
}

function mapRoom(
  room: {
    id: string;
    type: ChatRoom["type"];
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    members: any[];
    messages?: any[];
  },
  requester?: ChatRequester,
  unreadCount = 0
): ChatRoomSummary {
  const members = room.members.map(mapMember);
  const lastMessage = room.messages?.[0] ? mapMessage(room.messages[0]) : null;

  return {
    id: room.id,
    type: room.type,
    name: room.name,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    members,
    lastMessage,
    unreadCount,
    counterpart: findCounterpart(members, requester)
  };
}

async function ensureCoachExists(coachId: string) {
  const coach = await prisma.coach.findUnique({
    where: {
      id: coachId
    },
    select: {
      id: true
    }
  });

  if (!coach) {
    throw new ChatError("Coach not found", 404);
  }
}

async function ensureClientExists(clientId: string) {
  const client = await prisma.client.findUnique({
    where: {
      id: clientId
    },
    select: {
      id: true
    }
  });

  if (!client) {
    throw new ChatError("Client not found", 404);
  }
}

async function ensureRoom(roomId: string) {
  const room = await chatRepository.getRoomById(roomId);

  if (!room) {
    throw new ChatError("Chat room not found", 404);
  }

  return room;
}

async function ensureMember(roomId: string, requester: ChatRequester) {
  const member = await chatRepository.getRoomMember(
    roomId,
    requester.role,
    requester.userId
  );

  if (!member) {
    const room = await chatRepository.getRoomById(roomId);
    if (!room) {
      throw new ChatError("Chat room not found", 404);
    }

    throw new ChatError("You are not a member of this chat room", 403);
  }

  return member;
}

function summarizeMessagePreview(message: {
  type: MessageType;
  content: string | null;
  fileName: string | null;
}) {
  if (message.type === MessageType.TEXT) {
    return message.content ?? "";
  }

  if (message.type === MessageType.IMAGE) {
    return "Sent an image";
  }

  if (message.type === MessageType.VOICE) {
    return "Sent a voice note";
  }

  if (message.type === MessageType.FILE) {
    return message.fileName ? `Sent ${message.fileName}` : "Sent a file";
  }

  return message.content ?? "New message";
}

function buildNotificationTitle(senderName?: string | null) {
  if (senderName) {
    return `New message from ${senderName}`;
  }

  return "New message";
}

export const chatService = {
  async createOrGetDirectRoom(params: {
    coachId: string;
    clientId: string;
    requester?: ChatRequester;
  }) {
    if (params.requester) {
      if (
        params.requester.role === "coach" &&
        params.requester.userId !== params.coachId
      ) {
        throw new ChatError("You are not allowed to create this chat room", 403);
      }

      if (
        params.requester.role === "client" &&
        params.requester.userId !== params.clientId
      ) {
        throw new ChatError("You are not allowed to create this chat room", 403);
      }
    }

    await ensureCoachExists(params.coachId);
    await ensureClientExists(params.clientId);

    const existing = await chatRepository.findDirectRoom(
      params.coachId,
      params.clientId
    );

    if (existing) {
      if (!params.requester) {
        return mapRoom(existing);
      }

      const requester = params.requester;
      const member = existing.members.find((item) =>
        requester.role === "coach"
          ? item.coachId === requester.userId
          : item.clientId === requester.userId
      );

      const unreadCount = await chatRepository.countUnreadMessages({
        roomId: existing.id,
        role: requester.role,
        userId: requester.userId,
        lastReadAt: member?.lastReadAt
      });

      return mapRoom(existing, requester, unreadCount);
    }

    const created = await chatRepository.createDirectRoom(
      params.coachId,
      params.clientId
    );

    return mapRoom(created, params.requester ?? undefined, 0);
  },

  async listRooms(params: {
    requester: ChatRequester;
    page: number;
    limit: number;
    search?: string;
  }) {
    const rooms = await chatRepository.listRoomsForUser({
      role: params.requester.role,
      userId: params.requester.userId,
      page: params.page,
      limit: params.limit,
      search: params.search
    });

    const items = await Promise.all(
      rooms.map(async (room) => {
        const member = room.members.find((item) =>
          params.requester.role === "coach"
            ? item.coachId === params.requester.userId
            : item.clientId === params.requester.userId
        );

        const unreadCount = await chatRepository.countUnreadMessages({
          roomId: room.id,
          role: params.requester.role,
          userId: params.requester.userId,
          lastReadAt: member?.lastReadAt
        });

        return mapRoom(room, params.requester, unreadCount);
      })
    );

    return {
      items,
      page: params.page,
      limit: params.limit
    };
  },

  async getRoom(params: { roomId: string; requester?: ChatRequester }) {
    const room = await ensureRoom(params.roomId);

    if (params.requester) {
      const member = await ensureMember(params.roomId, params.requester);
      const unreadCount = await chatRepository.countUnreadMessages({
        roomId: room.id,
        role: params.requester.role,
        userId: params.requester.userId,
        lastReadAt: member.lastReadAt
      });

      return mapRoom(room, params.requester, unreadCount);
    }

    return mapRoom(room);
  },

  async listMessages(params: {
    roomId: string;
    requester: ChatRequester;
    limit: number;
    before?: Date;
  }) {
    await ensureMember(params.roomId, params.requester);

    const messages = await chatRepository.listMessages({
      roomId: params.roomId,
      limit: params.limit,
      before: params.before
    });

    const nextCursor =
      messages.length === params.limit
        ? messages[messages.length - 1].sentAt.toISOString()
        : null;

    const items = messages.map(mapMessage).reverse();

    return {
      roomId: params.roomId,
      items,
      nextCursor
    };
  },

  async sendMessage(params: {
    roomId: string;
    requester: ChatRequester;
    type: MessageType;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileMimeType?: string;
  }) {
    const room = await ensureRoom(params.roomId);
    const member = await ensureMember(params.roomId, params.requester);

    const senderName =
      params.requester.role === "coach"
        ? member.coach?.fullName
        : member.client?.fullName;

    const senderIds =
      params.requester.role === "coach"
        ? { senderCoachId: params.requester.userId }
        : { senderClientId: params.requester.userId };

    const createdMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatRoomId: params.roomId,
          ...senderIds,
          type: params.type,
          content: params.content ?? null,
          fileUrl: params.fileUrl ?? null,
          fileName: params.fileName ?? null,
          fileMimeType: params.fileMimeType ?? null
        },
        include: {
          senderCoach: {
            select: {
              id: true,
              fullName: true,
              profilePhoto: true
            }
          },
          senderClient: {
            select: {
              id: true,
              fullName: true,
              profilePhoto: true
            }
          }
        }
      });

      await tx.chatRoom.update({
        where: {
          id: params.roomId
        },
        data: {
          updatedAt: new Date()
        }
      });

      const recipients = room.members.filter((item) => {
        if (params.requester.role === "coach") {
          return item.coachId !== params.requester.userId;
        }

        return item.clientId !== params.requester.userId;
      });

      if (recipients.length > 0) {
        const notificationBody = summarizeMessagePreview({
          type: message.type,
          content: message.content,
          fileName: message.fileName
        });

        await tx.notification.createMany({
          data: recipients.map((recipient) => ({
            coachId: recipient.coachId ?? null,
            clientId: recipient.clientId ?? null,
            type: NotificationType.NEW_MESSAGE,
            title: buildNotificationTitle(senderName),
            body: notificationBody,
            data: {
              roomId: message.chatRoomId,
              messageId: message.id,
              senderRole: params.requester.role,
              senderId: params.requester.userId
            }
          }))
        });
      }

      return message;
    });

    const updatedRoom = {
      ...room,
      updatedAt: new Date(),
      messages: [createdMessage]
    };

    return {
      message: mapMessage(createdMessage),
      room: mapRoom(updatedRoom, params.requester)
    };
  },

  async markRoomRead(params: {
    roomId: string;
    requester: ChatRequester;
    readAt?: Date;
  }) {
    const member = await ensureMember(params.roomId, params.requester);

    const readAt = params.readAt ?? new Date();

    await Promise.all([
      chatRepository.updateMemberReadAt(member.id, readAt),
      chatRepository.markMessagesRead({
        roomId: params.roomId,
        role: params.requester.role,
        userId: params.requester.userId,
        readAt
      })
    ]);

    return {
      roomId: params.roomId,
      readAt: readAt.toISOString()
    };
  },

  async searchMessages(params: {
    requester: ChatRequester;
    query: string;
    roomId?: string;
    limit: number;
  }) {
    let roomIds: string[] = [];

    if (params.roomId) {
      await ensureMember(params.roomId, params.requester);
      roomIds = [params.roomId];
    } else {
      const memberships = await chatRepository.listRoomIdsForUser(
        params.requester.role,
        params.requester.userId
      );
      roomIds = memberships.map((item) => item.chatRoomId);
    }

    if (roomIds.length === 0) {
      return {
        items: []
      };
    }

    const results = await chatRepository.searchMessages({
      roomIds,
      query: params.query,
      limit: params.limit
    });

    const items = results.map((result) => ({
      message: mapMessage(result),
      room: mapRoom(result.chatRoom, params.requester)
    }));

    return {
      items
    };
  },

  async getRoomIdsForUser(requester: ChatRequester) {
    const memberships = await chatRepository.listRoomIdsForUser(
      requester.role,
      requester.userId
    );

    return memberships.map((item) => item.chatRoomId);
  }
};
