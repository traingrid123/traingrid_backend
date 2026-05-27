import { analyticsService } from "./analytics.service";

export const analyticsQueries = {
  getCoachDashboard: (coachId: string) =>
    analyticsService.getCoachAnalyticsDashboard(coachId),

  getCoachMetrics: (coachId: string) =>
    analyticsService.calculateCoachMetrics(coachId),

  getClientProgress: (coachId: string, clientId: string) =>
    analyticsService.getClientProgressAnalytics(coachId, clientId),

  getTopClients: (coachId: string, limit?: number) =>
    analyticsService.getTopPerformingClients(coachId, limit)
};

