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
      },
      {
        name: "Chat Realtime",
        description: "Socket.IO realtime chat events and authentication contract"
      },
      {
        name: "Clients",
        description: "Client profile and dashboard operations"
      },
      {
        name: "Coaches",
        description: "Coach discovery, profile, and client management"
      },
      {
        name: "Notifications",
        description: "Coach and client notification operations"
      },
      {
        name: "Workouts",
        description: "Workout plan authoring, assignment, execution, and analytics"
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
        },
        ChatSocketAuth: {
          type: "object",
          description:
            "Socket.IO handshake auth. Prefer JWT token. Legacy userId/role is supported for backward compatibility.",
          properties: {
            token: { type: "string", description: "JWT access token (recommended)" },
            accessToken: {
              type: "string",
              description: "Alias of token; JWT access token"
            },
            userId: {
              type: "string",
              description: "Legacy fallback (not recommended)"
            },
            role: {
              $ref: "#/components/schemas/ChatRole"
            }
          }
        },
        ChatSocketAck: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", nullable: true },
            message: { type: "string", nullable: true }
          },
          required: ["success"]
        },
        WorkoutLevel: {
          type: "string",
          enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
        },
        WorkoutWeekDay: {
          type: "string",
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY"
          ]
        },
        WorkoutDayExerciseInput: {
          type: "object",
          properties: {
            exerciseId: { type: "string" },
            sets: { type: "integer", minimum: 1 },
            reps: { type: "string" },
            restSeconds: { type: "integer", minimum: 0 },
            durationSecs: { type: "integer", minimum: 0 },
            tempo: { type: "string" },
            notes: { type: "string" },
            orderIndex: { type: "integer", minimum: 1 }
          },
          required: ["exerciseId", "orderIndex"]
        },
        WorkoutDayInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            weekNumber: { type: "integer", minimum: 1 },
            dayOfWeek: { $ref: "#/components/schemas/WorkoutWeekDay" },
            orderIndex: { type: "integer", minimum: 1 },
            isRestDay: { type: "boolean" },
            notes: { type: "string" },
            exercises: {
              type: "array",
              items: { $ref: "#/components/schemas/WorkoutDayExerciseInput" }
            }
          },
          required: ["weekNumber", "orderIndex", "isRestDay", "exercises"]
        },
        WorkoutPlanCreateRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            level: { $ref: "#/components/schemas/WorkoutLevel" },
            durationWeeks: { type: "integer", minimum: 1 },
            isTemplate: { type: "boolean" },
            isDraft: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
            days: {
              type: "array",
              items: { $ref: "#/components/schemas/WorkoutDayInput" }
            }
          },
          required: ["title", "level", "days"]
        },
        WorkoutPlanUpdateRequest: {
          type: "object",
          properties: {
            expectedVersion: { type: "integer", minimum: 1 },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            level: { $ref: "#/components/schemas/WorkoutLevel" },
            durationWeeks: { type: "integer", nullable: true },
            isTemplate: { type: "boolean" },
            isDraft: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
            days: {
              type: "array",
              items: { $ref: "#/components/schemas/WorkoutDayInput" }
            }
          },
          required: ["expectedVersion"]
        },
        WorkoutPlanDuplicateRequest: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["WEEKLY", "MONTHLY"],
              default: "WEEKLY"
            },
            title: { type: "string" },
            isDraft: { type: "boolean" }
          }
        },
        WorkoutPlanAssignmentRequest: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            workoutPlanId: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" }
          },
          required: ["clientId", "workoutPlanId"]
        },
        WorkoutExerciseLogInput: {
          type: "object",
          properties: {
            exerciseId: { type: "string" },
            exerciseName: { type: "string" },
            sets: { type: "object", nullable: true },
            notes: { type: "string" }
          },
          required: ["exerciseName"]
        },
        WorkoutCompleteRequest: {
          type: "object",
          properties: {
            loggedAt: { type: "string", format: "date-time" },
            sourceEventId: { type: "string" },
            durationMinutes: { type: "integer", minimum: 1 },
            perceivedEffort: { type: "integer", minimum: 1, maximum: 10 },
            notes: { type: "string" },
            exerciseLogs: {
              type: "array",
              items: { $ref: "#/components/schemas/WorkoutExerciseLogInput" }
            }
          }
        },
        WorkoutPlanResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
          },
          required: ["success", "data"]
        },
        WorkoutPlansResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { type: "object" } },
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" }
              },
              required: ["items", "page", "limit", "total"]
            }
          },
          required: ["success", "data"]
        },
        WorkoutAssignmentResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
          },
          required: ["success", "data"]
        },
        WorkoutTodayResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
          },
          required: ["success", "data"]
        },
        WorkoutDetailResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
          },
          required: ["success", "data"]
        },
        WorkoutCompleteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
          },
          required: ["success", "data"]
        },
        WorkoutAnalyticsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" }
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
