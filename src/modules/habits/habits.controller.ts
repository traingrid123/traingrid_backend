import { Request, Response } from "express";
import { habitsService, HabitsError } from "./habits.service";

export const habitsController = {
  createHabit: async (req: Request, res: Response) => {
    try {
      const habit = await habitsService.createHabit(req.body);

      res.status(201).json({
        success: true,
        data: habit
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create habit"
      });
    }
  },

  getClientHabits: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const habits = await habitsService.getClientHabits(clientId);

      res.json({
        success: true,
        data: habits
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch habits"
      });
    }
  },

  getHabit: async (req: Request, res: Response) => {
    try {
      const { habitId } = req.params;
      const habit = await habitsService.getHabitDetail(habitId);

      res.json({
        success: true,
        data: habit
      });
    } catch (error) {
      if (error instanceof HabitsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to fetch habit"
      });
    }
  },

  logHabit: async (req: Request, res: Response) => {
    try {
      const { habitId } = req.params;
      const log = await habitsService.logHabit(habitId, req.body);

      res.status(201).json({
        success: true,
        data: log
      });
    } catch (error) {
      if (error instanceof HabitsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to log habit"
      });
    }
  },

  updateHabit: async (req: Request, res: Response) => {
    try {
      const { habitId } = req.params;
      const habit = await habitsService.updateHabit(habitId, req.body);

      res.json({
        success: true,
        data: habit
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update habit"
      });
    }
  },

  deleteHabit: async (req: Request, res: Response) => {
    try {
      const { habitId } = req.params;
      await habitsService.deleteHabit(habitId);

      res.json({
        success: true,
        message: "Habit deleted"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete habit"
      });
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      const { habitId } = req.params;
      const stats = await habitsService.getHabitStats(habitId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      if (error instanceof HabitsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to fetch stats"
      });
    }
  }
};
