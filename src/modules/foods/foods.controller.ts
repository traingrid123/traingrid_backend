import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { foodsSchema } from "./foods.schema";
import { FoodsError, foodsService } from "./foods.service";

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: error.flatten()
    });
    return;
  }
  if (error instanceof FoodsError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }
  next(error);
}

export const foodsController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const input = foodsSchema.search.parse(req.query);
      const result = await foodsService.search(input.q, input.limit);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const input = foodsSchema.detail.parse(req.params);
      const result = await foodsService.detail(input.fdcId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const input = foodsSchema.detail.parse(req.params);
      const result = await foodsService.refresh(input.fdcId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  }
};
