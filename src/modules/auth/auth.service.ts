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

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
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

async function hashPassword(password: string): Promise<string> {
  const salt = env.PASSWORD_SALT_ROUNDS || 10;
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

function getGoogleRedirectUri() {
  return `${env.API_BASE_URL}/auth/google/callback`;
}

function encodeGoogleState(role: AuthRole) {
  return role;
}

function decodeGoogleState(state: string | undefined): AuthRole {
  return state === "coach" ? "coach" : "client";
}

async function createOAuthPasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), env.PASSWORD_SALT_ROUNDS);
}

async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AuthError("Google OAuth is not configured on the backend", 500);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code"
    }).toString()
  });

  if (!tokenResponse.ok) {
    throw new AuthError("Google token exchange failed", 502);
  }

  const tokenBody = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenBody.access_token) {
    throw new AuthError("Google access token was not returned", 502);
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenBody.access_token}`
    }
  });

  if (!profileResponse.ok) {
    throw new AuthError("Google profile lookup failed", 502);
  }

  const profile = (await profileResponse.json()) as GoogleProfile;

  if (!profile.email || !profile.email_verified) {
    throw new AuthError("Google account must have a verified email", 400);
  }

  return profile;
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
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AuthError("Google OAuth is not configured on the backend", 500);
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: getGoogleRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: encodeGoogleState(role)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async authenticateWithGoogle(params: { code: string; state?: string }) {
    const role = decodeGoogleState(params.state);
    const profile = await exchangeGoogleCode(params.code);
    const email = profile.email.trim().toLowerCase();

    if (role === "client") {
      let client = await prisma.client.findUnique({
        where: { email }
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            email,
            fullName: profile.name,
            passwordHash: await createOAuthPasswordHash(),
            profilePhoto: profile.picture
          }
        });
      }

      if (!client.isActive) {
        throw new AuthError("Account is disabled", 403);
      }

      return {
        role,
        response: {
          user: mapClient(client),
          tokens: sessionService.createSession({
            userId: client.id,
            role: "client"
          })
        }
      };
    }

    let coach = await prisma.coach.findUnique({
      where: { email }
    });

    if (!coach) {
      coach = await prisma.coach.create({
        data: {
          email,
          fullName: profile.name,
          passwordHash: await createOAuthPasswordHash(),
          profilePhoto: profile.picture,
          tier: "ADVANCED",
          specialisations: ["General Fitness"],
          coachingMode: "HYBRID"
        }
      });
    }

    if (!coach.isActive) {
      throw new AuthError("Account is disabled", 403);
    }

    return {
      role,
      response: {
        user: mapCoach(coach),
        tokens: sessionService.createSession({
          userId: coach.id,
          role: "coach"
        })
      }
    };
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
