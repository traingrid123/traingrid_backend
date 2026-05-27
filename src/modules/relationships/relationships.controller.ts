import { Request, Response } from "express";
import { relationshipsService, RelationshipsError } from "./relationships.service";

export const relationshipsController = {
  createRelationship: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId, ...data } = req.body;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const relationship = await relationshipsService.createRelationship(coachId, clientId, data);

      res.status(201).json({
        success: true,
        data: relationship
      });
    } catch (error) {
      if (error instanceof RelationshipsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to create relationship"
      });
    }
  },

  getCoachClients: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const clients = await relationshipsService.getCoachClients(coachId);

      res.json({
        success: true,
        data: clients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch clients"
      });
    }
  },

  getClientCoaches: async (req: Request, res: Response) => {
    try {
      const clientId = req.user?.id;

      if (!clientId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const coaches = await relationshipsService.getClientCoaches(clientId);

      res.json({
        success: true,
        data: coaches
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch coaches"
      });
    }
  },

  getRelationship: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId } = req.params;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const relationship = await relationshipsService.getRelationship(coachId, clientId);

      res.json({
        success: true,
        data: relationship
      });
    } catch (error) {
      if (error instanceof RelationshipsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to fetch relationship"
      });
    }
  },

  updateRelationship: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId } = req.params;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const relationship = await relationshipsService.updateRelationship(coachId, clientId, req.body);

      res.json({
        success: true,
        data: relationship
      });
    } catch (error) {
      if (error instanceof RelationshipsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update relationship"
      });
    }
  },

  endRelationship: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId } = req.params;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      await relationshipsService.endRelationship(coachId, clientId);

      res.json({
        success: true,
        message: "Relationship ended"
      });
    } catch (error) {
      if (error instanceof RelationshipsError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to end relationship"
      });
    }
  },

  assignWorkoutPlan: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId } = req.params;
      const { workoutPlanId } = req.body;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const relationship = await relationshipsService.assignWorkoutPlan(coachId, clientId, workoutPlanId);

      res.json({
        success: true,
        data: relationship
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to assign workout plan"
      });
    }
  },

  assignNutritionPlan: async (req: Request, res: Response) => {
    try {
      const coachId = req.user?.id;
      const { clientId } = req.params;
      const { nutritionPlanId } = req.body;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const relationship = await relationshipsService.assignNutritionPlan(coachId, clientId, nutritionPlanId);

      res.json({
        success: true,
        data: relationship
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to assign nutrition plan"
      });
    }
  }
};
