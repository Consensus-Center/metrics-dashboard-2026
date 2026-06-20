import { Pool, type QueryResultRow } from 'pg'

/**
 * Single shared pg Pool. In development Next.js hot-reloads modules, so we cache
 * the pool on globalThis to avoid exhausting connections. In production each
 * serverless instance keeps its own small pool.
 *
 * The connection string points at the Retool DB (Neon) POOLED endpoint
 * (host contains "-pooler"), which is the right choice for serverless.
 */
const globalForPg = globalThis as unknown as { pgPool?: Pool }

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local (local) or Vercel env vars.')
  }
  return new Pool({
    connectionString,
    // Neon/Retool require TLS; the cert chain is managed by the provider.
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
}

export const pool: Pool = globalForPg.pgPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params)
}
