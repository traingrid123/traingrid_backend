import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import { ClientLeaderboardInput, UpdateClientProfileInput } from "./clients.schema";
import { clientsRepository } from "./clients.repository";

export class ClientError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ClientError";
  }
}

type ClientRequester = {
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

function computeStreakFromDates(dates: Date[]) {
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

    if (diff === 0 || (streak === 0 && diff === 1) || diff === 1) {
      streak += 1;
      cursor = dayjs(entry);
      continue;
    }

    break;
  }

  return streak;
}

function ensureClientAccess(clientId: string, requester?: ClientRequester) {
  if (!requester) {
    return;
  }

  if (requester.role !== "client" || requester.userId !== clientId) {
    throw new ClientError("You are not allowed to access this client resource", 403);
  }
}

function calculateCoachRating(relationship: {
  coach: {
    marketingProfile?: {
      testimonials?: Array<{ rating: number | null }>;
    } | null;
  };
}) {
  const ratings =
    relationship.coach.marketingProfile?.testimonials
      ?.map((item) => item.rating)
      .filter((value): value is number => typeof value === "number") ?? [];

  return ratings.length ? average(ratings) : null;
}

function mapCoachCard(relationship: {
  coach: {
    id: string;
    fullName: string;
    profilePhoto: string | null;
    specialisations: string[];
    isVerified: boolean;
    profileSlug: string | null;
    marketingProfile?: {
      testimonials?: Array<{ rating: number | null }>;
    } | null;
  };
}) {
  return {
    id: relationship.coach.id,
    name: relationship.coach.fullName,
    profilePhoto: relationship.coach.profilePhoto,
    specialisations: relationship.coach.specialisations,
    certificationBadge: relationship.coach.isVerified,
    rating: calculateCoachRating(relationship),
    messagePath: `/chat/rooms/direct`,
    profileSlug: relationship.coach.profileSlug
  };
}

export const clientsService = {
  async getProfile(clientId: string, requester?: ClientRequester) {
    ensureClientAccess(clientId, requester);

    const client = await clientsRepository.findById(clientId);

    if (!client) {
      throw new ClientError("Client not found", 404);
    }

    return {
      id: client.id,
      email: client.email,
      phone: client.phone,
      fullName: client.fullName,
      gender: client.gender,
      profilePhoto: client.profilePhoto,
      dateOfBirth: client.dateOfBirth,
      city: client.city,
      country: client.country,
      heightCm: toNumber(client.heightCm),
      startingWeight: toNumber(client.startingWeight),
      currentWeight: toNumber(client.currentWeight),
      goalWeight: toNumber(client.goalWeight),
      fitnessGoal: client.fitnessGoal,
      isActive: client.isActive,
      createdAt: client.createdAt,
      coachSummary: client.relationships[0]
        ? {
            coachId: client.relationships[0].coachId,
            status: client.relationships[0].status,
            coach: mapCoachCard(client.relationships[0])
          }
        : null
    };
  },

  async updateProfile(
    clientId: string,
    input: UpdateClientProfileInput,
    requester?: ClientRequester
  ) {
    ensureClientAccess(clientId, requester);

    const existing = await prisma.client.findUnique({
      where: {
        id: clientId
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      throw new ClientError("Client not found", 404);
    }

    const updated = await prisma.client.update({
      where: {
        id: clientId
      },
      data: {
        fullName: input.fullName,
        gender: input.gender === null ? null : input.gender,
        profilePhoto: input.profilePhoto === null ? null : input.profilePhoto,
        dateOfBirth: input.dateOfBirth === null ? null : input.dateOfBirth,
        city: input.city === null ? null : input.city,
        country: input.country === null ? null : input.country,
        heightCm:
          input.heightCm === null || input.heightCm === undefined
            ? input.heightCm === null
              ? null
              : undefined
            : input.heightCm,
        startingWeight:
          input.startingWeight === null || input.startingWeight === undefined
            ? input.startingWeight === null
              ? null
              : undefined
            : input.startingWeight,
        currentWeight:
          input.currentWeight === null || input.currentWeight === undefined
            ? input.currentWeight === null
              ? null
              : undefined
            : input.currentWeight,
        goalWeight:
          input.goalWeight === null || input.goalWeight === undefined
            ? input.goalWeight === null
              ? null
              : undefined
            : input.goalWeight,
        fitnessGoal: input.fitnessGoal === null ? null : input.fitnessGoal,
        isActive: input.isActive
      }
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      gender: updated.gender,
      profilePhoto: updated.profilePhoto,
      dateOfBirth: updated.dateOfBirth,
      city: updated.city,
      country: updated.country,
      heightCm: toNumber(updated.heightCm),
      startingWeight: toNumber(updated.startingWeight),
      currentWeight: toNumber(updated.currentWeight),
      goalWeight: toNumber(updated.goalWeight),
      fitnessGoal: updated.fitnessGoal,
      isActive: updated.isActive
    };
  },

  async getDashboard(clientId: string, requester?: ClientRequester) {
    ensureClientAccess(clientId, requester);

    const client = await clientsRepository.findById(clientId);

    if (!client) {
      throw new ClientError("Client not found", 404);
    }

    const relationship = client.relationships[0] ?? null;
    const today = dayjs();
    const todayWorkout = relationship?.workoutPlan?.workoutDays.find((day) => {
      if (!day.dayOfWeek) {
        return false;
      }

      return day.dayOfWeek === today.format("dddd").toUpperCase();
    }) ?? relationship?.workoutPlan?.workoutDays[0];

    const latestWorkoutLog = client.workoutLogs.find((log) =>
      todayWorkout ? log.workoutDayId === todayWorkout.id : dayjs(log.loggedAt).isSame(today, "day")
    );
    const todayNutritionLogs = client.nutritionLogs.filter((log) =>
      dayjs(log.loggedAt).isSame(today, "day")
    );
    const todayHabitLogs = client.habitLogs.filter((log) =>
      dayjs(log.loggedAt).isSame(today, "day")
    );

    const completedWorkoutDates = client.workoutLogs
      .filter((item) => item.isCompleted)
      .map((item) => item.loggedAt);

    const streak = computeStreakFromDates(completedWorkoutDates);
    const weeklyCompletedWorkouts = client.workoutLogs.filter((item) =>
      item.isCompleted && dayjs(item.loggedAt).isAfter(today.subtract(7, "day"))
    ).length;
    const workoutCompletion = ratio(
      client.workoutLogs.filter((item) => item.isCompleted).length,
      client.workoutLogs.length
    );
    const nutritionCompletion = ratio(
      client.nutritionLogs.filter((item) => item.isCompleted).length,
      client.nutritionLogs.length
    );
    const habitCompletion = ratio(
      client.habitLogs.filter((item) => item.isCompleted).length,
      client.habitLogs.length
    );

    return {
      topNavigation: {
        notificationsCount: client.notifications.filter((item) => !item.isRead).length,
        alerts: client.notifications.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          isRead: item.isRead,
          createdAt: item.createdAt
        }))
      },
      greeting: {
        title: `Hey ${client.fullName}!`,
        motivation:
          relationship?.coach.fullName
            ? `Stay consistent. ${relationship.coach.fullName} is tracking your progress.`
            : "Show up for today and stack one more good day.",
        streakMessage: streak > 0 ? `You're on a ${streak}-day streak!` : "Start your streak today."
      },
      search: {
        placeholder: "Search workouts, nutrition plans, or coach messages"
      },
      todaysWorkout: todayWorkout
        ? {
            id: todayWorkout.id,
            title: todayWorkout.title ?? relationship?.workoutPlan?.title ?? "Today's workout",
            status: latestWorkoutLog?.isCompleted ? "COMPLETED" : "PENDING",
            date: today.toDate(),
            notes: todayWorkout.notes,
            exercises: todayWorkout.workoutDayExercises.map((entry) => ({
              id: entry.id,
              exerciseId: entry.exerciseId,
              exerciseName: entry.exercise.name,
              sets: entry.sets,
              reps: entry.reps,
              restSeconds: entry.restSeconds,
              notes: entry.notes
            }))
          }
        : null,
      dailyTaskChecklist: [
        {
          key: "workout",
          label: "Workout",
          completed: Boolean(latestWorkoutLog?.isCompleted)
        },
        {
          key: "meals",
          label: "Meals",
          completed: todayNutritionLogs.some((log) => log.isCompleted)
        },
        {
          key: "habits",
          label: "Habits",
          completed: todayHabitLogs.some((log) => log.isCompleted)
        }
      ],
      progressSnapshot: {
        latestAchievement: `${weeklyCompletedWorkouts} workouts completed this week`,
        workoutCompletionPercent: workoutCompletion,
        nutritionCompletionPercent: nutritionCompletion,
        habitCompletionPercent: habitCompletion
      },
      habitTracking: client.habits.map((habit) => {
        const latestLog = client.habitLogs.find(
          (log) => log.habitId === habit.id && dayjs(log.loggedAt).isSame(today, "day")
        );

        return {
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          targetValue: habit.targetValue,
          unit: habit.unit,
          completedToday: latestLog?.isCompleted ?? false,
          latestValue: latestLog?.value ?? null
        };
      }),
      myCoach: relationship ? mapCoachCard(relationship) : null,
      bottomNavigation: ["Home", "Chat", "Leaderboard", "My Profile"]
    };
  },

  async getAssignedCoach(clientId: string, requester?: ClientRequester) {
    ensureClientAccess(clientId, requester);

    const client = await clientsRepository.findById(clientId);

    if (!client) {
      throw new ClientError("Client not found", 404);
    }

    const relationship = client.relationships[0];

    if (!relationship) {
      throw new ClientError("Assigned coach not found", 404);
    }

    return {
      coach: {
        ...mapCoachCard(relationship),
        bio: relationship.coach.bio,
        yearsExperience: relationship.coach.yearsExperience,
        coachingMode: relationship.coach.coachingMode,
        averageRating: calculateCoachRating(relationship),
        weeklyCalendarView: relationship.workoutPlan?.workoutDays.map((day) => ({
          id: day.id,
          title: day.title,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          isRestDay: day.isRestDay
        })) ?? []
      },
      interactionFeatures: {
        requestPlanUpdatePath: `/notifications`,
        pushNotificationHistory: client.notifications.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          createdAt: item.createdAt
        })),
        announcements: client.notifications
          .filter((item) => item.type === "GENERAL" || item.type === "PLAN_UPDATE_REQUEST")
          .map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            createdAt: item.createdAt
          })),
        reviewEnabled: true
      }
    };
  },

  async getLeaderboard(
    clientId: string,
    input: ClientLeaderboardInput,
    requester?: ClientRequester
  ) {
    ensureClientAccess(clientId, requester);

    const relationships = await prisma.coachClientRelationship.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        client: {
          include: {
            workoutLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30
            },
            habitLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30
            },
            nutritionLogs: {
              orderBy: {
                loggedAt: "desc"
              },
              take: 30
            }
          }
        }
      }
    });

    const items = relationships
      .map((relationship) => {
        const completedDates = [
          ...relationship.client.workoutLogs
            .filter((entry) => entry.isCompleted)
            .map((entry) => entry.loggedAt),
          ...relationship.client.habitLogs
            .filter((entry) => entry.isCompleted)
            .map((entry) => entry.loggedAt),
          ...relationship.client.nutritionLogs
            .filter((entry) => entry.isCompleted)
            .map((entry) => entry.loggedAt)
        ];
        const streak = computeStreakFromDates(completedDates);
        const completionScore = average([
          ratio(
            relationship.client.workoutLogs.filter((entry) => entry.isCompleted).length,
            relationship.client.workoutLogs.length
          ),
          ratio(
            relationship.client.habitLogs.filter((entry) => entry.isCompleted).length,
            relationship.client.habitLogs.length
          ),
          ratio(
            relationship.client.nutritionLogs.filter((entry) => entry.isCompleted).length,
            relationship.client.nutritionLogs.length
          )
        ]);

        return {
          clientId: relationship.clientId,
          displayName: relationship.client.fullName,
          streak,
          completionScore
        };
      })
      .sort((a, b) => {
        if (b.streak === a.streak) {
          return b.completionScore - a.completionScore;
        }

        return b.streak - a.streak;
      })
      .slice(0, input.limit)
      .map((item, index) => ({
        rank: index + 1,
        clientId: item.clientId,
        displayName: item.displayName,
        streak: item.streak,
        completionScore: item.completionScore
      }));

    return {
      items,
      currentClientRank:
        items.find((item) => item.clientId === clientId)?.rank ?? null
    };
  },

  async getAnalytics(clientId: string, requester?: ClientRequester) {
    ensureClientAccess(clientId, requester);

    const client = await clientsRepository.findById(clientId);

    if (!client) {
      throw new ClientError("Client not found", 404);
    }

    const latestProgress = client.progressEntries[0] ?? null;
    const oldestProgress = client.progressEntries[client.progressEntries.length - 1] ?? null;

    return {
      workoutCompletionPercent: ratio(
        client.workoutLogs.filter((item) => item.isCompleted).length,
        client.workoutLogs.length
      ),
      habitCompletionPercent: ratio(
        client.habitLogs.filter((item) => item.isCompleted).length,
        client.habitLogs.length
      ),
      nutritionCompliancePercent: ratio(
        client.nutritionLogs.filter((item) => item.isCompleted).length,
        client.nutritionLogs.length
      ),
      progressOverTime: client.progressEntries.map((entry) => ({
        recordedAt: entry.recordedAt,
        weightKg: toNumber(entry.weightKg),
        bodyFatPercent: toNumber(entry.bodyFatPercent),
        photoUrl: entry.photoUrl
      })),
      latestWeight: toNumber(latestProgress?.weightKg ?? client.currentWeight),
      totalWeightChange:
        latestProgress?.weightKg !== null &&
        latestProgress?.weightKg !== undefined &&
        (oldestProgress?.weightKg ?? client.startingWeight) !== null &&
        (oldestProgress?.weightKg ?? client.startingWeight) !== undefined
          ? Number(
              (
                Number(latestProgress.weightKg) -
                Number(oldestProgress?.weightKg ?? client.startingWeight)
              ).toFixed(2)
            )
          : null,
      loginActivityLast7Days: Array.from({ length: 7 }).map((_, index) => {
        const day = dayjs().subtract(6 - index, "day");
        const dailyActions =
          client.workoutLogs.filter((log) => dayjs(log.loggedAt).isSame(day, "day")).length +
          client.habitLogs.filter((log) => dayjs(log.loggedAt).isSame(day, "day")).length +
          client.nutritionLogs.filter((log) => dayjs(log.loggedAt).isSame(day, "day")).length;

        return {
          date: day.toDate(),
          activityCount: dailyActions
        };
      })
    };
  }
};
