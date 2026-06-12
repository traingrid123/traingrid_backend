import { env } from "../../config/env";
import { logger } from "../../lib/logger";

const ENERGY_NUTRIENT_NUMBERS = new Set(["208"]);
const PROTEIN_NUTRIENT_NUMBERS = new Set(["203"]);
const FAT_NUTRIENT_NUMBERS = new Set(["204"]);
const CARB_NUTRIENT_NUMBERS = new Set(["205"]);
const FIBER_NUTRIENT_NUMBERS = new Set(["291", "293"]);

export type UsdaSearchHit = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: Array<{
    nutrientId?: number;
    nutrientName?: string;
    nutrientNumber?: string;
    value?: number;
    unitName?: string;
  }>;
};

export type UsdaFoodDetail = UsdaSearchHit & {
  labelNutrients?: Record<string, { value?: number }>;
};

export type NormalizedMacros = {
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatsPer100g: number | null;
  fiberPer100g: number | null;
};

class UsdaApiError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
    this.name = "UsdaApiError";
  }
}

async function fetchWithRetry(
  url: string,
  options: { timeoutMs?: number; retries?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10000, retries = 2 } = options;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
          attempt += 1;
          continue;
        }
        throw new UsdaApiError(`USDA upstream ${res.status}`, res.status, true);
      }
      return res;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt >= retries) break;
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
      attempt += 1;
    }
  }

  if (lastError instanceof UsdaApiError) throw lastError;
  throw new UsdaApiError(
    `USDA request failed: ${(lastError as Error)?.message ?? "unknown"}`,
    502,
    true
  );
}

export const usdaClient = {
  isConfigured(): boolean {
    return Boolean(env.USDA_API_KEY);
  },

  async search(query: string, pageSize = 25): Promise<UsdaSearchHit[]> {
    if (!env.USDA_API_KEY) return [];
    const url = new URL(`${env.USDA_BASE_URL}/foods/search`);
    url.searchParams.set("api_key", env.USDA_API_KEY);
    url.searchParams.set("query", query);
    url.searchParams.set("pageSize", String(Math.min(Math.max(pageSize, 1), 50)));
    url.searchParams.set(
      "dataType",
      "Foundation,SR Legacy,Branded,Survey (FNDDS)"
    );

    try {
      const res = await fetchWithRetry(url.toString());
      if (!res.ok) {
        throw new UsdaApiError(`USDA search ${res.status}`, res.status, false);
      }
      const body = (await res.json()) as { foods?: UsdaSearchHit[] };
      return body.foods ?? [];
    } catch (err) {
      logger.warn({ err, query }, "USDA search failed");
      throw err;
    }
  },

  async detail(fdcId: string | number): Promise<UsdaFoodDetail | null> {
    if (!env.USDA_API_KEY) return null;
    const url = new URL(`${env.USDA_BASE_URL}/food/${fdcId}`);
    url.searchParams.set("api_key", env.USDA_API_KEY);
    url.searchParams.set("format", "full");

    try {
      const res = await fetchWithRetry(url.toString());
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new UsdaApiError(`USDA detail ${res.status}`, res.status, false);
      }
      return (await res.json()) as UsdaFoodDetail;
    } catch (err) {
      logger.warn({ err, fdcId }, "USDA detail failed");
      throw err;
    }
  },

  normalizeMacros(food: UsdaSearchHit | UsdaFoodDetail): NormalizedMacros {
    const nutrients = food.foodNutrients ?? [];
    const grab = (matchers: Set<string>, alt: RegExp) => {
      const exact = nutrients.find((n) =>
        n.nutrientNumber ? matchers.has(n.nutrientNumber) : false
      );
      if (exact?.value !== undefined) return exact.value;
      const fuzzy = nutrients.find((n) =>
        n.nutrientName ? alt.test(n.nutrientName) : false
      );
      return fuzzy?.value ?? null;
    };

    return {
      caloriesPer100g: grab(ENERGY_NUTRIENT_NUMBERS, /energy|calorie/i),
      proteinPer100g: grab(PROTEIN_NUTRIENT_NUMBERS, /protein/i),
      carbsPer100g: grab(CARB_NUTRIENT_NUMBERS, /carbohydrate/i),
      fatsPer100g: grab(FAT_NUTRIENT_NUMBERS, /total lipid|^fat/i),
      fiberPer100g: grab(FIBER_NUTRIENT_NUMBERS, /fiber|fibre/i)
    };
  }
};

export { UsdaApiError };
