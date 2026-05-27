import { Request, Response } from "express";
import { progressService, ProgressError } from "./progress.service";

export const progressController = {
  getProgress: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const progress = await progressService.getClientProgress(clientId, coachId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof ProgressError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  },

  getMetrics: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const metrics = await progressService.getProgressMetrics(clientId, coachId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  },

  getChart: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { days } = req.query;
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const chart = await progressService.getProgressChart(
        clientId,
        coachId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: chart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  },

  getMilestones: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const milestones = await progressService.getProgressMilestones(clientId, coachId);

      res.json({
        success: true,
        data: milestones
      });
    } catch (error) {
      if (error instanceof ProgressError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
};
