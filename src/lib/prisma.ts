import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __traingridPrisma__: PrismaClient | undefined;
}

const prismaClient = global.__traingridPrisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__traingridPrisma__ = prismaClient;
}

export const prisma = prismaClient;
