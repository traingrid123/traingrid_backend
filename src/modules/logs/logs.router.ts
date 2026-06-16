import { Router } from "express";

import { habitLogsController } from "./habitLogs.controller";
import { nutritionLogsController } from "./nutritionLogs.controller";
import { workoutLogsController } from "./workoutLogs.controller";

export const logsRouter = Router({ mergeParams: true });

logsRouter.post("/:clientId/workout-logs", workoutLogsController.create);
logsRouter.get("/:clientId/workout-logs", workoutLogsController.list);
logsRouter.get("/:clientId/workout-logs/:logId", workoutLogsController.getById);

logsRouter.post("/:clientId/habits/:habitId/log", habitLogsController.logHabit);
logsRouter.get("/:clientId/habit-logs/today", habitLogsController.getToday);
logsRouter.get("/:clientId/habit-logs", habitLogsController.list);

logsRouter.post("/:clientId/nutrition-logs", nutritionLogsController.logMeal);
logsRouter.get("/:clientId/nutrition-logs/today", nutritionLogsController.getToday);
logsRouter.get("/:clientId/nutrition-logs", nutritionLogsController.list);
