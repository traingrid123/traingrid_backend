import bcrypt from "bcryptjs";
import { Coach, Client, Prisma } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { normalizePhone } from "../../utils/phone";
import {
  CoachLoginInput,
  CoachRegisterInput,
  ClientLoginInput,
  ClientRegisterInput
} from "./auth.schema";
import { sessionService } from "./session.service";
import { AuthRole } from "./token.service";

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

  if (!emailValue && !phoneValue) {
    throw new AuthError("Email or phone is required", 400);
  }

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

function mapClient(client: Client) {
  return {
    id: client.id,
    role: "client" as AuthRole,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    gender: client.gender,
    isActive: client.isActive,
    createdAt: client.createdAt
  };
}

function mapCoach(coach: Coach) {
  return {
    id: coach.id,
    role: "coach" as AuthRole,
    fullName: coach.fullName,
    email: coach.email,
    phone: coach.phone,
    tier: coach.tier,
    specialisations: coach.specialisations,
    coachingMode: coach.coachingMode,
    isVerified: coach.isVerified,
    isActive: coach.isActive,
    createdAt: coach.createdAt
  };
}

async function ensureClientNotExists(email?: string, phone?: string) {
  const conditions = [];

  if (email) {
    conditions.push({ email });
  }

  if (phone) {
    conditions.push({ phone });
  }

  if (conditions.length === 0) {
    return;
  }

  const existing = await prisma.client.findFirst({
    where: {
      OR: conditions
    }
  });

  if (existing) {
    throw new AuthError("Account already exists", 409);
  }
}

async function ensureCoachNotExists(email?: string, phone?: string) {
  const conditions = [];

  if (email) {
    conditions.push({ email });
  }

  if (phone) {
    conditions.push({ phone });
  }

  if (conditions.length === 0) {
    return;
  }

  const existing = await prisma.coach.findFirst({
    where: {
      OR: conditions
    }
  });

  if (existing) {
    throw new AuthError("Account already exists", 409);
  }
}

export const authService = {
  async registerClient(input: ClientRegisterInput): Promise<AuthResponse<ReturnType<typeof mapClient>>> {
    const { email, phone } = normalizeIdentity(input.email, input.phone);

    await ensureClientNotExists(email, phone);

    try {
      const passwordHash = await bcrypt.hash(
        input.password,
        env.PASSWORD_SALT_ROUNDS
      );

      const client = await prisma.client.create({
        data: {
          fullName: input.fullName,
          email,
          phone,
          passwordHash,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth
        }
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
    if (email) {
      clientLookup.push({ email });
    }
    if (phone) {
      clientLookup.push({ phone });
    }

    const client = await prisma.client.findFirst({
      where: {
        OR: clientLookup
      }
    });

    if (!client || !client.passwordHash) {
      throw new AuthError("Invalid credentials", 401);
    }

    if (!client.isActive) {
      throw new AuthError("Account is disabled", 403);
    }

    const isValid = await bcrypt.compare(input.password, client.passwordHash);

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
      const passwordHash = await bcrypt.hash(
        input.password,
        env.PASSWORD_SALT_ROUNDS
      );

      const coach = await prisma.coach.create({
        data: {
          fullName: input.fullName,
          email,
          phone,
          passwordHash,
          tier: input.tier,
          specialisations: input.specialisations,
          coachingMode: input.coachingMode
        }
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
    if (email) {
      coachLookup.push({ email });
    }
    if (phone) {
      coachLookup.push({ phone });
    }

    const coach = await prisma.coach.findFirst({
      where: {
        OR: coachLookup
      }
    });

    if (!coach || !coach.passwordHash) {
      throw new AuthError("Invalid credentials", 401);
    }

    if (!coach.isActive) {
      throw new AuthError("Account is disabled", 403);
    }

    const isValid = await bcrypt.compare(input.password, coach.passwordHash);

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
  }
};
