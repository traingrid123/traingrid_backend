import { Router } from "express";

import { chatController } from "./chat.controller";

export const chatRouter = Router();

/**
 * @openapi
 * /chat/rooms/direct:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Create or fetch a direct chat room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChatDirectRoomRequest"
 *     responses:
 *       200:
 *         description: Direct chat room returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatRoomResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Not allowed to create this room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Coach or client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.post("/rooms/direct", chatController.createDirectRoom);

/**
 * @openapi
 * /chat/rooms:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List the authenticated user's chat rooms
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Page size
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter rooms by room or counterpart name
 *     responses:
 *       200:
 *         description: Rooms returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatRoomsResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.get("/rooms", chatController.listRooms);

/**
 * @openapi
 * /chat/rooms/{roomId}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get a chat room by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat room id
 *     responses:
 *       200:
 *         description: Room returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatRoomResponse"
 *       400:
 *         description: Missing room id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: User is not a member of the room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.get("/rooms/:roomId", chatController.getRoom);

/**
 * @openapi
 * /chat/rooms/{roomId}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List messages in a chat room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat room id
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Return messages sent before this timestamp
 *     responses:
 *       200:
 *         description: Messages returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatMessagesResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: User is not a member of the room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.get("/rooms/:roomId/messages", chatController.listMessages);

/**
 * @openapi
 * /chat/rooms/{roomId}/messages:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message in a chat room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat room id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChatSendMessageRequest"
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatSendMessageResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: User is not a member of the room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.post("/rooms/:roomId/messages", chatController.sendMessage);

/**
 * @openapi
 * /chat/rooms/{roomId}/read:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Mark all messages in a room as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat room id
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChatMarkReadRequest"
 *     responses:
 *       200:
 *         description: Room marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatReadResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: User is not a member of the room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.post("/rooms/:roomId/read", chatController.markRead);

/**
 * @openapi
 * /chat/messages/search:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Search messages accessible to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Search text
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *         description: Limit search to a single room
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatSearchResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: User is not a member of the specified room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
chatRouter.get("/messages/search", chatController.searchMessages);
