import { Router } from "express";

import { authController } from "./auth.controller";

export const authRouter = Router();

/**
 * @openapi
 * /auth/client/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a client account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AuthClientRegisterRequest"
 *     responses:
 *       201:
 *         description: Client registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthClientResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       409:
 *         description: Account already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
authRouter.post("/client/register", authController.registerClient);

/**
 * @openapi
 * /auth/client/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in a client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AuthLoginRequest"
 *     responses:
 *       200:
 *         description: Client logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthClientResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
authRouter.post("/client/login", authController.loginClient);

/**
 * @openapi
 * /auth/coach/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a coach account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AuthCoachRegisterRequest"
 *     responses:
 *       201:
 *         description: Coach registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthCoachResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       409:
 *         description: Account already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
authRouter.post("/coach/register", authController.registerCoach);

/**
 * @openapi
 * /auth/coach/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in a coach
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AuthLoginRequest"
 *     responses:
 *       200:
 *         description: Coach logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AuthCoachResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
authRouter.post("/coach/login", authController.loginCoach);
authRouter.get("/me", authController.getCurrentUser);
authRouter.post("/logout", authController.logout);
authRouter.get("/google", authController.startGoogleOAuth);
authRouter.get("/google/callback", authController.handleGoogleCallback);
