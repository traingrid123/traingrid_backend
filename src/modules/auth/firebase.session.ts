import { Prisma } from "@prisma/client";
import type { DecodedIdToken } from "firebase-admin/auth";

import { prisma } from "../../lib/prisma";
import { normalizePhone } from "../../utils/phone";
import { getFirebaseAdminAuth } from "../../lib/firebaseAdmin";
import { mapClient, mapCoach } from "./auth.helpers";
import { AuthError } from "./auth.error";
import type { AuthRole } from "./auth.types";

type FirebaseProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
};

type FirebaseSessionInput = {
  idToken: string;
  role?: AuthRole;
  profile?: FirebaseProfile;
};

type FirebaseAuthContext = {
  userId: string;
  role: AuthRole;
  firebaseUid: string;
};

type FirebaseClaims = DecodedIdToken & {
  role?: string;
  localUserId?: string;
};

const clientAuthSelect = {
  id: true,
  firebaseUid: true,
  fullName: true,
  email: true,
  phone: true,
  gender: true,
  isActive: true,
  createdAt: true
} as const;

const coachAuthSelect = {
  id: true,
  firebaseUid: true,
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

type ClientRecord = NonNullable<Awaited<ReturnType<typeof findClientByIdentity>>>;
type CoachRecord = NonNullable<Awaited<ReturnType<typeof findCoachByIdentity>>>;

type LocalUserRecord =
  | { role: "client"; user: ClientRecord }
  | { role: "coach"; user: CoachRecord };

function normalizeIdentity(email?: string | null, phone?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const normalizedPhone = phone ? normalizePhone(phone) || undefined : undefined;

  return {
    email: normalizedEmail,
    phone: normalizedPhone
  };
}

function normalizeRole(role?: string | null): AuthRole | null {
  if (!role) {
    return null;
  }

  return role.trim().toLowerCase() === "coach" ? "coach" : role.trim().toLowerCase() === "client" ? "client" : null;
}

function buildDisplayName(
  profile: FirebaseProfile | undefined,
  decodedName: string | undefined,
  email: string | undefined,
  fallback: string
) {
  return (
    profile?.fullName?.trim() ||
    decodedName?.trim() ||
    email?.split("@")[0] ||
    fallback
  );
}

async function findClientByIdentity(identity: {
  firebaseUid?: string;
  email?: string;
}) {
  const conditions: Array<{ firebaseUid?: string; email?: string }> = [];
  if (identity.firebaseUid) {
    conditions.push({ firebaseUid: identity.firebaseUid });
  }
  if (identity.email) {
    conditions.push({ email: identity.email });
  }

  if (conditions.length === 0) {
    return null;
  }

  return prisma.client.findFirst({
    where: { OR: conditions },
    select: clientAuthSelect
  });
}

async function findCoachByIdentity(identity: {
  firebaseUid?: string;
  email?: string;
}) {
  const conditions: Array<{ firebaseUid?: string; email?: string }> = [];
  if (identity.firebaseUid) {
    conditions.push({ firebaseUid: identity.firebaseUid });
  }
  if (identity.email) {
    conditions.push({ email: identity.email });
  }

  if (conditions.length === 0) {
    return null;
  }

  return prisma.coach.findFirst({
    where: { OR: conditions },
    select: coachAuthSelect
  });
}

function handlePrismaUniqueError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AuthError("Account already exists", 409);
  }
}

async function updateCustomClaims(firebaseUid: string, role: AuthRole, userId: string) {
  const firebaseAuth = getFirebaseAdminAuth();
  const firebaseUser = await firebaseAuth.getUser(firebaseUid);
  await firebaseAuth.setCustomUserClaims(firebaseUid, {
    ...(firebaseUser.customClaims || {}),
    role,
    localUserId: userId
  });
}

async function upsertClient(params: {
  firebaseUid: string;
  profile?: FirebaseProfile;
  email?: string;
  phone?: string;
  decodedName?: string;
}) {
  const { email, phone } = normalizeIdentity(params.email, params.phone);
  const fullName = buildDisplayName(
    params.profile,
    params.decodedName,
    email,
    "TrainGrid Client"
  );

  const existing = await findClientByIdentity({
    firebaseUid: params.firebaseUid,
    email
  });

  if (existing) {
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        firebaseUid: params.firebaseUid,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        fullName: params.profile?.fullName?.trim() || existing.fullName,
      },
      select: clientAuthSelect
    });

    return {
      user: mapClient(client),
      role: "client" as const
    };
  }

  const client = await prisma.client.create({
    data: {
      firebaseUid: params.firebaseUid,
      fullName,
      email,
      phone,
      passwordHash: `firebase:${params.firebaseUid}`,
      gender: undefined
    },
    select: clientAuthSelect
  });

  return {
    user: mapClient(client),
    role: "client" as const
  };
}

async function upsertCoach(params: {
  firebaseUid: string;
  profile?: FirebaseProfile;
  email?: string;
  phone?: string;
  decodedName?: string;
}) {
  const { email, phone } = normalizeIdentity(params.email, params.phone);
  const fullName = buildDisplayName(
    params.profile,
    params.decodedName,
    email,
    "TrainGrid Coach"
  );

  const existing = await findCoachByIdentity({
    firebaseUid: params.firebaseUid,
    email
  });

  if (existing) {
    const coach = await prisma.coach.update({
      where: { id: existing.id },
      data: {
        firebaseUid: params.firebaseUid,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        fullName: params.profile?.fullName?.trim() || existing.fullName
      },
      select: coachAuthSelect
    });

    return {
      user: mapCoach(coach),
      role: "coach" as const
    };
  }

  const coach = await prisma.coach.create({
    data: {
      firebaseUid: params.firebaseUid,
      fullName,
      email,
      phone: phone || null,
      passwordHash: `firebase:${params.firebaseUid}`,
      tier: "PRO",
      specialisations: ["General Fitness"],
      coachingMode: "ONLINE"
    },
    select: coachAuthSelect
  });

  return {
    user: mapCoach(coach),
    role: "coach" as const
  };
}

async function upsertLocalUserByRole(
  role: AuthRole,
  params: {
    firebaseUid: string;
    email?: string;
    phone?: string;
    profile?: FirebaseProfile;
    decodedName?: string;
  }
) {
  return role === "client"
    ? upsertClient(params)
    : upsertCoach(params);
}

async function resolveLocalUser(
  firebaseUid: string,
  email?: string,
  roleHint?: AuthRole | null
): Promise<LocalUserRecord | null> {
  if (roleHint === "client") {
    const client = await findClientByIdentity({ firebaseUid, email });
    if (client) {
      return { role: "client", user: client };
    }

    const coach = await findCoachByIdentity({ firebaseUid, email });
    if (coach) {
      throw new AuthError("This Firebase account is already linked to a coach profile", 409);
    }

    return null;
  }

  if (roleHint === "coach") {
    const coach = await findCoachByIdentity({ firebaseUid, email });
    if (coach) {
      return { role: "coach", user: coach };
    }

    const client = await findClientByIdentity({ firebaseUid, email });
    if (client) {
      throw new AuthError("This Firebase account is already linked to a client profile", 409);
    }

    return null;
  }

  const [client, coach] = await Promise.all([
    findClientByIdentity({ firebaseUid, email }),
    findCoachByIdentity({ firebaseUid, email })
  ]);

  if (client && coach) {
    throw new AuthError("Account role is ambiguous for this Firebase user", 409);
  }

  if (client) {
    return { role: "client", user: client };
  }

  if (coach) {
    return { role: "coach", user: coach };
  }

  return null;
}

export async function syncFirebaseSession(input: FirebaseSessionInput) {
  const firebaseAuth = getFirebaseAdminAuth();
  const decoded = (await firebaseAuth.verifyIdToken(input.idToken)) as FirebaseClaims;
  const email = decoded.email?.trim().toLowerCase();
  const roleHint = normalizeRole(input.role || decoded.role || null);

  const existing = await resolveLocalUser(decoded.uid, email, roleHint);
  const role = roleHint || existing?.role;

  if (!role) {
    throw new AuthError("User role is required to complete Firebase sign-in", 400);
  }

  const result = await upsertLocalUserByRole(role, {
    firebaseUid: decoded.uid,
    email,
    phone: decoded.phone_number || input.profile?.phone,
    profile: input.profile,
    decodedName: decoded.name || decoded.displayName || undefined
  });

  await updateCustomClaims(decoded.uid, result.role, result.user.id);

  return {
    user: result.user,
    role: result.role
  };
}

export async function resolveFirebaseAuthContext(idToken: string): Promise<FirebaseAuthContext> {
  const firebaseAuth = getFirebaseAdminAuth();
  const decoded = (await firebaseAuth.verifyIdToken(idToken)) as FirebaseClaims;
  const email = decoded.email?.trim().toLowerCase();
  const roleFromToken = normalizeRole(decoded.role || null);
  const localUserIdFromToken = decoded.localUserId || null;

  if (roleFromToken && localUserIdFromToken) {
    return {
      userId: localUserIdFromToken,
      role: roleFromToken,
      firebaseUid: decoded.uid
    };
  }

  const localUser = await resolveLocalUser(decoded.uid, email, roleFromToken);

  if (!localUser) {
    throw new AuthError("Firebase user is not linked to a TrainGrid account", 401);
  }

  await updateCustomClaims(decoded.uid, localUser.role, localUser.user.id);

  return {
    userId: localUser.user.id,
    role: localUser.role,
    firebaseUid: decoded.uid
  };
}
