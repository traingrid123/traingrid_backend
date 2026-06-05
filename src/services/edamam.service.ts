import axios from 'axios';

const EDAMAM_BASE_URL = 'https://api.edamam.com';
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || '';
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || '';

const edamamClient = axios.create({
  baseURL: EDAMAM_BASE_URL,
  params: {
    app_id: EDAMAM_APP_ID,
    app_key: EDAMAM_APP_KEY
  }
});

export interface EdamamRecipe {
  uri: string;
  label: string;
  image: string;
  source: string;
  url: string;
  yield: string;
  dietLabels?: string[];
  healthLabels?: string[];
  cautions?: string[];
  ingredientLines: string[];
  ingredients: string[];
  calories: number;
  totalCO2Emissions?: number;
  co2EmissionsClass?: string;
  totalTime: number;
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
}

export interface EdamamRecipeSearchResponse {
  count: number;
  from: number;
  to: number;
  q: string;
  hits: EdamamRecipe[];
}

export interface EdamamNutrients {
  uri: string;
  totalDaily: {
    calories: number;
    protein: { value: number; unit: string };
    fat: { value: number; unit: string };
    carbohydrates: { value: number; unit: string };
    fiber: { value: number; unit: string };
  };
  totalNutrients: {
    CA: { label: string; quantity: number; unit: string };
  };
  dietLabels: string[];
  healthLabels: string[];
}

export const edamamService = {
  // Search recipes
  searchRecipes: async (query: string, options: {
    type?: 'public';
    diet?: string[];
    health?: string[];
    cuisineType?: string[];
    mealType?: string[];
    dishType?: string[];
    calories?: string;
    exclude?: string;
    number?: number;
  } = {}) => {
    try {
      const params: any = {
        type: 'public',
        q: query,
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        number: options.number || 10
      };

      if (options.diet?.length) params.diet = options.diet.join(',');
      if (options.health?.length) params.health = options.health.join(',');
      if (options.cuisineType?.length) params.cuisineType = options.cuisineType.join(',');
      if (options.mealType?.length) params.mealType = options.mealType.join(',');
      if (options.dishType?.length) params.dishType = options.dishType.join(',');
      if (options.calories) params.calories = options.calories;
      if (options.exclude) params.exclude = options.exclude;

      const response = await edamamClient.get<EdamamRecipeSearchResponse>('/api/recipes/v2', { params });
      return response.data;
    } catch (error: any) {
      console.error('Edamam API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to search recipes');
    }
  },

  // Get recipe details
  getRecipeDetails: async (recipeId: string) => {
    try {
      const response = await edamamClient.get<EdamamRecipe>(`/api/recipes/v2/${recipeId}`, {
        params: {
          type: 'public',
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Edamam API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch recipe details');
    }
  },

  // Get recipe nutrition info
  getRecipeNutrition: async (recipeId: string) => {
    try {
      const response = await edamamClient.get<EdamamNutrients>(`/api/recipes/v2/${recipeId}/nutrition`, {
        params: {
          type: 'public',
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Edamam API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch recipe nutrition');
    }
  },

  // Search by ingredients
  searchByIngredients: async (ingredients: string[], options: {
    number?: number;
    diet?: string[];
    health?: string[];
  } = {}) => {
    try {
      const params: any = {
        type: 'public',
        ingredients: ingredients.join(','),
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        number: options.number || 10
      };

      if (options.diet?.length) params.diet = options.diet.join(',');
      if (options.health?.length) params.health = options.health.join(',');

      const response = await edamamClient.get('/api/recipes/v2/byIngredients', { params });
      return response.data;
    } catch (error: any) {
      console.error('Edamam API Error:', error.response?.data || error.message);
      throw new Error('Failed to search by ingredients');
    }
  },

  // Get parsed recipe ingredients
  getRecipeIngredients: async (recipeId: string) => {
    try {
      const response = await edamamClient.get(`/api/recipes/v2/${recipeId}/ingredientList`, {
        params: {
          type: 'public',
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Edamam API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch recipe ingredients');
    }
  }
};