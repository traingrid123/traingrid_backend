import { ClientStatus, NotificationType, Prisma } from "@prisma/client";
import dayjs from "dayjs";

import { prisma } from "../../lib/prisma";
import { notificationsRepository } from "./notifications.repository";
import {
  ListNotificationsInput,
  PlanUpdateRequestInput
} from "./notifications.schema";

export class NotificationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "NotificationError";
  }
}

type NotificationRequester = {
  role: "coach" | "client";
  userId: string;
};

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function ensureCoachAccess(coachId: string, requester?: NotificationRequester) {
  if (!requester) {
    throw new NotificationError("Access token is required", 401);
  }

  if (requester.role !== "coach" || requester.userId !== coachId) {
    throw new NotificationError(
      "You are not allowed to access this coach notification panel",
      403
    );
  }
}

function ensureClientAccess(clientId: string, requester?: NotificationRequester) {
  if (!requester) {
    throw new NotificationError("Access token is required", 401);
  }

  if (requester.role !== "client" || requester.userId !== clientId) {
    throw new NotificationError(
      "You are not allowed to request plan updates for this client",
      403
    );
  }
}

function mapNotification(notification: {
  id: string;
  coachId: string | null;
  clientId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt: Date | null;
  data: Prisma.JsonValue | null;
  createdAt: Date;
  client?: {
    id: string;
    fullName: string;
    profilePhoto: string | null;
  } | null;
}) {
  return {
    id: notification.id,
    coachId: notification.coachId,
    clientId: notification.clientId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    data: notification.data,
    client: notification.client
      ? {
          id: notification.client.id,
          fullName: notification.client.fullName,
          profilePhoto: notification.client.profilePhoto
        }
      : null
  };
}

async function createIfMissing(params: {
  coachId: string;
  clientId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}) {
  const existing = await notificationsRepository.findNotificationByFingerprint({
    coachId: params.coachId,
    type: params.type,
    title: params.title,
    body: params.body
  });

  if (existing) {
    return null;
  }

  return notificationsRepository.createNotification({
    coachId: params.coachId,
    clientId: params.clientId ?? null,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data
  });
}

async function syncPaymentReminders(coachId: string) {
  const todayStart = dayjs().startOf("day");
  const lookAheadEnd = todayStart.add(3, "day").endOf("day");

  const relationships = await notificationsRepository.listRelationshipsForPaymentReminders(
    coachId,
    lookAheadEnd.toDate()
  );

  await Promise.all(
    relationships
      .filter((relationship) => relationship.nextPaymentDue)
      .map((relationship) => {
        const dueDate = dayjs(relationship.nextPaymentDue!);
        const dayLabel = dueDate.format("DD MMM YYYY");
        const amount = toNumber(relationship.monthlyFee);
        const title = dueDate.isBefore(todayStart, "day")
          ? `Payment overdue from ${relationship.client.fullName}`
          : `Payment reminder for ${relationship.client.fullName}`;
        const body = amount !== null
          ? `Payment of INR ${amount} is due on ${dayLabel}.`
          : `Payment is due on ${dayLabel}.`;

        return createIfMissing({
          coachId,
          clientId: relationship.clientId,
          type: NotificationType.PAYMENT_REMINDER,
          title,
          body,
          data: {
            relationshipId: relationship.id,
            clientId: relationship.clientId,
            dueDate: relationship.nextPaymentDue!.toISOString(),
            amount
          }
        });
      })
  );
}

async function syncMissedWorkoutAlerts(coachId: string) {
  const targetDay = dayjs().subtract(1, "day");
  const weekday = targetDay.format("dddd").toUpperCase();

  const { relationships, logs } =
    await notificationsRepository.listRelationshipsForMissedWorkouts(
      coachId,
      weekday,
      targetDay.startOf("day").toDate(),
      targetDay.endOf("day").toDate()
    );

  const completedKeys = new Set(
    logs
      .filter((log) => log.isCompleted && log.workoutDayId)
      .map((log) => `${log.clientId}:${log.workoutDayId}`)
  );
  const completedClientsWithoutLinkedDay = new Set(
    logs
      .filter((log) => log.isCompleted && !log.workoutDayId)
      .map((log) => log.clientId)
  );

  await Promise.all(
    relationships.flatMap((relationship) =>
      completedClientsWithoutLinkedDay.has(relationship.clientId)
        ? []
        : 
      (relationship.workoutPlan?.workoutDays ?? [])
        .filter((workoutDay) => !completedKeys.has(`${relationship.clientId}:${workoutDay.id}`))
        .map((workoutDay) => {
          const title = `Missed workout: ${relationship.client.fullName}`;
          const body = `${relationship.client.fullName} missed ${
            workoutDay.title?.trim() || "their scheduled workout"
          } on ${targetDay.format("DD MMM YYYY")}.`;

          return createIfMissing({
            coachId: relationship.coachId,
            clientId: relationship.clientId,
            type: NotificationType.MISSED_WORKOUT,
            title,
            body,
            data: {
              relationshipId: relationship.id,
              clientId: relationship.clientId,
              workoutDayId: workoutDay.id,
              scheduledFor: targetDay.toISOString(),
              workoutTitle: workoutDay.title ?? null
            }
          });
        })
    )
  );
}

export const notificationsService = {
  async listCoachNotifications(
    coachId: string,
    input: ListNotificationsInput,
    requester?: NotificationRequester
  ) {
    ensureCoachAccess(coachId, requester);

    await Promise.all([
      syncPaymentReminders(coachId),
      syncMissedWorkoutAlerts(coachId)
    ]);

    const [items, total, unreadCount] = await Promise.all([
      notificationsRepository.listCoachNotifications({
        coachId,
        page: input.page,
        limit: input.limit,
        type: input.type,
        unreadOnly: input.unreadOnly
      }),
      notificationsRepository.countCoachNotifications({
        coachId,
        type: input.type,
        unreadOnly: input.unreadOnly
      }),
      notificationsRepository.countUnreadForCoach(coachId)
    ]);

    return {
      items: items.map(mapNotification),
      page: input.page,
      limit: input.limit,
      total,
      unreadCount
    };
  },

  async markRead(
    coachId: string,
    notificationId: string,
    requester?: NotificationRequester
  ) {
    ensureCoachAccess(coachId, requester);

    const existing = await notificationsRepository.findCoachNotificationById(
      notificationId,
      coachId
    );

    if (!existing) {
      throw new NotificationError("Notification not found", 404);
    }

    const notification = existing.isRead
      ? existing
      : await notificationsRepository.markRead(notificationId);

    return mapNotification(notification);
  },

  async markAllRead(coachId: string, requester?: NotificationRequester) {
    ensureCoachAccess(coachId, requester);

    const result = await notificationsRepository.markAllReadForCoach(coachId);

    return {
      updatedCount: result.count
    };
  },

  async requestPlanUpdate(
    clientId: string,
    input: PlanUpdateRequestInput,
    requester?: NotificationRequester
  ) {
    ensureClientAccess(clientId, requester);

    const relationship = await prisma.coachClientRelationship.findFirst({
      where: {
        clientId,
        ...(input.coachId ? { coachId: input.coachId } : {}),
        status: {
          in: [ClientStatus.ACTIVE, ClientStatus.AT_RISK]
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        coach: {
          select: {
            id: true,
            fullName: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!relationship) {
      throw new NotificationError("Assigned coach not found for this client", 404);
    }

    const title = `Plan update requested by ${relationship.client.fullName}`;
    const requestedChanges = input.requestedChanges ?? [];
    const body = requestedChanges.length
      ? `${input.message} Requested changes: ${requestedChanges.join(", ")}.`
      : input.message;

    const notification = await notificationsRepository.createNotification({
      coachId: relationship.coachId,
      clientId: relationship.clientId,
      type: NotificationType.PLAN_UPDATE_REQUEST,
      title,
      body,
      data: {
        relationshipId: relationship.id,
        clientId: relationship.clientId,
        coachId: relationship.coachId,
        requestedChanges,
        message: input.message
      }
    });

    return {
      notification: mapNotification(notification),
      coach: {
        id: relationship.coach.id,
        fullName: relationship.coach.fullName
      }
    };
  }
};
