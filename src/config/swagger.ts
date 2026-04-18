import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { env } from "./env";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TrainGrid Backend API",
      version: "1.0.0"
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication for clients and coaches"
      },
      {
        name: "Chat",
        description: "Direct room and message management"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        AuthTokens: {
          type: "object",
          properties: {
            tokenType: { type: "string", example: "Bearer" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            accessTokenExpiresIn: { type: "string", example: "15m" },
            refreshTokenExpiresIn: { type: "string", example: "30d" }
          },
          required: [
            "tokenType",
            "accessToken",
            "refreshToken",
            "accessTokenExpiresIn",
            "refreshTokenExpiresIn"
          ]
        },
        ClientUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { type: "string", example: "client" },
            fullName: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            gender: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" }
          },
          required: ["id", "role", "fullName", "isActive", "createdAt"]
        },
        CoachUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { type: "string", example: "coach" },
            fullName: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            tier: { type: "string", example: "PRO" },
            specialisations: { type: "array", items: { type: "string" } },
            coachingMode: { type: "string", nullable: true },
            isVerified: { type: "boolean" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" }
          },
          required: [
            "id",
            "role",
            "fullName",
            "tier",
            "specialisations",
            "isVerified",
            "isActive",
            "createdAt"
          ]
        },
        AuthClientRegisterRequest: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "Aarav Shah" },
            email: { type: "string", example: "aarav@example.com" },
            phone: { type: "string", example: "+919999999999" },
            password: { type: "string", example: "StrongPassword123" },
            gender: { type: "string", example: "MALE" },
            dateOfBirth: { type: "string", format: "date" }
          },
          required: ["fullName", "password"]
        },
        AuthCoachRegisterRequest: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "Nisha Verma" },
            email: { type: "string", example: "nisha@example.com" },
            phone: { type: "string", example: "+919999999999" },
            password: { type: "string", example: "StrongPassword123" },
            tier: { type: "string", example: "PRO" },
            specialisations: {
              type: "array",
              items: { type: "string" },
              example: ["Strength", "Body Recomp"]
            },
            coachingMode: { type: "string", example: "ONLINE" }
          },
          required: ["fullName", "password", "tier", "specialisations"]
        },
        AuthLoginRequest: {
          type: "object",
          properties: {
            email: { type: "string", example: "aarav@example.com" },
            phone: { type: "string", example: "+919999999999" },
            password: { type: "string", example: "StrongPassword123" }
          },
          required: ["password"]
        },
        AuthClientResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/ClientUser" },
                tokens: { $ref: "#/components/schemas/AuthTokens" }
              },
              required: ["user", "tokens"]
            }
          },
          required: ["success", "data"]
        },
        AuthCoachResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/CoachUser" },
                tokens: { $ref: "#/components/schemas/AuthTokens" }
              },
              required: ["user", "tokens"]
            }
          },
          required: ["success", "data"]
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation error" },
            issues: { type: "object", nullable: true }
          },
          required: ["success", "message"]
        },
        ChatRole: {
          type: "string",
          enum: ["coach", "client"]
        },
        ChatRoomType: {
          type: "string",
          enum: ["DIRECT", "GROUP", "BROADCAST"]
        },
        ChatMessageType: {
          type: "string",
          enum: ["TEXT", "IMAGE", "FILE", "VOICE", "SYSTEM"]
        },
        ChatSenderRole: {
          type: "string",
          enum: ["coach", "client", "system"]
        },
        ChatUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { $ref: "#/components/schemas/ChatRole" },
            fullName: { type: "string", nullable: true },
            profilePhoto: { type: "string", nullable: true }
          },
          required: ["id", "role", "fullName", "profilePhoto"]
        },
        ChatMember: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { $ref: "#/components/schemas/ChatRole" },
            userId: { type: "string" },
            fullName: { type: "string", nullable: true },
            profilePhoto: { type: "string", nullable: true },
            isAdmin: { type: "boolean" },
            joinedAt: { type: "string", format: "date-time" },
            lastReadAt: { type: "string", format: "date-time", nullable: true }
          },
          required: [
            "id",
            "role",
            "userId",
            "fullName",
            "profilePhoto",
            "isAdmin",
            "joinedAt",
            "lastReadAt"
          ]
        },
        ChatMessageSender: {
          type: "object",
          properties: {
            id: { type: "string" },
            role: { $ref: "#/components/schemas/ChatRole" },
            fullName: { type: "string", nullable: true },
            profilePhoto: { type: "string", nullable: true }
          },
          required: ["id", "role", "fullName", "profilePhoto"]
        },
        ChatMessage: {
          type: "object",
          properties: {
            id: { type: "string" },
            chatRoomId: { type: "string" },
            type: { $ref: "#/components/schemas/ChatMessageType" },
            content: { type: "string", nullable: true },
            fileUrl: { type: "string", nullable: true },
            fileName: { type: "string", nullable: true },
            fileMimeType: { type: "string", nullable: true },
            isRead: { type: "boolean" },
            readAt: { type: "string", format: "date-time", nullable: true },
            sentAt: { type: "string", format: "date-time" },
            senderRole: { $ref: "#/components/schemas/ChatSenderRole" },
            sender: {
              allOf: [{ $ref: "#/components/schemas/ChatMessageSender" }],
              nullable: true
            }
          },
          required: [
            "id",
            "chatRoomId",
            "type",
            "content",
            "fileUrl",
            "fileName",
            "fileMimeType",
            "isRead",
            "readAt",
            "sentAt",
            "senderRole",
            "sender"
          ]
        },
        ChatRoom: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { $ref: "#/components/schemas/ChatRoomType" },
            name: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            members: {
              type: "array",
              items: { $ref: "#/components/schemas/ChatMember" }
            },
            lastMessage: {
              allOf: [{ $ref: "#/components/schemas/ChatMessage" }],
              nullable: true
            },
            unreadCount: { type: "integer" },
            counterpart: {
              allOf: [{ $ref: "#/components/schemas/ChatMember" }],
              nullable: true
            }
          },
          required: [
            "id",
            "type",
            "name",
            "createdAt",
            "updatedAt",
            "members",
            "lastMessage",
            "unreadCount",
            "counterpart"
          ]
        },
        ChatDirectRoomRequest: {
          type: "object",
          properties: {
            coachId: { type: "string", example: "coach_123" },
            clientId: { type: "string", example: "client_456" }
          },
          required: ["coachId", "clientId"]
        },
        ChatSendMessageRequest: {
          type: "object",
          properties: {
            type: {
              $ref: "#/components/schemas/ChatMessageType",
              default: "TEXT"
            },
            content: {
              type: "string",
              example: "Hey, how is your progress going?"
            },
            fileUrl: {
              type: "string",
              format: "uri",
              example: "https://cdn.example.com/chat/voice-note.mp3"
            },
            fileName: { type: "string", example: "voice-note.mp3" },
            fileMimeType: { type: "string", example: "audio/mpeg" }
          },
          required: ["type"]
        },
        ChatMarkReadRequest: {
          type: "object",
          properties: {
            readAt: { type: "string", format: "date-time" }
          }
        },
        ChatRoomsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChatRoom" }
                },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 }
              },
              required: ["items", "page", "limit"]
            }
          },
          required: ["success", "data"]
        },
        ChatRoomResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/ChatRoom" }
          },
          required: ["success", "data"]
        },
        ChatMessagesResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                roomId: { type: "string" },
                items: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChatMessage" }
                },
                nextCursor: { type: "string", nullable: true }
              },
              required: ["roomId", "items", "nextCursor"]
            }
          },
          required: ["success", "data"]
        },
        ChatSendMessageResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: { $ref: "#/components/schemas/ChatMessage" },
                room: { $ref: "#/components/schemas/ChatRoom" }
              },
              required: ["message", "room"]
            }
          },
          required: ["success", "data"]
        },
        ChatReadResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                roomId: { type: "string" },
                readAt: { type: "string", format: "date-time" }
              },
              required: ["roomId", "readAt"]
            }
          },
          required: ["success", "data"]
        },
        ChatSearchResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      message: { $ref: "#/components/schemas/ChatMessage" },
                      room: { $ref: "#/components/schemas/ChatRoom" }
                    },
                    required: ["message", "room"]
                  }
                }
              },
              required: ["items"]
            }
          },
          required: ["success", "data"]
        }
      }
    }
  },
  apis: ["./src/modules/**/*.router.ts"]
});

export function registerSwagger(app: Express): void {
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}
