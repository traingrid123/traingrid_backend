import { MessageType } from "@prisma/client";
import { z } from "zod";

const roleSchema = z.enum(["coach", "client"]);
const userIdSchema = z.string().min(1, "User id is required");

const requesterSchema = z.object({
  role: roleSchema.optional(),
  userId: userIdSchema.optional()
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

const directRoomSchema = z.object({
  coachId: z.string().min(1),
  clientId: z.string().min(1),
  role: roleSchema.optional(),
  userId: userIdSchema.optional()
});

const sendMessageSchema = requesterSchema
  .extend({
    type: z.nativeEnum(MessageType).default(MessageType.TEXT),
    content: z.string().trim().min(1).max(5000).optional(),
    fileUrl: z.string().url().max(2000).optional(),
    fileName: z.string().trim().max(255).optional(),
    fileMimeType: z.string().trim().max(255).optional()
  })
  .superRefine((value, ctx) => {
    if (value.type === MessageType.TEXT || value.type === MessageType.SYSTEM) {
      if (!value.content) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Message content is required",
          path: ["content"]
        });
      }
      return;
    }

    if (!value.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File URL is required",
        path: ["fileUrl"]
      });
    }
  });

const listRoomsSchema = requesterSchema
  .merge(paginationSchema)
  .extend({
    search: z.string().trim().min(1).optional()
  });

const listMessagesSchema = requesterSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.date().optional()
});

const markReadSchema = requesterSchema.extend({
  readAt: z.coerce.date().optional()
});

const searchMessagesSchema = requesterSchema.extend({
  query: z.string().trim().min(1).max(200),
  roomId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const chatSchema = {
  requester: requesterSchema,
  pagination: paginationSchema,
  directRoom: directRoomSchema,
  sendMessage: sendMessageSchema,
  listRooms: listRoomsSchema,
  listMessages: listMessagesSchema,
  markRead: markReadSchema,
  searchMessages: searchMessagesSchema
};

export type ChatRole = z.infer<typeof roleSchema>;
export type ChatRequesterInput = z.infer<typeof requesterSchema>;
export type CreateDirectRoomInput = z.infer<typeof directRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListRoomsInput = z.infer<typeof listRoomsSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
