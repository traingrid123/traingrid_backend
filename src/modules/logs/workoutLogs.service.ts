import { workoutLogsRepository } from "./workoutLogs.repository";

export const workoutLogsService = {
  async createLog(clientId: string, data: {
    workoutDayId?: string;
    isCompleted: boolean;
    durationMinutes?: number;
    perceivedEffort?: number;
    notes?: string;
    loggedAt?: string;
    exercises: Array<{ exerciseId?: string; exerciseName: string; sets?: unknown; notes?: string }>;
  }) {
    return workoutLogsRepository.create(clientId, {
      ...data,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date()
    });
  },

  async listLogs(clientId: string, startDate?: string, endDate?: string, limit = 20, offset = 0) {
    return workoutLogsRepository.list(clientId, startDate, endDate, limit, offset);
  },

  async getLog(logId: string) {
    const log = await workoutLogsRepository.findById(logId);
    if (!log) {
      throw Object.assign(new Error("Workout log not found"), { statusCode: 404 });
    }
    return log;
  }
};
