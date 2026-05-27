import { Coach, Client } from "@prisma/client";

import type { AuthRole } from "./token.service";

export function mapClient(client: Client) {
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

export function mapCoach(coach: Coach) {
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
