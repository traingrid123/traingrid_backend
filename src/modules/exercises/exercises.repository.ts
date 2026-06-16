import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { CreateExerciseInput, ListExercisesInput, UpdateExerciseInput } from "./exercises.schema";

export const exercisesRepository = {
  async list({ search, muscleGroup, equipment, level, limit, offset }: ListExercisesInput, coachId?: string) {
    const where: Prisma.ExerciseWhereInput = {
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {},
        muscleGroup ? { muscleGroup } : {},
        equipment ? { equipment } : {},
        level ? { level } : {},
        {
          OR: [
            { isCustom: false },
            ...(coachId ? [{ isCustom: true, createdById: coachId }] : [])
          ]
        }
      ]
    };

    const [items, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ isCustom: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset
      }),
      prisma.exercise.count({ where })
    ]);

    return { items, total };
  },

  async findById(exerciseId: string) {
    return prisma.exercise.findUnique({ where: { id: exerciseId } });
  },

  async createCustom(coachId: string, data: CreateExerciseInput) {
    return prisma.exercise.create({
      data: { ...data, isCustom: true, createdById: coachId }
    });
  },

  async update(exerciseId: string, data: UpdateExerciseInput) {
    return prisma.exercise.update({ where: { id: exerciseId }, data });
  },

  async delete(exerciseId: string) {
    return prisma.exercise.delete({ where: { id: exerciseId } });
  }
};
