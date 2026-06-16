import { ResourceType } from "@prisma/client";
import { z } from "zod";

export const resourcesSchema = {
  create: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    type: z.nativeEnum(ResourceType),
    fileUrl: z.string().url(),
    tags: z.array(z.string()).default([]),
    isPublic: z.boolean().default(false)
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.nativeEnum(ResourceType).optional(),
    fileUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional()
  }),

  grantAccess: z.object({
    clientIds: z.array(z.string()).min(1)
  })
};

export type CreateResourceInput = z.infer<typeof resourcesSchema.create>;
export type UpdateResourceInput = z.infer<typeof resourcesSchema.update>;
export type GrantAccessInput = z.infer<typeof resourcesSchema.grantAccess>;
