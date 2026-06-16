import { prisma } from "../../lib/prisma";
import { mapClient, mapCoach } from "./auth.helpers";
import { AuthError } from "./auth.error";
import { resolveFirebaseAuthContext } from "./firebase.session";
import type { AuthRole } from "./auth.types";

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

export const authService = {
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
  },

  async getFirebaseCurrentUser(idToken: string) {
    const context = await resolveFirebaseAuthContext(idToken);
    return authService.getCurrentUser({
      sub: context.userId,
      role: context.role
    });
  }
};
