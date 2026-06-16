import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { registerChatSocket } from "./modules/chat/chat.socket";

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
        .includes("*")
        ? true
        : env.CORS_ORIGIN.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      credentials: true
    }
  });

  registerChatSocket(io);

  server.listen(env.PORT, () => {
    logger.info(`TrainGrid backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
