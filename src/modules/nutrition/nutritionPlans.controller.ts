import { Request, Response } from "express";
import { nutritionPlansService, NutritionError } from "./nutritionPlans.service";
import { foodItemsService } from "./foodItems.service";

export const nutritionPlansController = {
  createPlan: async (req: Request, res: Response) => {
    try {
      const coachId = (req as any).user?.id;
      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const plan = await nutritionPlansService.createNutritionPlan({
        ...req.body,
        coachId
      });

      res.status(201).json({
        success: true,
        data: plan
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create nutrition plan"
      });
    }
  },

  getPlan: async (req: Request, res: Response) => {
    try {
      const planId = String(req.params.planId);
      const plan = await nutritionPlansService.getNutritionPlan(planId);

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      if (error instanceof NutritionError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to fetch plan"
      });
    }
  },

  getCoachPlans: async (req: Request, res: Response) => {
    try {
      const coachId = (req as any).user?.id;
      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const plans = await nutritionPlansService.getCoachNutritionPlans(coachId);

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch plans"
      });
    }
  },

  updatePlan: async (req: Request, res: Response) => {
    try {
      const planId = String(req.params.planId);
      const coachId = (req as any).user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      const plan = await nutritionPlansService.updateNutritionPlan(planId, coachId, req.body);

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      if (error instanceof NutritionError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update plan"
      });
    }
  },

  deletePlan: async (req: Request, res: Response) => {
    try {
      const planId = String(req.params.planId);
      const coachId = (req as any).user?.id;

      if (!coachId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized"
        });
      }

      await nutritionPlansService.deleteNutritionPlan(planId, coachId);

      res.json({
        success: true,
        message: "Plan deleted successfully"
      });
    } catch (error) {
      if (error instanceof NutritionError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete plan"
      });
    }
  },

  addFoodItem: async (req: Request, res: Response) => {
    try {
      const mealSectionId = String(req.params.mealSectionId);
      const item = await foodItemsService.createFoodItem(mealSectionId, req.body);

      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to add food item"
      });
    }
  },

  deleteFoodItem: async (req: Request, res: Response) => {
    try {
      const foodItemId = String(req.params.foodItemId);
      await foodItemsService.deleteFoodItem(foodItemId);

      res.json({
        success: true,
        message: "Food item deleted"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete food item"
      });
    }
  }
};
