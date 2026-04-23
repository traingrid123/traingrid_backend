import {
  ClientStatus,
  NotificationType,
  Prisma
} from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import { createSlug } from "../../utils/slug";
import {
  AddCoachClientInput,
  DiscoverCoachesInput,
  ListCoachClientsInput,
  UpdateCoachProfileInput
} from "./coaches.schema";
import { coachProfileArgs, coachesRepository } from "./coaches.repository";

export class CoachError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CoachError";
  }
}

type CoachRequester = {
  role: "coach" | "client";
  userId: string;
};

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function average(numbers: number[]) {
  if (!numbers.length) {
    return 0;
  }

  return Number(
    (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2)
  );
}

function ratio(completed: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((completed / total) * 100).toFixed(2));
}

function computeCurrentStreak(dates: Date[]) {
  if (!dates.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(dates.map((value) => dayjs(value).format("YYYY-MM-DD")))
  ).sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());

  let streak = 0;
  let cursor = dayjs();

  for (const entry of uniqueDays) {
    const diff = cursor.startOf("day").diff(dayjs(entry).startOf("day"), "day");

    if (diff === 0 || (streak === 0 && diff === 1)) {
      streak += 1;
      cursor = dayjs(entry);
      continue;
    }

    if (diff === 1) {
      streak += 1;
      cursor = dayjs(entry);
      continue;
    }

    break;
  }

  return streak;
}

function computeLongestStreak(dates: Date[]) {
  if (!dates.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(dates.map((value) => dayjs(value).format("YYYY-MM-DD")))
  ).sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = dayjs(uniqueDays[index - 1]);
    const currentDay = dayjs(uniqueDays[index]);

    if (currentDay.diff(previous, "day") === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function computeClientCompliance(relationship: {
  client: {
    workoutLogs?: Array<{ isCompleted: boolean; loggedAt: Date; workoutDay?: { title: string | null } | null }>;
    nutritionLogs?: Array<{ isCompleted: boolean; loggedAt: Date }>;
    habitLogs?: Array<{ isCompleted: boolean; loggedAt: Date }>;
    updatedAt?: Date;
  };
}) {
  const workoutLogs = relationship.client.workoutLogs ?? [];
  const nutritionLogs = relationship.client.nutritionLogs ?? [];
  const habitLogs = relationship.client.habitLogs ?? [];

  const workoutCompletion = ratio(
    workoutLogs.filter((entry) => entry.isCompleted).length,
    workoutLogs.length
  );
  const nutritionCompletion = ratio(
    nutritionLogs.filter((entry) => entry.isCompleted).length,
    nutritionLogs.length
  );
  const habitCompletion = ratio(
    habitLogs.filter((entry) => entry.isCompleted).length,
    habitLogs.length
  );

  const overallCompliance = average([
    workoutCompletion,
    nutritionCompletion,
    habitCompletion
  ]);

  const completedWorkoutDates = workoutLogs
    .filter((entry) => entry.isCompleted)
    .map((entry) => entry.loggedAt);

  const lastActivityCandidates = [
    ...workoutLogs.map((entry) => entry.loggedAt),
    ...nutritionLogs.map((entry) => entry.loggedAt),
    ...habitLogs.map((entry) => entry.loggedAt),
    ...(relationship.client.updatedAt ? [relationship.client.updatedAt] : [])
  ].sort((a, b) => b.getTime() - a.getTime());

  const skippedTypes = new Map<string, number>();
  workoutLogs
    .filter((entry) => !entry.isCompleted)
    .forEach((entry) => {
      const label = entry.workoutDay?.title?.trim() || "General workout";
      skippedTypes.set(label, (skippedTypes.get(label) ?? 0) + 1);
    });

  const mostSkippedWorkoutType =
    Array.from(skippedTypes.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    overallCompliance,
    workoutCompletion,
    nutritionCompletion,
    habitCompletion,
    workoutAssigned: workoutLogs.length,
    workoutCompleted: workoutLogs.filter((entry) => entry.isCompleted).length,
    missedWorkouts: workoutLogs.filter((entry) => !entry.isCompleted).length,
    currentStreak: computeCurrentStreak(completedWorkoutDates),
    longestStreak: computeLongestStreak(completedWorkoutDates),
    lastWorkoutDate: workoutLogs[0]?.loggedAt ?? null,
    lastActiveDate: lastActivityCandidates[0] ?? null,
    mostSkippedWorkoutType
  };
}

function calculateAverageRating(coach: {
  marketingProfile?: {
    testimonials?: Array<{ rating: number | null }>;
  } | null;
}) {
  const ratings =
    coach.marketingProfile?.testimonials
      ?.map((item) => item.rating)
      .filter((value): value is number => typeof value === "number") ?? [];

  return ratings.length ? average(ratings) : null;
}

function mapCoachCard(coach: {
  id: string;
  fullName: string;
  profilePhoto: string | null;
  specialisations: string[];
  isVerified: boolean;
  peopleTrainedCount: number;
  yearsExperience: number | null;
  coachingMode: any;
  tier: any;
  city: string | null;
  country: string | null;
  profileSlug: string | null;
  marketingProfile?: {
    testimonials?: Array<{ rating: number | null }>;
  } | null;
}) {
  return {
    id: coach.id,
    name: coach.fullName,
    profilePhoto: coach.profilePhoto,
    rating: calculateAverageRating(coach),
    certificationBadge: coach.isVerified,
    specialisations: coach.specialisations,
    peopleTrained: coach.peopleTrainedCount,
    yearsExperience: coach.yearsExperience,
    coachingMode: coach.coachingMode,
    tier: coach.tier,
    location: [coach.city, coach.country].filter(Boolean).join(", ") || null,
    profileSlug: coach.profileSlug,
    publicProfileUrl: coach.profileSlug
      ? `https://traingrid.in/${coach.profileSlug}`
      : null
  };
}

function mapCoachProfile(coach: CoachProfileRecord | null) {
  if (!coach) {
    return null;
  }

  return {
    id: coach.id,
    email: coach.email,
    phone: coach.phone,
    fullName: coach.fullName,
    gender: coach.gender,
    profilePhoto: coach.profilePhoto,
    city: coach.city,
    country: coach.country,
    yearsExperience: coach.yearsExperience,
    specialisations: coach.specialisations,
    monthlyFee: toNumber(coach.monthlyFee),
    coachingMode: coach.coachingMode,
    bio: coach.bio,
    instagramUrl: coach.instagramUrl,
    websiteUrl: coach.websiteUrl,
    tier: coach.tier,
    isVerified: coach.isVerified,
    isActive: coach.isActive,
    peopleTrainedCount: coach.peopleTrainedCount,
    profileSlug: coach.profileSlug,
    certifications: coach.certifications.map((item) => ({
      id: item.id,
      name: item.name,
      issuingBody: item.issuingBody,
      fileUrl: item.fileUrl,
      isVerified: item.isVerified,
      verifiedAt: item.verifiedAt,
      expiresAt: item.expiresAt
    })),
    marketingProfile: coach.marketingProfile
      ? {
          id: coach.marketingProfile.id,
          headline: coach.marketingProfile.headline,
          philosophy: coach.marketingProfile.philosophy,
          ctaBookCall: coach.marketingProfile.ctaBookCall,
          ctaAskQuestion: coach.marketingProfile.ctaAskQuestion,
          ctaBuyProgram: coach.marketingProfile.ctaBuyProgram,
          profileViews: coach.marketingProfile.profileViews,
          isPublished: coach.marketingProfile.isPublished,
          pricingTiers: coach.marketingProfile.pricingTiers.map((tier) => ({
            id: tier.id,
            name: tier.name,
            price: toNumber(tier.price),
            currency: tier.currency,
            billingCycle: tier.billingCycle,
            features: tier.features,
            isPopular: tier.isPopular
          })),
          testimonials: coach.marketingProfile.testimonials.map((testimonial) => ({
            id: testimonial.id,
            clientName: testimonial.clientName,
            clientPhoto: testimonial.clientPhoto,
            content: testimonial.content,
            rating: testimonial.rating,
            beforePhotoUrl: testimonial.beforePhotoUrl,
            afterPhotoUrl: testimonial.afterPhotoUrl
          }))
        }
      : null,
    analytics: coach.analytics
      ? {
          totalClients: coach.analytics.totalClients,
          activeClients: coach.analytics.activeClients,
          weeklyActiveClients: coach.analytics.weeklyActiveClients,
          avgComplianceRate: toNumber(coach.analytics.avgComplianceRate),
          totalRevenue: toNumber(coach.analytics.totalRevenue),
          monthlyRevenue: toNumber(coach.analytics.monthlyRevenue),
          profileViews: coach.analytics.profileViews,
          totalLeads: coach.analytics.totalLeads,
          conversionRate: toNumber(coach.analytics.conversionRate),
          planCompletionRate: toNumber(coach.analytics.planCompletionRate),
          lastUpdatedAt: coach.analytics.lastUpdatedAt
        }
      : null,
    discoveryCard: mapCoachCard(coach)
  };
}

async function ensureCoachAccess(coachId: string, requester?: CoachRequester) {
  if (!requester) {
    return;
  }

  if (requester.role !== "coach" || requester.userId !== coachId) {
    throw new CoachError("You are not allowed to access this coach resource", 403);
  }
}

async function ensureRelationship(coachId: string, clientId: string) {
  const relationship = await coachesRepository.findRelationship(coachId, clientId);

  if (!relationship) {
    throw new CoachError("Client relationship not found", 404);
  }

  return relationship;
}

export const coachesService = {
  async discover(params: DiscoverCoachesInput) {
    const [items, total] = await Promise.all([
      coachesRepository.discover(params),
      coachesRepository.countDiscover(params)
    ]);

    return {
      items: items.map(mapCoachCard),
      page: params.page,
      limit: params.limit,
      total
    };
  },

  async getProfile(coachId: string) {
    const coach = await coachesRepository.findById(coachId);

    if (!coach) {
      throw new CoachError("Coach not found", 404);
    }

    return mapCoachProfile(coach);
  },

  async updateProfile(
    coachId: string,
    input: UpdateCoachProfileInput,
    requester?: CoachRequester
  ) {
    await ensureCoachAccess(coachId, requester);

    const existing = await coachesRepository.findById(coachId);

    if (!existing) {
      throw new CoachError("Coach not found", 404);
    }

    const profileSlug =
      input.fullName && input.fullName !== existing.fullName
        ? createSlug(input.fullName)
        : existing.profileSlug ?? createSlug(existing.fullName);

    const coach = await prisma.$transaction(async (tx) => {
      const updated = await tx.coach.update({
        where: {
          id: coachId
        },
        data: {
          fullName: input.fullName,
          gender: input.gender === null ? null : input.gender,
          profilePhoto: input.profilePhoto === null ? null : input.profilePhoto,
          city: input.city === null ? null : input.city,
          country: input.country === null ? null : input.country,
          yearsExperience:
            input.yearsExperience === null ? null : input.yearsExperience,
          specialisations: input.specialisations,
          monthlyFee:
            input.monthlyFee === null || input.monthlyFee === undefined
              ? input.monthlyFee === null
                ? null
                : undefined
              : input.monthlyFee,
          coachingMode:
            input.coachingMode === null ? null : input.coachingMode,
          bio: input.bio === null ? null : input.bio,
          instagramUrl:
            input.instagramUrl === null ? null : input.instagramUrl,
          websiteUrl: input.websiteUrl === null ? null : input.websiteUrl,
          tier: input.tier,
          isVerified: input.isVerified,
          isActive: input.isActive,
          peopleTrainedCount: input.peopleTrainedCount,
          profileSlug
        },
        include: {
          certifications: true,
          marketingProfile: {
            include: {
              pricingTiers: true,
              testimonials: {
                where: {
                  isApproved: true
                },
                take: 6
              }
            }
          },
          analytics: true
        }
      });

      if (input.certifications) {
        await tx.certification.deleteMany({
          where: {
            coachId
          }
        });

        if (input.certifications.length > 0) {
          await tx.certification.createMany({
            data: input.certifications.map((item) => ({
              coachId,
              name: item.name,
              issuingBody: item.issuingBody ?? null,
              fileUrl: item.fileUrl ?? null,
              isVerified: item.isVerified ?? false,
              expiresAt: item.expiresAt ?? null
            }))
          });
        }
      }

      if (input.marketingProfile) {
        const marketingProfile = await tx.marketingProfile.upsert({
          where: {
            coachId
          },
          update: {
            headline:
              input.marketingProfile.headline === null
                ? null
                : input.marketingProfile.headline,
            philosophy:
              input.marketingProfile.philosophy === null
                ? null
                : input.marketingProfile.philosophy,
            ctaBookCall: input.marketingProfile.ctaBookCall,
            ctaAskQuestion: input.marketingProfile.ctaAskQuestion,
            ctaBuyProgram: input.marketingProfile.ctaBuyProgram,
            isPublished: input.marketingProfile.isPublished
          },
          create: {
            coachId,
            headline: input.marketingProfile.headline ?? null,
            philosophy: input.marketingProfile.philosophy ?? null,
            ctaBookCall: input.marketingProfile.ctaBookCall ?? false,
            ctaAskQuestion: input.marketingProfile.ctaAskQuestion ?? false,
            ctaBuyProgram: input.marketingProfile.ctaBuyProgram ?? false,
            isPublished: input.marketingProfile.isPublished ?? false
          }
        });

        if (input.marketingProfile.pricingTiers) {
          await tx.pricingTier.deleteMany({
            where: {
              marketingProfileId: marketingProfile.id
            }
          });

          if (input.marketingProfile.pricingTiers.length > 0) {
            await tx.pricingTier.createMany({
              data: input.marketingProfile.pricingTiers.map((tier) => ({
                marketingProfileId: marketingProfile.id,
                name: tier.name,
                price: tier.price,
                currency: tier.currency,
                billingCycle: tier.billingCycle,
                features: tier.features,
                isPopular: tier.isPopular ?? false,
                isActive: tier.isActive ?? true
              }))
            });
          }
        }
      }

      return updated;
    });

    const refreshed = await coachesRepository.findById(coach.id);

    if (!refreshed) {
      throw new CoachError("Coach not found after update", 404);
    }

    return mapCoachProfile(refreshed);
  },

  async getDiscoveryCard(coachId: string) {
    const coach = await coachesRepository.findById(coachId);

    if (!coach) {
      throw new CoachError("Coach not found", 404);
    }

    return mapCoachCard(coach);
  },

  async getDashboard(coachId: string, requester?: CoachRequester) {
    await ensureCoachAccess(coachId, requester);

    const coach = await coachesRepository.findById(coachId);

    if (!coach) {
      throw new CoachError("Coach not found", 404);
    }

    const [recentRelationships, notifications, upcomingPayments] =
      await Promise.all([
        coachesRepository.listRecentRelationships(coachId, 8),
        coachesRepository.listNotifications(coachId, 10),
        coachesRepository.listPendingPayments(coachId, 10)
      ]);

    const complianceRates = await Promise.all(
      recentRelationships.map(async (relationship) => {
        const detail = await coachesRepository.findRelationship(
          coachId,
          relationship.clientId
        );

        if (!detail) {
          return 0;
        }

        return computeClientCompliance(detail).overallCompliance;
      })
    );

    const summaryCards = {
      totalClients:
        coach.analytics?.totalClients ??
        (await prisma.coachClientRelationship.count({
          where: { coachId }
        })),
      activeClients:
        coach.analytics?.activeClients ??
        (await prisma.coachClientRelationship.count({
          where: { coachId, status: ClientStatus.ACTIVE }
        })),
      clientComplianceRate:
        coach.analytics?.avgComplianceRate !== null &&
        coach.analytics?.avgComplianceRate !== undefined
          ? toNumber(coach.analytics.avgComplianceRate)
          : average(complianceRates),
      newLeads:
        coach.analytics?.totalLeads ??
        (await prisma.coachClientRelationship.count({
          where: { coachId, status: ClientStatus.LEAD }
        }))
    };

    return {
      summaryCards,
      notifications: notifications.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        isRead: item.isRead,
        createdAt: item.createdAt
      })),
      clientManagementSummary: await Promise.all(
        recentRelationships.map(async (relationship) => {
          const detail = await coachesRepository.findRelationship(
            coachId,
            relationship.clientId
          );
          const metrics = detail ? computeClientCompliance(detail) : null;

          return {
            relationshipId: relationship.id,
            clientId: relationship.client.id,
            name: relationship.client.fullName,
            profilePhoto: relationship.client.profilePhoto,
            goal: relationship.client.fitnessGoal,
            status: relationship.status,
            complianceRate: metrics?.overallCompliance ?? 0,
            selectedPlan: {
              workout: relationship.workoutPlan?.title ?? null,
              nutrition: relationship.nutritionPlan?.title ?? null
            },
            dropOffRisk: relationship.dropOffRisk,
            viewProfilePath: `/coaches/${coachId}/clients/${relationship.client.id}`
          };
        })
      ),
      quickActions: [
        { key: "add-client", label: "Add Client", path: `/coaches/${coachId}/clients` },
        { key: "create-workout", label: "Create Workout", path: "/workout-plans" },
        { key: "create-nutrition", label: "Create Nutrition Plan", path: "/nutrition-plans" },
        { key: "message-client", label: "Message Client", path: "/chat/rooms" }
      ],
      sideNavigation: [
        "Dashboard",
        "Clients",
        "Workout Plans",
        "Nutrition Plans",
        "Messages",
        "Marketing Profile",
        "Analytics",
        "Settings"
      ],
      upcomingPayments: upcomingPayments.map((item) => ({
        relationshipId: item.id,
        clientId: item.clientId,
        clientName: item.client.fullName,
        clientPhoto: item.client.profilePhoto,
        amount: toNumber(item.monthlyFee),
        nextPaymentDue: item.nextPaymentDue
      }))
    };
  },

  async listClients(
    coachId: string,
    input: ListCoachClientsInput,
    requester?: CoachRequester
  ) {
    await ensureCoachAccess(coachId, requester);

    const [items, total] = await Promise.all([
      coachesRepository.listRelationships(coachId, input),
      coachesRepository.countRelationships(coachId, input)
    ]);

    const detailedItems = await Promise.all(
      items.map(async (relationship) => {
        const detail = await coachesRepository.findRelationship(
          coachId,
          relationship.clientId
        );
        const metrics = detail ? computeClientCompliance(detail) : null;
        const latestProgress = detail?.client.progressEntries?.[0] ?? null;
        const previousProgress = detail?.client.progressEntries?.[1] ?? null;

        return {
          relationshipId: relationship.id,
          client: {
            id: relationship.client.id,
            fullName: relationship.client.fullName,
            profilePhoto: relationship.client.profilePhoto,
            goal: relationship.client.fitnessGoal,
            location:
              [relationship.client.city, relationship.client.country]
                .filter(Boolean)
                .join(", ") || null
          },
          status: relationship.status,
          dropOffRisk: relationship.dropOffRisk,
          planType:
            relationship.workoutPlan && relationship.nutritionPlan
              ? "combined"
              : relationship.workoutPlan
                ? "workout"
                : relationship.nutritionPlan
                  ? "nutrition"
                  : "unassigned",
          plans: {
            workout: relationship.workoutPlan,
            nutrition: relationship.nutritionPlan
          },
          nextPaymentDue: relationship.nextPaymentDue,
          monthlyFee: toNumber(relationship.monthlyFee),
          lastActivityDate: metrics?.lastActiveDate ?? null,
          metrics: metrics
            ? {
                workoutCompletionPercent: metrics.workoutCompletion,
                habitCompletionPercent: metrics.habitCompletion,
                nutritionCompliancePercent: metrics.nutritionCompletion,
                lastActiveDate: metrics.lastActiveDate,
                streakCount: metrics.currentStreak,
                dropOffRiskIndicator: relationship.dropOffRisk,
                weightTrend:
                  latestProgress?.weightKg !== null &&
                  latestProgress?.weightKg !== undefined &&
                  previousProgress?.weightKg !== null &&
                  previousProgress?.weightKg !== undefined
                    ? Number(
                        (
                          Number(latestProgress.weightKg) -
                          Number(previousProgress.weightKg)
                        ).toFixed(2)
                      )
                    : null
              }
            : null
        };
      })
    );

    return {
      items: detailedItems,
      page: input.page,
      limit: input.limit,
      total
    };
  },

  async getClientDetail(
    coachId: string,
    clientId: string,
    requester?: CoachRequester
  ) {
    await ensureCoachAccess(coachId, requester);

    const relationship = await ensureRelationship(coachId, clientId);
    const metrics = computeClientCompliance(relationship);
    const latestWeight = relationship.client.progressEntries[0]?.weightKg;
    const earliestWeight =
      relationship.client.progressEntries[relationship.client.progressEntries.length - 1]
        ?.weightKg ?? relationship.client.startingWeight;

    return {
      relationship: {
        id: relationship.id,
        status: relationship.status,
        startDate: relationship.startDate,
        endDate: relationship.endDate,
        monthlyFee: toNumber(relationship.monthlyFee),
        nextPaymentDue: relationship.nextPaymentDue,
        dropOffRisk: relationship.dropOffRisk,
        notes: relationship.notes,
        workoutPlan: relationship.workoutPlan,
        nutritionPlan: relationship.nutritionPlan
      },
      client: {
        id: relationship.client.id,
        fullName: relationship.client.fullName,
        profilePhoto: relationship.client.profilePhoto,
        goal: relationship.client.fitnessGoal,
        currentWeight: toNumber(relationship.client.currentWeight),
        goalWeight: toNumber(relationship.client.goalWeight),
        startingWeight: toNumber(relationship.client.startingWeight),
        location:
          [relationship.client.city, relationship.client.country]
            .filter(Boolean)
            .join(", ") || null
      },
      analytics: {
        workoutCompliance: {
          workoutCompletionPercent: metrics.workoutCompletion,
          totalAssigned: metrics.workoutAssigned,
          totalCompleted: metrics.workoutCompleted,
          missedWorkoutsCount: metrics.missedWorkouts,
          currentStreak: metrics.currentStreak,
          longestStreak: metrics.longestStreak,
          lastWorkoutDate: metrics.lastWorkoutDate,
          mostSkippedWorkoutType: metrics.mostSkippedWorkoutType
        },
        habitAdherence: {
          habitCompletionPercent: metrics.habitCompletion,
          missedHabitDays:
            relationship.client.habitLogs.filter((item) => !item.isCompleted).length,
          habitStreak: metrics.currentStreak
        },
        nutritionTracking: {
          daysLogged: relationship.client.nutritionLogs.length,
          mealPlanCompletionPercent: metrics.nutritionCompletion,
          missedNutritionLogs:
            relationship.client.nutritionLogs.filter((item) => !item.isCompleted).length
        },
        progressMetrics: {
          currentWeight: toNumber(latestWeight ?? relationship.client.currentWeight),
          startingWeight: toNumber(relationship.client.startingWeight),
          weeklyWeightChange:
            relationship.client.progressEntries.length >= 2 &&
            relationship.client.progressEntries[0].weightKg !== null &&
            relationship.client.progressEntries[1].weightKg !== null
              ? Number(
                  (
                    Number(relationship.client.progressEntries[0].weightKg) -
                    Number(relationship.client.progressEntries[1].weightKg)
                  ).toFixed(2)
                )
              : null,
          totalWeightChange:
            latestWeight !== null &&
            latestWeight !== undefined &&
            earliestWeight !== null &&
            earliestWeight !== undefined
              ? Number((Number(latestWeight) - Number(earliestWeight)).toFixed(2))
              : null,
          photoUploadFrequency: relationship.client.progressEntries.filter(
            (entry) => Boolean(entry.photoUrl)
          ).length,
          goalProgressPercent:
            relationship.client.startingWeight !== null &&
            relationship.client.startingWeight !== undefined &&
            relationship.client.goalWeight !== null &&
            relationship.client.goalWeight !== undefined &&
            latestWeight !== null &&
            latestWeight !== undefined
              ? Number(
                  (
                    ((Number(relationship.client.startingWeight) -
                      Number(latestWeight)) /
                      (Number(relationship.client.startingWeight) -
                        Number(relationship.client.goalWeight) || 1)) *
                    100
                  ).toFixed(2)
                )
              : null
        },
        engagementAnalytics: {
          lastActiveDate: metrics.lastActiveDate,
          messageReadNotifications: relationship.client.notifications.length,
          planOpenRate:
            relationship.workoutPlan || relationship.nutritionPlan
              ? metrics.overallCompliance
              : 0
        },
        riskIndicators: {
          dropOffRiskLevel: relationship.dropOffRisk,
          inactivityDurationDays: metrics.lastActiveDate
            ? dayjs().diff(dayjs(metrics.lastActiveDate), "day")
            : null,
          decliningTrendIndicator:
            metrics.overallCompliance < 50 ? "down" : "stable",
          plateauDetection:
            relationship.client.progressEntries.length >= 4 &&
            relationship.client.progressEntries
              .slice(0, 4)
              .every(
                (entry) =>
                  entry.weightKg !== null &&
                  relationship.client.progressEntries[0].weightKg !== null &&
                  Math.abs(
                    Number(entry.weightKg) -
                      Number(relationship.client.progressEntries[0].weightKg)
                  ) < 0.5
              )
        },
        behaviourPatterns: {
          mostActiveDayOfWeek: null,
          leastActiveDayOfWeek: null,
          timeOfDayWorkoutLogged: null,
          improvementTrend:
            metrics.overallCompliance >= 70
              ? "up"
              : metrics.overallCompliance >= 40
                ? "stable"
                : "down"
        }
      },
      recentActivity: {
        workoutLogs: relationship.client.workoutLogs,
        nutritionLogs: relationship.client.nutritionLogs,
        habitLogs: relationship.client.habitLogs,
        progressEntries: relationship.client.progressEntries
      }
    };
  },

  async addClient(
    coachId: string,
    input: AddCoachClientInput,
    requester?: CoachRequester
  ) {
    await ensureCoachAccess(coachId, requester);

    const [coach, client] = await Promise.all([
      prisma.coach.findUnique({ where: { id: coachId }, select: { id: true } }),
      prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true, fullName: true }
      })
    ]);

    if (!coach) {
      throw new CoachError("Coach not found", 404);
    }

    if (!client) {
      throw new CoachError("Client not found", 404);
    }

    const relationship = await prisma.coachClientRelationship.upsert({
      where: {
        coachId_clientId: {
          coachId,
          clientId: input.clientId
        }
      },
      update: {
        status: input.status,
        workoutPlanId: input.workoutPlanId ?? undefined,
        nutritionPlanId: input.nutritionPlanId ?? undefined,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        monthlyFee: input.monthlyFee ?? undefined,
        nextPaymentDue: input.nextPaymentDue ?? null,
        dropOffRisk: input.dropOffRisk,
        notes: input.notes ?? undefined
      },
      create: {
        coachId,
        clientId: input.clientId,
        status: input.status,
        workoutPlanId: input.workoutPlanId ?? null,
        nutritionPlanId: input.nutritionPlanId ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        monthlyFee: input.monthlyFee ?? null,
        nextPaymentDue: input.nextPaymentDue ?? null,
        dropOffRisk: input.dropOffRisk,
        notes: input.notes ?? null
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true
          }
        },
        workoutPlan: {
          select: {
            id: true,
            title: true
          }
        },
        nutritionPlan: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        clientId: input.clientId,
        type: NotificationType.GENERAL,
        title: "Coach assignment updated",
        body: `${client.fullName} has been added to a coaching plan.`,
        data: {
          coachId,
          relationshipId: relationship.id
        }
      }
    });

    return {
      relationshipId: relationship.id,
      coachId,
      client: relationship.client,
      status: relationship.status,
      workoutPlan: relationship.workoutPlan,
      nutritionPlan: relationship.nutritionPlan,
      startDate: relationship.startDate,
      nextPaymentDue: relationship.nextPaymentDue,
      monthlyFee: toNumber(relationship.monthlyFee)
    };
  }
};
type CoachProfileRecord = Prisma.CoachGetPayload<typeof coachProfileArgs>;
