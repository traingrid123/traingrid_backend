import axios from 'axios';

const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

const exerciseDBClient = axios.create({
  baseURL: EXERCISEDB_BASE_URL,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
  }
});

export interface ExerciseDBExercise {
  id: string | number;
  name: string;
  bodyPart: string[];
  target: string;
  equipment: string;
  gifUrl?: string;
  instructions?: string[];
  force?: string;
  level?: string;
  mechanic?: string;
}

export const exerciseDBService = {
  // Get all exercises with filters
  getExercises: async (params: {
    limit?: number;
    offset?: number;
    bodyPart?: string;
    target?: string;
    equipment?: string;
    force?: string;
    level?: string;
  } = {}) => {
    try {
      const response = await exerciseDBClient.get('/exercises', { params });
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch exercises');
    }
  },

  // Get exercise by ID
  getExerciseById: async (id: string) => {
    try {
      const response = await exerciseDBClient.get(`/exercises/exercise/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch exercise');
    }
  },

  // Search exercises by name
  searchExercises: async (query: string, limit: number = 10) => {
    try {
      const response = await exerciseDBClient.get(`/exercises/name/${encodeURIComponent(query)}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to search exercises');
    }
  },

  // Get exercises by body part
  getByBodyPart: async (bodyPart: string, limit: number = 50) => {
    try {
      const response = await exerciseDBClient.get(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch exercises by body part');
    }
  },

  // Get exercises by equipment
  getByEquipment: async (equipment: string, limit: number = 50) => {
    try {
      const response = await exerciseDBClient.get(`/exercises/equipment/${encodeURIComponent(equipment)}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch exercises by equipment');
    }
  },

  // Get all body parts
  getBodyParts: async () => {
    try {
      const response = await exerciseDBClient.get('/exercises/bodyPartList');
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch body parts');
    }
  },

  // Get all equipment
  getEquipmentList: async () => {
    try {
      const response = await exerciseDBClient.get('/exercises/equipmentList');
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch equipment');
    }
  },

  // Get all targets (muscle groups)
  getTargetList: async () => {
    try {
      const response = await exerciseDBClient.get('/exercises/targetList');
      return response.data;
    } catch (error: any) {
      console.error('ExerciseDB API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch targets');
    }
  }
};