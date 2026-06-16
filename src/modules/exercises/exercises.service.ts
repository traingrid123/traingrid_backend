import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export class ExerciseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ExerciseError";
  }
}

export const exercisesService = {
  list: async (params: {
    search?: string;
    muscleGroup?: string;
    equipment?: string;
    level?: string;
    limit?: number;
  }) => {
    const where: any = {};
    if (params.muscleGroup) where.muscleGroup = params.muscleGroup;
    if (params.equipment) where.equipment = params.equipment;
    if (params.level) where.level = params.level;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } }
      ];
    }
    return prisma.exercise.findMany({
      where,
      take: Math.min(Math.max(params.limit ?? 50, 1), 200),
      orderBy: { name: "asc" }
    });
  },

  get: async (id: string) => {
    const found = await prisma.exercise.findUnique({ where: { id } });
    if (!found) throw new ExerciseError("Exercise not found", 404);
    return found;
  },

  createForCoach: async (
    coachId: string,
    input: {
      name: string;
      description?: string;
      muscleGroup: any;
      equipment: any;
      level: any;
      videoUrl?: string;
      thumbnailUrl?: string;
      instructions?: string;
    }
  ) => {
    return prisma.exercise.create({
      data: {
        ...input,
        isCustom: true,
        createdById: coachId
      } as Prisma.ExerciseCreateInput
    });
  }
};
