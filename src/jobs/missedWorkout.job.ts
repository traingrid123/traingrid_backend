import dayjs from "dayjs";

import { prisma } from "../lib/prisma";

export const missedWorkoutJob = {
  name: "missedWorkout",
  async run() {
    const activeAssignments = await prisma.workoutPlanAssignment.findMany({
      where: { isActive: true },
      include: {
        workoutPlan: {
          include: {
            workoutDays: true
          }
        }
      }
    });

    let remindersSent = 0;

    for (const assignment of activeAssignments) {
      const targetDate = dayjs().subtract(1, "day").startOf("day");
      const targetWeekDay = targetDate.format("dddd").toUpperCase();
      const scheduled = assignment.workoutPlan.workoutDays.find(
        (day) => day.dayOfWeek === targetWeekDay && !day.isRestDay
      );

      if (!scheduled) {
        continue;
      }

      const log = await prisma.workoutLog.findFirst({
        where: {
          clientId: assignment.clientId,
          workoutDayId: scheduled.id,
          logDate: targetDate.toDate(),
          isCompleted: true
        },
        select: { id: true }
      });

      if (log) {
        continue;
      }

      const existingNotification = await prisma.notification.findFirst({
        where: {
          clientId: assignment.clientId,
          type: "MISSED_WORKOUT",
          createdAt: {
            gte: dayjs().startOf("day").toDate()
          },
          data: {
            path: ["workoutDayId"],
            equals: scheduled.id
          }
        },
        select: { id: true }
      });

      if (existingNotification) {
        continue;
      }

      await prisma.notification.create({
        data: {
          coachId: assignment.coachId,
          clientId: assignment.clientId,
          type: "MISSED_WORKOUT",
          title: "Missed workout",
          body: `You missed ${scheduled.title ?? "your scheduled workout"} yesterday.`,
          data: {
            workoutDayId: scheduled.id,
            assignmentId: assignment.id,
            date: targetDate.format("YYYY-MM-DD")
          }
        }
      });
      remindersSent += 1;
    }

    return {
      scanned: activeAssignments.length,
      remindersSent
    };
  }
};
