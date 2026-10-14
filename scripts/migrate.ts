import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
import { config } from "../src/config.js";

const migrationsDir = new URL("../migrations/", import.meta.url);

async function withClient(connectionString: string, run: (client: pg.Client) => Promise<void>) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
}

async function createDatabaseIfMissing(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const name = url.pathname.slice(1);
  url.pathname = "/postgres";

  await withClient(url.href, async (client) => {
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) await client.query(`CREATE DATABASE ${client.escapeIdentifier(name)}`);
  });
}

async function applyMigrations(client: pg.Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const pending = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql") && !applied.has(file))
    .sort();

  for (const file of pending) {
    const sql = await readFile(new URL(file, migrationsDir), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log(`Applied ${file}`);
  }

  if (pending.length === 0) console.log("No pending migrations");
}

if (config.env === "test") await createDatabaseIfMissing(config.databaseUrl);
await withClient(config.databaseUrl, applyMigrations);
