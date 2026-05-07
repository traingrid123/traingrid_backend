import { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

const coachNotificationInclude = {
  client: {
    select: {
      id: true,
      fullName: true,
      profilePhoto: true
    }
  }
} as const;

export const notificationsRepository = {
  listCoachNotifications(params: {
    coachId: string;
    page: number;
    limit: number;
    type?: NotificationType;
    unreadOnly?: boolean;
  }) {
    const skip = (params.page - 1) * params.limit;

    return prisma.notification.findMany({
      where: {
        coachId: params.coachId,
        ...(params.type ? { type: params.type } : {}),
        ...(params.unreadOnly ? { isRead: false } : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: params.limit,
      include: coachNotificationInclude
    });
  },

  countCoachNotifications(params: {
    coachId: string;
    type?: NotificationType;
    unreadOnly?: boolean;
  }) {
    return prisma.notification.count({
      where: {
        coachId: params.coachId,
        ...(params.type ? { type: params.type } : {}),
        ...(params.unreadOnly ? { isRead: false } : {})
      }
    });
  },

  countUnreadForCoach(coachId: string) {
    return prisma.notification.count({
      where: {
        coachId,
        isRead: false
      }
    });
  },

  findCoachNotificationById(notificationId: string, coachId: string) {
    return prisma.notification.findFirst({
      where: {
        id: notificationId,
        coachId
      },
      include: coachNotificationInclude
    });
  },

  markRead(notificationId: string) {
    return prisma.notification.update({
      where: {
        id: notificationId
      },
      data: {
        isRead: true,
        readAt: new Date()
      },
      include: coachNotificationInclude
    });
  },

  markAllReadForCoach(coachId: string) {
    return prisma.notification.updateMany({
      where: {
        coachId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  },

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({
      data,
      include: coachNotificationInclude
    });
  },

  findNotificationByFingerprint(params: {
    coachId: string;
    type: NotificationType;
    title: string;
    body: string;
  }) {
    return prisma.notification.findFirst({
      where: {
        coachId: params.coachId,
        type: params.type,
        title: params.title,
        body: params.body
      },
      select: {
        id: true
      }
    });
  },

  listRelationshipsForPaymentReminders(coachId: string, dueTo: Date) {
    return prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        nextPaymentDue: {
          lte: dueTo
        }
      },
      select: {
        id: true,
        clientId: true,
        nextPaymentDue: true,
        monthlyFee: true,
        client: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
  },

  listRelationshipsForMissedWorkouts(coachId: string, weekday: string, dayStart: Date, dayEnd: Date) {
    return prisma.coachClientRelationship.findMany({
      where: {
        coachId,
        status: "ACTIVE",
        workoutPlanId: {
          not: null
        }
      },
      select: {
        id: true,
        clientId: true,
        coachId: true,
        client: {
          select: {
            id: true,
            fullName: true
          }
        },
        workoutPlan: {
          select: {
            id: true,
            title: true,
            workoutDays: {
              where: {
                dayOfWeek: weekday as any,
                isRestDay: false
              },
              select: {
                id: true,
                title: true,
                dayOfWeek: true
              }
            }
          }
        }
      }
    }).then(async (relationships) => {
      const clientIds = relationships.map((item) => item.clientId);

      const logs = clientIds.length
        ? await prisma.workoutLog.findMany({
            where: {
              clientId: {
                in: clientIds
              },
              loggedAt: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            select: {
              clientId: true,
              workoutDayId: true,
              isCompleted: true,
              loggedAt: true
            }
          })
        : [];

      return {
        relationships,
        logs
      };
    });
  }
};
