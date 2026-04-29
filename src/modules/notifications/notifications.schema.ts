import { NotificationType } from "@prisma/client";
import { z } from "zod";

const roleSchema = z.enum(["coach", "client"]);
const userIdSchema = z.string().min(1, "User id is required");

const requesterSchema = z.object({
  role: roleSchema.optional(),
  userId: userIdSchema.optional()
});

const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(NotificationType).optional(),
  unreadOnly: z.coerce.boolean().optional()
});

const markReadSchema = z.object({
  notificationId: z.string().min(1, "Notification id is required")
});

const planUpdateRequestSchema = requesterSchema.extend({
  coachId: z.string().min(1).optional(),
  message: z.string().trim().min(5).max(1000),
  requestedChanges: z.array(z.string().trim().min(1).max(160)).max(10).optional()
});

export const notificationsSchema = {
  requester: requesterSchema,
  list: listNotificationsSchema,
  markRead: markReadSchema,
  planUpdateRequest: planUpdateRequestSchema
};

export type NotificationRequesterInput = z.infer<typeof requesterSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type PlanUpdateRequestInput = z.infer<typeof planUpdateRequestSchema>;
