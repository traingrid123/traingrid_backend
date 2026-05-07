import { ClientStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
  );
}

export const analyticsJob = {
  name: "analytics",
  async run() {
    const coaches = await prisma.coach.findMany({
      select: { id: true }
    });

    for (const coach of coaches) {
      const relationships = await prisma.coachClientRelationship.findMany({
        where: { coachId: coach.id },
        select: {
          status: true,
          clientId: true
        }
      });

      const totalClients = relationships.length;
      const activeClients = relationships.filter(
        (item) => item.status === ClientStatus.ACTIVE
      ).length;
      const totalLeads = relationships.filter(
        (item) => item.status === ClientStatus.LEAD
      ).length;

      const clientIds = relationships.map((item) => item.clientId);
      const logs = clientIds.length
        ? await prisma.workoutLog.findMany({
            where: {
              clientId: {
                in: clientIds
              }
            },
            select: {
              clientId: true,
              isCompleted: true
            }
          })
        : [];

      const grouped = new Map<string, { total: number; completed: number }>();
      for (const log of logs) {
        const existing = grouped.get(log.clientId) ?? { total: 0, completed: 0 };
        existing.total += 1;
        if (log.isCompleted) {
          existing.completed += 1;
        }
        grouped.set(log.clientId, existing);
      }

      const compliance = Array.from(grouped.values()).map((value) =>
        value.total ? (value.completed / value.total) * 100 : 0
      );
      const avgComplianceRate = average(compliance);

      await prisma.coachAnalytics.upsert({
        where: { coachId: coach.id },
        create: {
          coachId: coach.id,
          totalClients,
          activeClients,
          weeklyActiveClients: activeClients,
          avgComplianceRate,
          totalLeads,
          conversionRate: totalLeads ? (activeClients / totalLeads) * 100 : 0,
          planCompletionRate: avgComplianceRate
        },
        update: {
          totalClients,
          activeClients,
          weeklyActiveClients: activeClients,
          avgComplianceRate,
          totalLeads,
          conversionRate: totalLeads ? (activeClients / totalLeads) * 100 : 0,
          planCompletionRate: avgComplianceRate,
          lastUpdatedAt: new Date()
        }
      });
    }

    return {
      coachesProcessed: coaches.length
    };
  }
};
