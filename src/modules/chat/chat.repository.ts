import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { ChatRole } from "./chat.schema";

const memberInclude = {
  include: {
    coach: {
      select: {
        id: true,
        fullName: true,
        profilePhoto: true
      }
    },
    client: {
      select: {
        id: true,
        fullName: true,
        profilePhoto: true
      }
    }
  }
} as const;

const messageSenderInclude = {
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
} as const;

function memberFilter(role: ChatRole, userId: string) {
  return role === "coach" ? { coachId: userId } : { clientId: userId };
}

function buildRoomWhere(
  role: ChatRole,
  userId: string,
  search?: string
): Prisma.ChatRoomWhereInput {
  const accessFilter: Prisma.ChatRoomWhereInput = {
    members: {
      some: memberFilter(role, userId)
    }
  };

  if (!search) {
    return accessFilter;
  }

  const searchFilter: Prisma.ChatRoomWhereInput = {
    OR: [
      {
        name: {
          contains: search,
          mode: "insensitive"
        }
      },
      {
        members: {
          some: {
            coach: {
              fullName: {
                contains: search,
                mode: "insensitive"
              }
            }
          }
        }
      },
      {
        members: {
          some: {
            client: {
              fullName: {
                contains: search,
                mode: "insensitive"
              }
            }
          }
        }
      }
    ]
  };

  return {
    AND: [accessFilter, searchFilter]
  };
}

export const chatRepository = {
  findDirectRoom(coachId: string, clientId: string) {
    return prisma.chatRoom.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          {
            members: {
              some: {
                coachId
              }
            }
          },
          {
            members: {
              some: {
                clientId
              }
            }
          }
        ]
      },
      include: {
        members: memberInclude,
        messages: {
          orderBy: {
            sentAt: "desc"
          },
          take: 1,
          ...messageSenderInclude
        }
      }
    });
  },

  createDirectRoom(coachId: string, clientId: string) {
    return prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        members: {
          create: [
            {
              coachId
            },
            {
              clientId
            }
          ]
        }
      },
      include: {
        members: memberInclude,
        messages: {
          orderBy: {
            sentAt: "desc"
          },
          take: 1,
          ...messageSenderInclude
        }
      }
    });
  },

  getRoomById(roomId: string) {
    return prisma.chatRoom.findUnique({
      where: {
        id: roomId
      },
      include: {
        members: memberInclude,
        messages: {
          orderBy: {
            sentAt: "desc"
          },
          take: 1,
          ...messageSenderInclude
        }
      }
    });
  },

  getRoomMember(roomId: string, role: ChatRole, userId: string) {
    return prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        ...memberFilter(role, userId)
      },
      include: memberInclude.include
    });
  },

  listRoomsForUser(params: {
    role: ChatRole;
    userId: string;
    page: number;
    limit: number;
    search?: string;
  }) {
    const where = buildRoomWhere(params.role, params.userId, params.search);
    const skip = (params.page - 1) * params.limit;

    return prisma.chatRoom.findMany({
      where,
      orderBy: {
        updatedAt: "desc"
      },
      skip,
      take: params.limit,
      include: {
        members: memberInclude,
        messages: {
          orderBy: {
            sentAt: "desc"
          },
          take: 1,
          ...messageSenderInclude
        }
      }
    });
  },

  listRoomIdsForUser(role: ChatRole, userId: string) {
    return prisma.chatRoomMember.findMany({
      where: memberFilter(role, userId),
      select: {
        chatRoomId: true
      }
    });
  },

  listMessages(params: { roomId: string; limit: number; before?: Date }) {
    return prisma.message.findMany({
      where: {
        chatRoomId: params.roomId,
        ...(params.before
          ? {
              sentAt: {
                lt: params.before
              }
            }
          : {})
      },
      orderBy: {
        sentAt: "desc"
      },
      take: params.limit,
      ...messageSenderInclude
    });
  },

  createMessage(params: {
    roomId: string;
    senderCoachId?: string;
    senderClientId?: string;
    type: Prisma.MessageCreateInput["type"];
    content?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileMimeType?: string | null;
  }) {
    return prisma.message.create({
      data: {
        chatRoomId: params.roomId,
        senderCoachId: params.senderCoachId ?? null,
        senderClientId: params.senderClientId ?? null,
        type: params.type,
        content: params.content ?? null,
        fileUrl: params.fileUrl ?? null,
        fileName: params.fileName ?? null,
        fileMimeType: params.fileMimeType ?? null
      },
      ...messageSenderInclude
    });
  },

  updateRoomTimestamp(roomId: string, updatedAt: Date) {
    return prisma.chatRoom.update({
      where: {
        id: roomId
      },
      data: {
        updatedAt
      }
    });
  },

  updateMemberReadAt(memberId: string, readAt: Date) {
    return prisma.chatRoomMember.update({
      where: {
        id: memberId
      },
      data: {
        lastReadAt: readAt
      }
    });
  },

  markMessagesRead(params: {
    roomId: string;
    role: ChatRole;
    userId: string;
    readAt: Date;
  }) {
    const senderFilter =
      params.role === "coach"
        ? { NOT: { senderCoachId: params.userId } }
        : { NOT: { senderClientId: params.userId } };

    return prisma.message.updateMany({
      where: {
        chatRoomId: params.roomId,
        ...senderFilter,
        isRead: false,
        sentAt: {
          lte: params.readAt
        }
      },
      data: {
        isRead: true,
        readAt: params.readAt
      }
    });
  },

  countUnreadMessages(params: {
    roomId: string;
    role: ChatRole;
    userId: string;
    lastReadAt?: Date | null;
  }) {
    const senderFilter =
      params.role === "coach"
        ? { NOT: { senderCoachId: params.userId } }
        : { NOT: { senderClientId: params.userId } };

    return prisma.message.count({
      where: {
        chatRoomId: params.roomId,
        ...senderFilter,
        ...(params.lastReadAt
          ? {
              sentAt: {
                gt: params.lastReadAt
              }
            }
          : {})
      }
    });
  },

  searchMessages(params: {
    roomIds: string[];
    query: string;
    limit: number;
  }) {
    return prisma.message.findMany({
      where: {
        chatRoomId: {
          in: params.roomIds
        },
        OR: [
          {
            content: {
              contains: params.query,
              mode: "insensitive"
            }
          },
          {
            fileName: {
              contains: params.query,
              mode: "insensitive"
            }
          }
        ]
      },
      orderBy: {
        sentAt: "desc"
      },
      take: params.limit,
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
        },
        chatRoom: {
          include: {
            members: memberInclude
          }
        }
      }
    });
  }
};
