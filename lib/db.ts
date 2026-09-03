import postgres from 'postgres';

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);

// Lazy DB connection: app boots before Postgres is ready.
// Only throws when something actually queries.
export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!global.__sql) {
    global.__sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      prepare: false,
    });
  }
  return global.__sql;
}
