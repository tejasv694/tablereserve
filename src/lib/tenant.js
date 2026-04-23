import { PrismaClient } from "@prisma/client";

// Cache Prisma clients by slug so we don't create a new DB connection on every request
const clientCache = new Map();

/**
 * Converts a restaurant slug to the environment variable key.
 * e.g. "mario-ristorante" → "DATABASE_URL__MARIO_RISTORANTE"
 */
function slugToEnvKey(slug) {
  return `DATABASE_URL__${slug.toUpperCase().replace(/-/g, "_")}`;
}

/**
 * Returns a Prisma client connected to the correct restaurant database.
 * Resolves the DB URL from environment variables using the slug naming convention.
 * Caches clients per slug to reuse connections.
 */
export function getPrismaClient(slug) {
  if (clientCache.has(slug)) {
    return clientCache.get(slug);
  }

  const envKey = slugToEnvKey(slug);
  const databaseUrl = process.env[envKey] || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `No database URL found for slug "${slug}" (tried ${envKey} and DATABASE_URL)`
    );
  }

  const client = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  clientCache.set(slug, client);
  return client;
}

/**
 * Fetches the Restaurant record from the tenant's database by slug.
 * Returns null if not found.
 */
export async function getRestaurant(slug) {
  const prisma = getPrismaClient(slug);
  return prisma.restaurant.findUnique({ where: { slug } });
}
