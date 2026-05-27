import { Request, Response } from "express";
import { analyticsQueries } from "./analytics.queries";
import { analyticsService, AnalyticsError } from "./analytics.service";

export const analyticsController = {
  getCoachDashboard: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const analytics = await analyticsQueries.getCoachDashboard(coachId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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

  getCoachMetrics: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const metrics = await analyticsQueries.getCoachMetrics(coachId);

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

  getClientProgress: async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const progress = await analyticsQueries.getClientProgress(coachId, clientId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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

  getTopClients: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { limit } = req.query;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const clients = await analyticsQueries.getTopClients(
        coachId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: clients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
};

