import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { normalizePhone } from "../../utils/phone";
import { mapClient, mapCoach } from "./auth.helpers";
import {
  CoachLoginInput,
  CoachRegisterInput,
  ClientLoginInput,
  ClientRegisterInput
} from "./auth.schema";
import { sessionService } from "./session.service";
import { AuthRole } from "./token.service";

const clientAuthSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  gender: true,
  isActive: true,
  createdAt: true
} as const;

const coachAuthSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  tier: true,
  specialisations: true,
  coachingMode: true,
  isVerified: true,
  isActive: true,
  createdAt: true
} as const;

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

type AuthResponse<TUser> = {
  user: TUser;
  tokens: ReturnType<typeof sessionService.createSession>;
};

function normalizeIdentity(email?: string, phone?: string) {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone ? normalizePhone(phone) : undefined;

  const emailValue = normalizedEmail?.length ? normalizedEmail : undefined;
  const phoneValue = normalizedPhone?.length ? normalizedPhone : undefined;

  return { email: emailValue, phone: phoneValue };
}

function handlePrismaUniqueError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AuthError("Account already exists", 409);
  }
}

async function ensureClientNotExists(email?: string, phone?: string) {
  const conditions = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  if (conditions.length === 0) return;

  const existing = await prisma.client.findFirst({
    where: { OR: conditions }
  });

  if (existing) {
    throw new AuthError("Account already exists", 409);
  }
}

async function ensureCoachNotExists(email?: string, phone?: string) {
  const conditions = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  if (conditions.length === 0) return;

  const existing = await prisma.coach.findFirst({
    where: { OR: conditions }
  });

  if (existing) {
    throw new AuthError("Account already exists", 409);
  }
}

// Simple password hashing (for dev mode)
async function hashPassword(password: string): Promise<string> {
  const salt = env.PASSWORD_SALT_ROUNDS || 10;
  return bcrypt.hash(password, salt);
}

// Simple password verification
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export const authService = {
  async registerClient(input: ClientRegisterInput): Promise<AuthResponse<ReturnType<typeof mapClient>>> {
    const { email, phone } = normalizeIdentity(input.email, input.phone);

    await ensureClientNotExists(email, phone);

    try {
      const passwordHash = await hashPassword(input.password);

      const client = await prisma.client.create({
        data: {
          fullName: input.fullName,
          email,
          phone,
          passwordHash,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth
        },
        select: clientAuthSelect
      });

      const tokens = sessionService.createSession({
        userId: client.id,
        role: "client"
      });

      return {
        user: mapClient(client),
        tokens
      };
    } catch (error) {
      handlePrismaUniqueError(error);
      throw error;
    }
  },

  async loginClient(input: ClientLoginInput): Promise<AuthResponse<ReturnType<typeof mapClient>>> {
    const { email, phone } = normalizeIdentity(input.email, input.phone);

    const clientLookup: Array<{ email?: string; phone?: string }> = [];
    if (email) clientLookup.push({ email });
    if (phone) clientLookup.push({ phone });

    const client = await prisma.client.findFirst({
      where: { OR: clientLookup },
      select: {
        ...clientAuthSelect,
        passwordHash: true
      }
    });

    if (!client || !client.passwordHash) {
      // Dev mode: Create account on the fly if it doesn't exist
      console.warn('Client not found, creating in dev mode...');
      return authService.registerClient({
        fullName: email?.split('@')[0] || phone || 'New Client',
        email,
        phone,
        password: input.password,
        gender: undefined,
        dateOfBirth: undefined
      });
    }

    if (!client.isActive) {
      throw new AuthError("Account is disabled", 403);
    }

    const isValid = await verifyPassword(input.password, client.passwordHash);

    if (!isValid) {
      throw new AuthError("Invalid credentials", 401);
    }

    const tokens = sessionService.createSession({
      userId: client.id,
      role: "client"
    });

    return {
      user: mapClient(client),
      tokens
    };
  },

  async registerCoach(input: CoachRegisterInput): Promise<AuthResponse<ReturnType<typeof mapCoach>>> {
    const { email, phone } = normalizeIdentity(input.email, input.phone);

    await ensureCoachNotExists(email, phone);

    try {
      const passwordHash = await hashPassword(input.password);

      const coach = await prisma.coach.create({
        data: {
          fullName: input.fullName,
          email,
          phone: phone || null,
          passwordHash,
          tier: input.tier || 'PRO',
          specialisations: input.specialisations || ['General Fitness'],
          coachingMode: input.coachingMode || 'ONLINE'
        },
        select: coachAuthSelect
      });

      const tokens = sessionService.createSession({
        userId: coach.id,
        role: "coach"
      });

      return {
        user: mapCoach(coach),
        tokens
      };
    } catch (error) {
      handlePrismaUniqueError(error);
      throw error;
    }
  },

  async loginCoach(input: CoachLoginInput): Promise<AuthResponse<ReturnType<typeof mapCoach>>> {
    const { email, phone } = normalizeIdentity(input.email, input.phone);

    const coachLookup: Array<{ email?: string; phone?: string }> = [];
    if (email) coachLookup.push({ email });
    if (phone) coachLookup.push({ phone });

    const coach = await prisma.coach.findFirst({
      where: { OR: coachLookup },
      select: {
        ...coachAuthSelect,
        passwordHash: true
      }
    });

    if (!coach || !coach.passwordHash) {
      // Dev mode: Create account on the fly if it doesn't exist
      console.warn('Coach not found, creating in dev mode...');
      return authService.registerCoach({
        fullName: email?.split('@')[0] || phone || 'New Coach',
        email,
        phone,
        password: input.password,
        tier: 'PRO',
        specialisations: ['General Fitness'],
        coachingMode: 'ONLINE'
      });
    }

    if (!coach.isActive) {
      throw new AuthError("Account is disabled", 403);
    }

    const isValid = await verifyPassword(input.password, coach.passwordHash);

    if (!isValid) {
      throw new AuthError("Invalid credentials", 401);
    }

    const tokens = sessionService.createSession({
      userId: coach.id,
      role: "coach"
    });

    return {
      user: mapCoach(coach),
      tokens
    };
  },

  getGoogleAuthorizationUrl(role: AuthRole) {
    // Not implemented in MVP
    return "#";
  },

  async authenticateWithGoogle(params: { code: string; state?: string }) {
    throw new AuthError("Google OAuth not implemented in MVP", 501);
  },

  async changePassword(userId: string, role: AuthRole, currentPassword: string, newPassword: string) {
    const saltRounds = env.PASSWORD_SALT_ROUNDS;

    if (role === "client") {
      const client = await prisma.client.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
      if (!client) {
        throw new AuthError("User not found", 404);
      }
      const valid = client.passwordHash ? await bcrypt.compare(currentPassword, client.passwordHash) : false;
      if (!valid) {
        throw new AuthError("Current password is incorrect", 401);
      }
      const hash = await bcrypt.hash(newPassword, saltRounds);
      await prisma.client.update({ where: { id: userId }, data: { passwordHash: hash } });
      return;
    }

    const coach = await prisma.coach.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
    if (!coach) {
      throw new AuthError("User not found", 404);
    }
    const valid = coach.passwordHash ? await bcrypt.compare(currentPassword, coach.passwordHash) : false;
    if (!valid) {
      throw new AuthError("Current password is incorrect", 401);
    }
    const hash = await bcrypt.hash(newPassword, saltRounds);
    await prisma.coach.update({ where: { id: userId }, data: { passwordHash: hash } });
  },

  async getCurrentUser(payload: { sub: string; role: AuthRole }) {
    if (payload.role === "client") {
      const client = await prisma.client.findUnique({
        where: { id: payload.sub },
        select: clientAuthSelect
      });

      if (!client) {
        throw new AuthError("User not found", 404);
      }

      return mapClient(client);
    }

    const coach = await prisma.coach.findUnique({
      where: { id: payload.sub },
      select: coachAuthSelect
    });

    if (!coach) {
      throw new AuthError("User not found", 404);
    }

    return mapCoach(coach);
  }
};