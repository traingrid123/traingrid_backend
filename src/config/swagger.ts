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
      }
    ],
    components: {
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
