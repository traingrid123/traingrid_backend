import { Prisma } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { UsdaApiError, usdaClient, UsdaSearchHit } from "./usda.client";

export class FoodsError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "FoodsError";
  }
}

function buildSearchVector(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFresh(updatedAt: Date): boolean {
  const maxAgeMs = env.USDA_CACHE_TTL_HOURS * 3_600_000;
  return Date.now() - updatedAt.getTime() < maxAgeMs;
}

function mapCacheRow(row: any) {
  return {
    fdcId: row.fdcId,
    description: row.description,
    brandOwner: row.brandOwner,
    dataType: row.dataType,
    servingSize: row.servingSize ? Number(row.servingSize) : null,
    servingSizeUnit: row.servingSizeUnit,
    caloriesPer100g: row.caloriesPer100g ? Number(row.caloriesPer100g) : null,
    proteinPer100g: row.proteinPer100g ? Number(row.proteinPer100g) : null,
    carbsPer100g: row.carbsPer100g ? Number(row.carbsPer100g) : null,
    fatsPer100g: row.fatsPer100g ? Number(row.fatsPer100g) : null,
    fiberPer100g: row.fiberPer100g ? Number(row.fiberPer100g) : null,
    source: "cache" as const
  };
}

function mapUsdaHit(hit: UsdaSearchHit) {
  const macros = usdaClient.normalizeMacros(hit);
  return {
    fdcId: String(hit.fdcId),
    description: hit.description,
    brandOwner: hit.brandOwner ?? null,
    dataType: hit.dataType ?? null,
    servingSize: hit.servingSize ?? null,
    servingSizeUnit: hit.servingSizeUnit ?? null,
    ...macros,
    source: "usda" as const
  };
}

async function upsertCache(hit: UsdaSearchHit) {
  const macros = usdaClient.normalizeMacros(hit);
  const data = {
    fdcId: String(hit.fdcId),
    description: hit.description,
    brandOwner: hit.brandOwner ?? null,
    dataType: hit.dataType ?? null,
    servingSize: hit.servingSize ? new Prisma.Decimal(hit.servingSize) : null,
    servingSizeUnit: hit.servingSizeUnit ?? null,
    caloriesPer100g: macros.caloriesPer100g
      ? new Prisma.Decimal(macros.caloriesPer100g)
      : null,
    proteinPer100g: macros.proteinPer100g
      ? new Prisma.Decimal(macros.proteinPer100g)
      : null,
    carbsPer100g: macros.carbsPer100g
      ? new Prisma.Decimal(macros.carbsPer100g)
      : null,
    fatsPer100g: macros.fatsPer100g ? new Prisma.Decimal(macros.fatsPer100g) : null,
    fiberPer100g: macros.fiberPer100g
      ? new Prisma.Decimal(macros.fiberPer100g)
      : null,
    raw: hit as unknown as Prisma.InputJsonValue,
    searchVector: buildSearchVector(`${hit.description} ${hit.brandOwner ?? ""}`),
    lastFetchedAt: new Date()
  };

  return prisma.foodCache.upsert({
    where: { fdcId: data.fdcId },
    create: data,
    update: {
      ...data,
      hitCount: { increment: 1 } as any
    }
  });
}

export const foodsService = {
  async search(query: string, limit: number) {
    const vector = buildSearchVector(query);
    const tokens = vector.split(" ").filter(Boolean);
    if (tokens.length === 0) return { items: [], source: "cache" as const };

    const cacheHits = await prisma.foodCache.findMany({
      where: {
        OR: tokens.map((token) => ({
          searchVector: { contains: token }
        }))
      },
      orderBy: [{ hitCount: "desc" }, { updatedAt: "desc" }],
      take: limit
    });

    if (cacheHits.length >= Math.min(limit, 8)) {
      // Touch hit counts asynchronously
      prisma.foodCache
        .updateMany({
          where: { id: { in: cacheHits.map((h) => h.id) } },
          data: { hitCount: { increment: 1 } as any }
        })
        .catch((err) => logger.warn({ err }, "foodCache touch failed"));

      return {
        items: cacheHits.map(mapCacheRow),
        source: "cache" as const
      };
    }

    if (!usdaClient.isConfigured()) {
      return { items: cacheHits.map(mapCacheRow), source: "cache" as const };
    }

    try {
      const remote = await usdaClient.search(query, limit);
      // Persist to cache (fire and forget but await first 5 to ensure determinism)
      await Promise.all(remote.slice(0, 10).map((hit) => upsertCache(hit).catch(() => null)));
      remote.slice(10).forEach((hit) => {
        upsertCache(hit).catch(() => null);
      });

      const remoteMapped = remote.map(mapUsdaHit);
      const seen = new Set(cacheHits.map((row) => row.fdcId));
      const merged = [
        ...cacheHits.map(mapCacheRow),
        ...remoteMapped.filter((hit) => !seen.has(hit.fdcId))
      ].slice(0, limit);

      return { items: merged, source: "mixed" as const };
    } catch (err) {
      if (err instanceof UsdaApiError) {
        if (cacheHits.length > 0) {
          return { items: cacheHits.map(mapCacheRow), source: "cache" as const };
        }
        throw new FoodsError(
          `USDA upstream unavailable (${err.status})`,
          err.retryable ? 503 : 502
        );
      }
      throw err;
    }
  },

  async detail(fdcId: string) {
    const cached = await prisma.foodCache.findUnique({ where: { fdcId } });
    if (cached && isFresh(cached.updatedAt)) {
      return mapCacheRow(cached);
    }

    if (!usdaClient.isConfigured()) {
      if (cached) return mapCacheRow(cached);
      throw new FoodsError("Food not in cache and USDA unavailable", 404);
    }

    try {
      const remote = await usdaClient.detail(fdcId);
      if (!remote) {
        if (cached) return mapCacheRow(cached);
        throw new FoodsError("Food not found", 404);
      }
      const saved = await upsertCache(remote);
      return mapCacheRow(saved);
    } catch (err) {
      if (cached) return mapCacheRow(cached);
      if (err instanceof UsdaApiError) {
        throw new FoodsError(
          `USDA upstream unavailable (${err.status})`,
          err.retryable ? 503 : 502
        );
      }
      throw err;
    }
  },

  async refresh(fdcId: string) {
    if (!usdaClient.isConfigured()) {
      throw new FoodsError("USDA not configured", 503);
    }
    const remote = await usdaClient.detail(fdcId);
    if (!remote) throw new FoodsError("Food not found", 404);
    const saved = await upsertCache(remote);
    return mapCacheRow(saved);
  }
};
