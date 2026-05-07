import dayjs from "dayjs";

import { prisma } from "../lib/prisma";
import { computeDropOffRisk, computeWorkoutMetrics } from "../modules/workouts/workout.metrics";

export const dropOffRiskJob = {
  name: "dropOffRisk",
  async run() {
    const relationships = await prisma.coachClientRelationship.findMany({
      where: {
        status: "ACTIVE"
      },
      select: {
        id: true,
        coachId: true,
        clientId: true,
        dropOffRisk: true,
        startDate: true
      }
    });

    let updated = 0;

    for (const relationship of relationships) {
      const [assignment, logs] = await Promise.all([
        prisma.workoutPlanAssignment.findFirst({
          where: {
            coachId: relationship.coachId,
            clientId: relationship.clientId,
            isActive: true
          },
          orderBy: {
            startDate: "desc"
          },
          include: {
            workoutPlan: {
              select: {
                workoutDays: {
                  select: {
                    dayOfWeek: true,
                    isRestDay: true
                  }
                }
              }
            }
          }
        }),
        prisma.workoutLog.findMany({
          where: {
            clientId: relationship.clientId,
            loggedAt: {
              gte: dayjs().subtract(60, "day").toDate()
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
        })
      ]);

      const assignedWorkouts =
        assignment?.workoutPlan.workoutDays.filter((day) => !day.isRestDay).length ??
        logs.length;

      const metrics = computeWorkoutMetrics(logs, Math.max(assignedWorkouts, logs.length));
      const nextRisk = computeDropOffRisk(metrics.completionPercent, metrics.inactivityDays);

      if (relationship.dropOffRisk !== nextRisk) {
        await prisma.coachClientRelationship.update({
          where: { id: relationship.id },
          data: {
            dropOffRisk: nextRisk
          }
        });
        updated += 1;
      }
    }

    return {
      scanned: relationships.length,
      updated
    };
  }
};
