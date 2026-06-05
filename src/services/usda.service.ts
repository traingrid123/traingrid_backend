import axios from 'axios';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_API_KEY || '';

const usdaClient = axios.create({
  baseURL: USDA_BASE_URL,
  params: {
    api_key: USDA_API_KEY
  }
});

export interface USDASearchResult {
  foods: any[];
  currentPage: number;
  totalPages: number;
  totalSearchHits: number;
}

export interface USDFood {
  fdcId: string;
  description: string;
  dataType: string;
  brandOwner?: string;
  gtinUpc?: string;
  ingredients?: string;
  allHighlightFields?: string[];
  score?: number;
}

export interface USDAFoodNutrients {
  fdcId: string;
  description: string;
  labelNutrients: {
    protein?: { value: number; unitName: string };
    totalCarbohydrate?: { value: number; unitName: string };
    totalLipid?: { value: number; unitName: string };
    energy?: { value: number; unitName: string };
    fiber?: { value: number; unitName: string };
    calcium?: { value: number; unitName: string };
    iron?: { value: number; unitName: string };
    vitaminC?: { value: number; unitName: string };
  };
}

export const usdaService = {
  // Search foods by name
  searchFoods: async (query: string, limit: number = 20) => {
    try {
      const response = await usdaClient.get<USDASearchResult>('/foods/search', {
        params: {
          query,
          pageSize: limit,
          dataType: ['Foundation', 'Branded'],
          pageSize: limit,
          pageNumber: 1
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('USDA API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to search foods');
    }
  },

  // Get food details by FDC ID
  getFoodDetails: async (fdcId: string) => {
    try {
      const response = await usdaClient.get<USDFood>(`/food/${fdcId}`, {
        params: {
          format: 'full'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('USDA API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch food details');
    }
  },

  // Get food nutrients (simplified, returns key nutrients)
  getFoodNutrients: async (fdcId: string) => {
    try {
      const response = await usdaClient.get<USDAFoodNutrients>(`/food/${fdcId}`, {
        params: {
          format: 'full',
          nutrients: '203,204,205,208,269' // Energy, Protein, Fat, Carbs, Fiber
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('USDA API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch food nutrients');
    }
  },

  // Calculate calories from macros
  calculateCalories: (protein: number, carbs: number, fat: number) => {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  },

  // Extract nutrient value safely
  getNutrientValue: (nutrients: any, nutrientName: string) => {
    const nutrient = nutrients?.labelNutrients?.[nutrientName];
    return nutrient?.value || 0;
  }
};