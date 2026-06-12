import { Request, Response } from "express";
import { relationshipsService, RelationshipsError } from "./relationships.service";
import { relationshipsSchema } from "./relationships.schema";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    role: "coach" | "client";
  };
};

function getAuth(req: Request) {
  return (req as AuthRequest).auth;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const relationshipsController = {
  createRelationship: async (req: Request, res: Response) => {
    try {
      const auth = getAuth(req);
      const coachId = auth?.userId;
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

  requestCoach: async (req: Request, res: Response) => {
    try {
      const auth = getAuth(req);
      const clientId = auth?.userId;
      const { coachId, monthlyFee, notes } = relationshipsSchema.requestCoach.parse(req.body);

      if (!clientId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      if (auth?.role !== "client") {
        return res.status(403).json({
          success: false,
          error: "Only clients can request a coach"
        });
      }

      const relationship = await relationshipsService.requestCoach(clientId, coachId, {
        monthlyFee,
        notes
      });

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
        error: "Failed to request coach"
      });
    }
  },

  subscribeCoach: async (req: Request, res: Response) => {
    try {
      const auth = getAuth(req);
      const clientId = auth?.userId;
      const { coachId, monthlyFee, notes } = relationshipsSchema.subscribeCoach.parse(req.body);

      if (!clientId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      if (auth?.role !== "client") {
        return res.status(403).json({
          success: false,
          error: "Only clients can subscribe to a coach"
        });
      }

      const relationship = await relationshipsService.subscribeCoach(clientId, coachId, {
        monthlyFee,
        notes
      });

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
        error: "Failed to subscribe to coach"
      });
    }
  },

  getCoachClients: async (req: Request, res: Response) => {
    try {
      const coachId = getAuth(req)?.userId;

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
      const clientId = getAuth(req)?.userId;

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
      const coachId = getAuth(req)?.userId;
      const clientId = getParam(req.params.clientId);

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
      const coachId = getAuth(req)?.userId;
      const clientId = getParam(req.params.clientId);

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
      const coachId = getAuth(req)?.userId;
      const clientId = getParam(req.params.clientId);

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
      const coachId = getAuth(req)?.userId;
      const clientId = getParam(req.params.clientId);
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
      const coachId = getAuth(req)?.userId;
      const clientId = getParam(req.params.clientId);
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
