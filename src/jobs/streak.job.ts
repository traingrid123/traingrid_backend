import dayjs from "dayjs";

import { prisma } from "../lib/prisma";
import { computeWorkoutMetrics } from "../modules/workouts/workout.metrics";

export const streakJob = {
  name: "streak",
  async run() {
    const activeAssignments = await prisma.workoutPlanAssignment.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        clientId: true,
        coachId: true
      }
    });

    let nudgesSent = 0;

    for (const assignment of activeAssignments) {
      const logs = await prisma.workoutLog.findMany({
        where: {
          clientId: assignment.clientId,
          loggedAt: {
            gte: dayjs().subtract(45, "day").toDate()
          }
        },
        orderBy: {
          loggedAt: "desc"
        },
        include: {
          workoutDay: {
            select: {
              title: true,
              dayOfWeek: true
            }
          }
        }
      });

      const metrics = computeWorkoutMetrics(logs, Math.max(logs.length, 1));
      if (metrics.currentStreak > 0 && metrics.currentStreak % 7 === 0) {
        const alreadyNotified = await prisma.notification.findFirst({
          where: {
            clientId: assignment.clientId,
            type: "GENERAL",
            title: "Streak milestone",
            createdAt: {
              gte: dayjs().startOf("day").toDate()
            }
          },
          select: {
            id: true
          }
        });

        if (!alreadyNotified) {
          await prisma.notification.create({
            data: {
              coachId: assignment.coachId,
              clientId: assignment.clientId,
              type: "GENERAL",
              title: "Streak milestone",
              body: `You're on a ${metrics.currentStreak}-day workout streak. Keep it going!`,
              data: {
                assignmentId: assignment.id,
                streak: metrics.currentStreak
              }
            }
          });
          nudgesSent += 1;
        }
      }
    }

    return {
      scanned: activeAssignments.length,
      nudgesSent
    };
  }
};
