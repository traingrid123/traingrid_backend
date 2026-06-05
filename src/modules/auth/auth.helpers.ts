import type { AuthRole } from "./token.service";

type ClientAuthView = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  isActive: boolean;
  createdAt: Date;
};

type CoachAuthView = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  tier: "ADVANCED" | "PRO" | "ELITE";
  specialisations: string[];
  coachingMode: "ONLINE" | "HYBRID" | "IN_PERSON" | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
};

export function mapClient(client: ClientAuthView) {
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

export function mapCoach(coach: CoachAuthView) {
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
