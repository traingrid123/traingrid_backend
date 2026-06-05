import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { corsMiddleware } from "./config/cors";
import { appRateLimit } from "./config/rateLimit";
import { registerSwagger } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { authRouter } from "./modules/auth/auth.router";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(appRateLimit);
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerMiddleware);

  registerSwagger(app);
  app.use("/auth", authRouter);
  app.use(routes);
  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
