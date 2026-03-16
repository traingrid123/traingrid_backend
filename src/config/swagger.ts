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
    }
  },
  apis: []
});

export function registerSwagger(app: Express): void {
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
}
