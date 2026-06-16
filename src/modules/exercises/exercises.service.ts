import { exercisesRepository } from "./exercises.repository";
import { CreateExerciseInput, ListExercisesInput, UpdateExerciseInput } from "./exercises.schema";

export class ExerciseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ExerciseError";
  }
}

export const exercisesService = {
  async listExercises(params: ListExercisesInput, coachId?: string) {
    return exercisesRepository.list(params, coachId);
  },

  async getExercise(exerciseId: string) {
    const exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new ExerciseError("Exercise not found", 404);
    }
    return exercise;
  },

  async createCustomExercise(coachId: string, data: CreateExerciseInput) {
    return exercisesRepository.createCustom(coachId, data);
  },

  async updateExercise(requesterId: string, exerciseId: string, data: UpdateExerciseInput) {
    const exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new ExerciseError("Exercise not found", 404);
    }
    if (!exercise.isCustom || exercise.createdById !== requesterId) {
      throw new ExerciseError("Can only update your own custom exercises", 403);
    }
    return exercisesRepository.update(exerciseId, data);
  },

  async deleteExercise(requesterId: string, exerciseId: string) {
    const exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new ExerciseError("Exercise not found", 404);
    }
    if (!exercise.isCustom || exercise.createdById !== requesterId) {
      throw new ExerciseError("Can only delete your own custom exercises", 403);
    }
    return exercisesRepository.delete(exerciseId);
  }
};
